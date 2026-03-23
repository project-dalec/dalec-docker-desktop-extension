import { exec } from 'child_process';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const FALLBACK_OS_TARGETS = ['azlinux3'];

// Attempt to fetch OS targets from docker buildx, fallback to curated list if not available.
export async function fetchOsList() {
  let dir;
  try {
    dir = await mkdtemp(join(tmpdir(), 'dalec-'));
    await writeFile(join(dir, 'Dockerfile'), '{}');

    const cmd = `docker buildx build --call targets,format=json --build-arg BUILDKIT_SYNTAX=ghcr.io/project-dalec/dalec/frontend:latest "${dir}"`;

    const stdout = await new Promise((resolve, reject) => {
      exec(cmd, { timeout: 10000 }, (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout);
      });
    });

    const result = JSON.parse(stdout);

    if (result && Array.isArray(result.targets)) {
      const targets = result.targets
        .map(t => t.name)
        .filter(name => name.endsWith('/container/depsonly'))
        .map(name => name.replace('/container/depsonly', ''));

      if (targets.length > 0) return targets;
    }

    console.warn('No valid targets in docker buildx response, using fallback');
    return FALLBACK_OS_TARGETS;
  } catch (err) {
    console.warn('Failed to fetch OS list from docker buildx, using fallback:', err.message);
    return FALLBACK_OS_TARGETS;
  } finally {
    if (dir) rm(dir, { recursive: true }).catch(() => {});
  }
}
