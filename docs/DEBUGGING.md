# Debugging

Practical troubleshooting for when the extension doesn't load or builds fail. The architecture this doc assumes is described in [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Background you need

- The backend runs in a container inside an extension VM managed by Docker Desktop.
- It listens on a **Unix socket** (`/run/guest-services/backend.sock` inside the container), not a TCP port.
- The frontend reaches it through `ddClient.extension.vm.service`, which the Docker Desktop framework proxies over that socket. These requests **do not show up in the browser DevTools Network tab** — they are not `fetch()` calls. Debugging therefore relies on the **Console** (frontend side) and **backend container logs** (backend side).

Anything in old notes referring to `http://localhost:8080`, CORS, or SSE on `/api/build/:id/log` is obsolete.

---

## Open the extension's DevTools

```bash
docker extension dev debug dalec/dalec-docker-extension:latest
```

The next click on the Dalec tab opens a Chrome DevTools window scoped to the extension iframe. Use the Console tab to inspect errors and any logs the frontend prints. To stop DevTools opening automatically:

```bash
docker extension dev reset dalec/dalec-docker-extension:latest
```

You can also manually invoke backend endpoints from the Console to test them:

```js
// Assumes the extension iframe scope — ddClient is injected globally by the framework
await ddClient.extension.vm.service.get('/api/health')
await ddClient.extension.vm.service.get('/api/os')
await ddClient.extension.vm.service.get('/api/packages')
```

---

## Find the backend container

```bash
docker ps -a --filter "label=com.docker.compose.project"
```

Look for an entry whose image name starts with `dalec/dalec-docker-extension`. That is the backend.

Tail its logs:

```bash
docker logs <backend-container-id> --tail 200 -f
```

A healthy startup looks like:

```
[startup] Dalec extension backend listening on socket: /run/guest-services/backend.sock
[startup] Public directory contents: [ 'index.html', 'assets', ... ]
```

Every incoming request is logged by the middleware in [server.ts](../backend/src/server.ts) as `[req] <METHOD> <url>`, so you can confirm the frontend reached the backend at all.

---

## Symptom map

### The Dalec tab is missing from the sidebar

- Extensions disabled: Settings → Extensions → Enable Docker Extensions
- Extension not installed: `docker extension ls` — if absent, run `make install-extension`
- After install, restart Docker Desktop if the sidebar doesn't refresh

### The tab opens but shows a white screen

- Open DevTools (see above). Look for module-load or script errors in the Console.
- `index.html` may be missing from the extension image. The backend startup log prints the contents of `./public`; if it reports `index.html missing`, rebuild:
  ```bash
  make update-extension
  ```

### OS targets don't load / dropdown is empty

The frontend calls `GET /api/os`. The backend runs `docker buildx build --call targets ...` against the Dalec frontend image; on failure it returns a hardcoded fallback list.

- Check the Console for a `getAvailableTargets` error.
- In backend logs, look for:
  ```
  Failed to fetch OS list from docker buildx, using fallback: ...
  ```
  The fallback list is still functional — this just means buildx could not reach the Dalec frontend image. Check `docker buildx ls` and connectivity to `ghcr.io`.

### Build starts then immediately fails

The backend validates `imageName`, `osTarget`, and `yamlSpec` before spawning anything. A 400 response from `POST /api/build` means validation rejected the payload; the frontend surfaces the error text in the log viewer or as a toast.

- `"Invalid imageName format"` — image name has a space or shell metacharacter
- `"Invalid osTarget format"` — target isn't `<id>/<sub>` (e.g. `azlinux3/container`)
- `"Invalid yamlSpec format"` — the first non-empty line doesn't start with `#syntax=`. The generator should always produce this; if it doesn't, there's a bug in [yamlGenerator.ts](../ui/src/utils/yamlGenerator.ts).

Backend logs also show these:

```
[build] Invalid imageName: <value>
[build] Invalid osTarget: <value>
[build] Invalid yamlSpec (missing #syntax=)
```

### Build hangs with no logs

- First build on a fresh machine pulls `ghcr.io/project-dalec/dalec/frontend:latest` — allow 2–5 minutes.
- Backend logs should show `[buildManager] Spawned process for build <uuid>` immediately, then `[buildManager] [<uuid>] Output:` once BuildKit emits anything.
- If you see the spawn line but no output, BuildKit is likely stuck pulling the frontend image. Try a plain `docker build` from the terminal with the Dalec `#syntax=` directive to confirm connectivity.

### Build fails with "Exited with code N"

The `docker build` child process returned non-zero. The backend just reports the exit code; the actual cause is in the streamed logs visible in the UI.

Common cases:

- Package not found in the selected distro's repos — remove it or pick a different OS target.
- Network issue pulling a base image — retry, or `docker pull` the base manually first.
- Version constraint impossible to satisfy — loosen the constraint.

### Log stream stops updating mid-build

The frontend polls `GET /api/build/:id/status` every `BUILD_POLL_INTERVAL_MS` (see [constants/targets.ts](../ui/src/constants/targets.ts)). If the UI is still "building" but no new lines arrive:

- Check the Console for `Error polling build status: ...` — the polling loop stops on any error.
- Backend logs should keep showing the periodic `GET /api/build/<id>/status` entries. If they also stop, the backend likely crashed.
- If polling is still running but `logs[]` is unchanged, the build process is genuinely producing no output (BuildKit silent stage).

### "Build not found" (404)

`BuildManager` evicts completed / failed builds 10 minutes after they finished. If the UI queries status beyond that window, you'll get a 404. Click "New build" to start fresh.

### Digest is missing on the Image Details card

After a successful build, the backend runs `docker inspect --format={{.Id}} <imageName>` to capture the digest. If inspect fails (unusual — the image was just built in the same daemon), the backend proceeds without a digest and logs:

```
[buildManager] Could not inspect image <imageName>: <reason>
```

---

## Force a clean rebuild

When things are weird and you want a known-good baseline:

```bash
docker extension rm dalec/dalec-docker-extension:latest
docker buildx build -t dalec/dalec-docker-extension:latest . --load --no-cache
docker extension install dalec/dalec-docker-extension:latest -f
```

Restart Docker Desktop afterwards if the UI still misbehaves.

---

## Collecting info for a bug report

```bash
docker extension ls
docker info
docker ps -a --filter "label=com.docker.compose.project"
docker logs <backend-container-id> --tail 500 > backend-logs.txt
```

Include:

- Output of the four commands above
- Console errors (from the extension DevTools)
- Reproduction steps (exact OS target, packages, metadata you entered)
- Operating system and Docker Desktop version
