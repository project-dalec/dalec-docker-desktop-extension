import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { spawn, execFile, ChildProcessWithoutNullStreams } from 'child_process';
import crypto from 'crypto';
import type { StartBuildPayload } from './types.js';

type BuildStatus = 'running' | 'completed' | 'failed';

interface BuildRecord {
  logs: string[];
  status: BuildStatus;
  error: string | null;
  emitter: EventEmitter;
  command: string;
  imageName: string;
  osTarget: string;
  packages: string[];
  digest?: string;
  createdAt: number;
  finishedAt?: number;
}

class BuildManager {
  private readonly builds = new Map<string, BuildRecord>();
  private readonly ttlMs = 10 * 60 * 1000;
  private readonly cleanupIntervalMs = 60 * 1000;
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => this.evictExpiredBuilds(), this.cleanupIntervalMs);
    // Don't keep the process alive just for cleanup
    this.cleanupTimer.unref?.();
  }

  private evictExpiredBuilds(now = Date.now()) {
    for (const [id, record] of this.builds) {
      if (record.status === 'running') continue;
      if (!record.finishedAt) continue;
      if (now - record.finishedAt < this.ttlMs) continue;
      this.builds.delete(id);
    }
  }

  startBuild(payload: StartBuildPayload): { id: string; command: string } {
    const { imageName, osTarget, yamlSpec, packages } = payload;

    const id      = crypto.randomUUID();
    const emitter = new EventEmitter();
    const tmpDir  = `/tmp/dalec-build-${id}`;

    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'Dockerfile'), yamlSpec);

    const args = ['build', '-t', imageName, `--target=${osTarget}`, tmpDir];
    const cmd = `DOCKER_BUILDKIT=1 docker ${args.join(' ')}`;

    console.log(`[buildManager] Starting build ${id}:`, { imageName, osTarget, packages });
    console.log('[buildManager] Command:', cmd);

    const record: BuildRecord = {
      logs: [],
      status: 'running',
      error: null,
      emitter,
      command: cmd,
      imageName,
      osTarget,
      packages,
      createdAt: Date.now(),
    };

    this.builds.set(id, record);

    const child: ChildProcessWithoutNullStreams = spawn('docker', args, {
      env: { ...process.env, DOCKER_BUILDKIT: '1' },
    });

    console.log(`[buildManager] Spawned process for build ${id}`);

    const pushLog = (chunk: Buffer) => {
      const text = chunk.toString();
      console.log(`[buildManager] [${id}] Output:`, text);
      record.logs.push(text);
      emitter.emit('log', text);
    };

    child.stdout.on('data', pushLog);
    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      console.error(`[buildManager] [${id}] Error:`, text);
      pushLog(chunk);
    });

    child.on('close', (code: number | null) => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      console.log(`[buildManager] Build ${id} closed with code ${code}`);
      record.status = code === 0 ? 'completed' : 'failed';
      record.finishedAt = Date.now();

      if (code !== 0) {
        record.error = `Exited with code ${code}`;
        console.log(`[buildManager] Build ${id} failed:`, record.error);
        emitter.emit('end', { status: record.status, error: record.error });
      } else {
        console.log(`[buildManager] Build ${id} completed successfully, inspecting image…`);
        execFile(
          'docker', ['inspect', '--format={{.Id}}', imageName],
          (inspectErr: Error | null, stdout: string) => {
            if (!inspectErr) {
              record.digest = stdout.trim().replace(/^'|'$/g, '');
              console.log(`[buildManager] Build ${id} digest:`, record.digest);
            } else {
              console.warn(`[buildManager] Could not inspect image ${imageName}:`, inspectErr.message);
            }
            emitter.emit('end', {
              status: record.status,
              imageName: record.imageName,
              osTarget: record.osTarget,
              packages: record.packages,
              digest: record.digest,
            });
          },
        );
      }
    });

    child.on('error', (err: Error) => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      console.error(`[buildManager] Build ${id} process error:`, err);
      record.status = 'failed';
      record.error = err.message;
      record.finishedAt = Date.now();
      emitter.emit('end', { status: record.status, error: record.error });
    });

    return { id, command: cmd };
  }

  getBuild(id: string): BuildRecord | undefined {
    this.evictExpiredBuilds();
    return this.builds.get(id);
  }
}

export const buildManager = new BuildManager();
