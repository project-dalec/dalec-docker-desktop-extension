import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

class BuildManager {
  constructor() {
    this.builds = new Map(); // id -> { logs:[], status, error, emitter }
  }

  startBuild({ imageName, osTarget, packages }) {
    const id = uuidv4();
    const emitter = new EventEmitter();
    const runtimeDeps = {};
    packages.forEach(p => { runtimeDeps[p] = {}; });

    // Build the Dalec spec JSON
    const dalecSpec = {
      dependencies: {
        runtime: runtimeDeps
      },
      image: {
        entrypoint: "/bin/bash"
      }
    };
    
    // Create temp directory and Dockerfile for Dalec build
    const tmpDir = `/tmp/dalec-build-${id}`;
    const dalecJson = JSON.stringify(dalecSpec, null, 2);
    
    // Multi-step command: create temp dir, write Dalec spec, build with BuildKit, cleanup
    const cmd = `
      mkdir -p ${tmpDir} && 
      echo '${dalecJson.replace(/'/g, "'\\''")}' > ${tmpDir}/Dockerfile && 
      cd ${tmpDir} && 
      DOCKER_BUILDKIT=1 docker build -t ${imageName} --build-arg BUILDKIT_SYNTAX=ghcr.io/project-dalec/dalec/frontend:latest --target=${osTarget}/container/depsonly . && 
      cd - && 
      rm -rf ${tmpDir}
    `.replace(/\n/g, ' ').trim();

    console.log(`[buildManager] Starting build ${id}:`, { imageName, osTarget, packages });
    console.log(`[buildManager] Dalec spec:`, dalecSpec);
    console.log(`[buildManager] Command: ${cmd}`);

    const record = { 
      logs: [], 
      status: 'running', 
      error: null, 
      emitter, 
      command: cmd,
      imageName,
      osTarget,
      packages
    };
    this.builds.set(id, record);

    const child = spawn('bash', ['-lc', cmd], { env: process.env });
    
    console.log(`[buildManager] Spawned process for build ${id}`);

    const pushLog = (chunk) => {
      const text = chunk.toString();
      console.log(`[buildManager] [${id}] Output:`, text);
      record.logs.push(text);
      emitter.emit('log', text);
    };

    child.stdout.on('data', pushLog);
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      console.error(`[buildManager] [${id}] Error:`, text);
      pushLog(chunk);
    });

    child.on('close', (code) => {
      console.log(`[buildManager] Build ${id} closed with code ${code}`);
      record.status = code === 0 ? 'completed' : 'failed';
      if (code !== 0) {
        record.error = `Exited with code ${code}`;
        console.log(`[buildManager] Build ${id} failed:`, record.error);
        emitter.emit('end', { status: record.status, error: record.error });
      } else {
        // Build succeeded - include image info
        console.log(`[buildManager] Build ${id} completed successfully`);
        emitter.emit('end', { 
          status: record.status, 
          imageName: record.imageName,
          osTarget: record.osTarget,
          packages: record.packages
        });
      }
    });

    child.on('error', (err) => {
      console.error(`[buildManager] Build ${id} process error:`, err);
      record.status = 'failed';
      record.error = err.message;
      emitter.emit('end', { status: record.status, error: record.error });
    });

    return { id, command: cmd };
  }

  getBuild(id) {
    return this.builds.get(id);
  }
}

export const buildManager = new BuildManager();
