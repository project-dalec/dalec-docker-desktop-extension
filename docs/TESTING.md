# Manual Testing

This doc is the full manual test pass — install verification, smoke tests, and scenario-driven checks. Automated tests are run via `make test`; this covers behavior that only makes sense through the UI.

## Prerequisites

- [ ] Docker Desktop is installed and running
- [ ] Extensions are enabled (Docker Desktop → Settings → Extensions)
- [ ] BuildKit is active (default in modern Docker Desktop)
- [ ] Terminal access for verification commands

## 1. Install

```bash
make install-extension
```

or

```bash
docker buildx build -t dalec/dalec-docker-extension:latest . --load
docker extension install dalec/dalec-docker-extension:latest -f
```

- [ ] Build completes without errors
- [ ] `docker extension ls` shows `dalec/dalec-docker-extension:latest`
- [ ] A **Dalec** tab appears in the Docker Desktop left sidebar

## 2. Smoke test

- [ ] Open Docker Desktop and click the Dalec tab
- [ ] The Configure step renders with no error toast
- [ ] OS target dropdown populates (dynamic list from Dalec frontend, or fallback list)
- [ ] The runtime dependency scope already contains `curl` and `bash` (from `INITIAL_SPEC`)
- [ ] No errors in Chrome DevTools console (`docker extension dev debug dalec/dalec-docker-extension:latest`)

## 3. Basic build

Fill in:

- Name: `test-dalec`
- Version: `0.1.0`
- Description, License, Website: anything (these are required fields)
- OS target: `azlinux3` (or any RPM/deb target)
- Runtime packages: keep `curl`, `bash`
- Entrypoint: leave blank (placeholder shows `/usr/bin/curl`)

Click **Next → Preview → Build**.

- [ ] YAML preview shows a valid Dalec spec with `#syntax=` on the first line
- [ ] Build command preview shows `docker build -t test-dalec:0.1.0 --target=<osTarget>/container ...`
- [ ] Logs stream in real-time (polling cadence ~2s)
- [ ] On success, the Image Details card shows the image name, digest, OS target, package count, entrypoint, cmd, and a "now" timestamp (hover for full time)
- [ ] Copy buttons for image name and digest work
- [ ] "New build" button resets back to step 1

Verify the image:

```bash
docker images test-dalec:0.1.0
docker inspect test-dalec:0.1.0
docker run --rm test-dalec:0.1.0   # exits with curl's default message
```

## 4. Input validation

The backend rejects builds with invalid input.

- [ ] Image name with a space → "Invalid imageName format" (backend validator rejects)
- [ ] Tampered `osTarget` with a semicolon → 400
- [ ] YAML spec missing `#syntax=` on the first line → 400

Backend validator tests cover these cases in `backend/src/validators.test.ts`; these manual steps confirm the UI surfaces the error.

## 5. Package management

- [ ] Adding a package from the search autocomplete appears in the selected list
- [ ] Adding a version constraint (e.g. `>= 1.0`) shows up in the YAML preview
- [ ] Removing a package removes it from the preview
- [ ] Switching across the four dependency scopes (runtime / build / recommends / test) keeps each list independent
- [ ] The RPM vs deb label for packages (shown in the manager) matches the selected target family

## 6. Log viewer

- [ ] Auto-scroll works while the build runs
- [ ] Scrolling up disables auto-scroll, scrolling to the bottom re-enables it (check the actual behavior in [BuildLog.tsx](../ui/src/components/BuildLog.tsx))
- [ ] "Clear logs" empties the viewer without affecting the underlying build state
- [ ] Color coding: errors red, warnings yellow, stages blue (approximate — categorization is regex-based in `yamlGenerator.ts` / `BuildLog.tsx`)

## 7. Error handling

Force failures and confirm the UI stays usable:

- [ ] Stop Docker daemon mid-build → build shows "failed", logs include the exit code, Image Details does not render
- [ ] Request a non-existent package (e.g. `definitely-not-real-xyz`) → build fails with a package manager error inside the logs
- [ ] After a failed build, starting a new one works without refreshing

## 8. Performance

Rough expectations, not strict thresholds:

- [ ] First build on a machine: 2–5 min (pulls the Dalec frontend image)
- [ ] Subsequent builds of the same OS target: ~30–90s with cache
- [ ] UI remains responsive during streaming logs (no long tasks locking the main thread)

## 9. Docs sanity

- [ ] `README.md` commands work copy-paste
- [ ] `docs/ARCHITECTURE.md` API table matches [server.ts](../backend/src/server.ts)
- [ ] `docs/DEBUGGING.md` steps match current socket path and endpoints

## 10. Uninstall

```bash
docker extension rm dalec/dalec-docker-extension:latest
```

- [ ] Extension disappears from the sidebar
- [ ] `docker extension ls` no longer lists it

## Collecting debug info on failure

If any test fails, capture:

```bash
docker extension ls
docker ps -a --filter "label=com.docker.compose.project"
docker logs <backend-container-id> --tail 200
```

See [DEBUGGING.md](./DEBUGGING.md) for per-symptom diagnosis.
