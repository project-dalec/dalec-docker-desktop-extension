# Architecture

## Overview

The extension is a standard Docker Desktop extension composed of two parts:

- A **frontend** (React + MUI + Vite, TypeScript) served as static assets by Docker Desktop.
- A **backend** (Express, TypeScript) running inside an extension VM container and reachable only via a Unix domain socket exposed through the extension framework.

All communication goes through `ddClient` from `@docker/extension-api-client`. The backend does not bind to a TCP port; it is not reachable from the host network. The only actor that can talk to the backend is the extension's own frontend running in the Docker Desktop UI.

```
┌───────────────────────────────────────────────────────────────┐
│                   Docker Desktop UI                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Frontend (React)                                        │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐  │  │
│  │  │  Configure   │ │   Preview    │ │     Build       │  │  │
│  │  │     step     │ │    step      │ │      step       │  │  │
│  │  └──────────────┘ └──────────────┘ └─────────────────┘  │  │
│  │            generateYAML(spec) → Dalec spec               │  │
│  │            ddClient.extension.vm.service                 │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────┬────────────────────────────────────┘
                           │  Unix socket: /run/guest-services/backend.sock
                           ▼
┌───────────────────────────────────────────────────────────────┐
│  Backend container (node:22-alpine)                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Express app (server.ts)                                 │  │
│  │  /api/health   /api/os   /api/packages                  │  │
│  │  POST /api/build   GET /api/build/:id/status            │  │
│  │  ├─ validators.ts  (allowlist regex for imageName,      │  │
│  │  │                  osTarget, and yamlSpec)             │  │
│  │  ├─ osProvider.ts  (docker buildx build --call targets) │  │
│  │  ├─ packageProvider.ts  (static suggestion list)        │  │
│  │  └─ buildManager.ts  (spawns docker, buffers logs,      │  │
│  │                       inspects digest, 10-min TTL)      │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────┬────────────────────────────────────┘
                           │  mounted /var/run/docker.sock
                           ▼
┌───────────────────────────────────────────────────────────────┐
│  Docker daemon + BuildKit                                      │
│  docker build -t <image> --target <osTarget> <tmpDir>          │
│    Dockerfile's first line: "#syntax=ghcr.io/project-dalec/    │
│    dalec/frontend:latest" → BuildKit routes to Dalec frontend  │
└───────────────────────────────────────────────────────────────┘
```

## Build flow

```
User            Frontend                 Backend                  Docker
──────────────────────────────────────────────────────────────────────────
│ click Build    │                        │                         │
├───────────────►│                        │                         │
│                │ POST /api/build        │                         │
│                ├───────────────────────►│                         │
│                │                        │ validate payload        │
│                │                        │ write /tmp/dalec-build- │
│                │                        │   <uuid>/Dockerfile     │
│                │                        │ spawn docker build       │
│                │                        ├────────────────────────►│
│                │ { buildId, command }   │                         │
│                │◄───────────────────────┤                         │
│                │                        │                         │
│                │ setInterval(2s)        │                         │
│                │ GET /api/build/:id/    │                         │
│                │     status             │                         │
│                ├───────────────────────►│  (buffered logs)        │
│                │ { status, logs[] }     │                         │
│                │◄───────────────────────┤◄── stdout/stderr ───────┤
│ render new     │                        │                         │
│ log lines      │                        │                         │
│                │        ...             │                         │
│                │                        │ on close: docker inspect│
│                │                        ├────────────────────────►│
│                │                        │ digest captured          │
│                │ status === 'completed' │                         │
│                │ stop polling           │                         │
│                │◄───────────────────────┤                         │
│ show Image     │                        │                         │
│ Details card   │                        │                         │
```

The frontend does not use Server-Sent Events; it polls `/api/build/:id/status` every `BUILD_POLL_INTERVAL_MS` and reads `logs[]` delta since the last index it saw.

## API

All endpoints are served from the backend Express app on the Unix socket. The frontend reaches them via `ddClient.extension.vm.service`.

| Method | Path | Purpose | Response |
|--------|------|---------|----------|
| GET | `/api/health` | Health check | `{ status, time }` |
| GET | `/api/os` | List OS targets, dynamic via `docker buildx build --call targets` with a fallback list | `OsTarget[]` |
| GET | `/api/packages` | Static suggestion list of common package names | `string[]` |
| POST | `/api/build` | Validate payload, start build, return id | `{ buildId, command }` |
| GET | `/api/build/:id/status` | Current status + buffered logs + digest if complete | `BuildStatusResponse` |

Payload shapes are defined in [backend/src/types.ts](../backend/src/types.ts) and [ui/src/types/index.ts](../ui/src/types/index.ts).

## Frontend state

The frontend carries a single `ImageSpec` in `App.tsx`. `generateYAML(spec)` produces the Dalec YAML spec that is sent to the backend. Build state is separate — `building`, `buildDone`, `logLines`, `buildResult`.

```ts
ImageSpec {
  name, version, description, website, revision, license  // metadata
  target: Target | null                                     // OS target
  packages: { runtime, build, recommends, test }            // grouped by DepType, each with VersionConstraint[]
  entrypoint, cmd, workdir, user                            // runtime config
  envVars: KVItem[]
  labels:  KVItem[]
}
```

Component tree under `App.tsx`:

```
App
├── AppHeader
├── StepBar
├── ConfigureStep      (step 1)
│   ├── ImageConfig    (name, version, metadata, entrypoint, cmd, workdir, user)
│   ├── TargetSelect
│   ├── PackageManager (search + add across 4 DepType tabs)
│   │   └── PackageRow (with VersionConstraint editor)
│   └── KVList         (env vars, labels)
├── PreviewStep        (step 2)
│   └── YamlPreview
└── BuildStep          (step 3)
    ├── BuildLog
    └── ImageDetails   (shown on success)
```

## Backend

### buildManager

Keyed by build UUID. Each `BuildRecord` holds the buffered log chunks, status, optional error, resolved image digest, and creation/finish timestamps. Completed / failed records are swept 10 minutes after `finishedAt` by an interval timer that uses `unref()` so it never blocks process exit.

The command shape is:

```
docker build -t <imageName> --target=<osTarget> <tmpDir>
```

Where `<tmpDir>` is `/tmp/dalec-build-<uuid>/` containing a single file named `Dockerfile` whose content is the Dalec YAML spec with `#syntax=...` on the first line. BuildKit recognizes the `#syntax=` directive and delegates to the Dalec frontend image. The file is named `Dockerfile` for BuildKit compatibility, not because it contains Dockerfile content.

After a successful build, the manager runs `docker inspect --format={{.Id}} <imageName>` to capture the image digest.

### osProvider

On request, invokes:

```
docker buildx build --call targets,format=json \
  --build-arg BUILDKIT_SYNTAX=ghcr.io/project-dalec/dalec/frontend:latest -<<<"{}"
```

The Dalec frontend reports all available targets. The provider keeps only entries with `default: true`, dedupes by the first path segment (e.g. `azlinux3/container` → `azlinux3`), and infers the OS family (`deb` / `rpm` / `windows`) from the presence of companion targets like `<id>/deb` or `<id>/rpm`. If the call fails or the response is unusable, the provider returns a hardcoded fallback list — see [osProvider.ts](../backend/src/osProvider.ts).

### validators

Allowlist-style regex validation applied before any build is started:

- `imageName` — registry/path/tag/digest characters only
- `osTarget` — two-or-more slash-separated segments, each a restricted id
- `yamlSpec` — must be a non-empty string whose first non-empty line starts with `#syntax=`

Anything with shell metacharacters is rejected. Validation is layered, but the primary defense against shell injection is that the backend passes arguments to `spawn` as an array — no shell interpolation occurs.

## Threat model

- The backend container is never exposed to host networking; only the extension frontend running inside Docker Desktop can reach it.
- The only human actor is the Docker Desktop user, who already has full Docker daemon access. The extension gives them a more convenient way to build images — not additional privileges.
- Input is validated (allowlist) and passed to child processes as argv arrays. The YAML spec is written to disk and never interpolated into a shell command.

## Where to read next

- [DEBUGGING.md](./DEBUGGING.md) — troubleshooting when the extension doesn't load or builds fail
- [TESTING.md](./TESTING.md) — manual test scenarios and pre-release smoke checks
