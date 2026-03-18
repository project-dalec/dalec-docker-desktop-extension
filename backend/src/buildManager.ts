import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { spawn, exec, ChildProcessWithoutNullStreams } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
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
}

class BuildManager {
  private readonly builds = new Map<string, BuildRecord>();

  startBuild(payload: StartBuildPayload): { id: string; command: string } {
    const { imageName, osTarget, yamlSpec, packages } = payload;

    const id      = uuidv4();
    const emitter = new EventEmitter();
    const tmpDir  = `/tmp/dalec-build-${id}`;

    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'Dockerfile'), yamlSpec);

    const cmd = `DOCKER_BUILDKIT=1 docker build -t ${imageName} --target=${osTarget} ${tmpDir}`;

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
    };

    this.builds.set(id, record);

    const child: ChildProcessWithoutNullStreams = spawn('bash', ['-lc', cmd], { env: process.env });

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

      if (code !== 0) {
        record.error = `Exited with code ${code}`;
        console.log(`[buildManager] Build ${id} failed:`, record.error);
        emitter.emit('end', { status: record.status, error: record.error });
      } else {
        console.log(`[buildManager] Build ${id} completed successfully, inspecting image…`);
        exec(
          `docker inspect --format='{{.Id}}' ${imageName}`,
          (inspectErr, stdout) => {
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
      emitter.emit('end', { status: record.status, error: record.error });
    });

    return { id, command: cmd };
  }

  getBuild(id: string): BuildRecord | undefined {
    return this.builds.get(id);
  }
}

export const buildManager = new BuildManager();
