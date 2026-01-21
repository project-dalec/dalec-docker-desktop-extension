import { exec } from 'child_process';

// Fallback OS list
const FALLBACK_OS_TARGETS = [
  'mariner2',
  'azlinux3',
  'bullseye',
  'bookworm',
  'trixie',
  'bionic',
  'focal',
  'jammy',
  'noble',
  'windowscross',
  'almalinux9',
  'almalinux8',
  'rockylinux8',
  'rockylinux9',
];

// Attempt to fetch OS targets from docker buildx, fallback to curated list if not available.
export function fetchOsList() {
  return new Promise((resolve) => {
    const cmd = 'docker buildx build --call targets,format=json --build-arg BUILDKIT_SYNTAX=ghcr.io/project-dalec/dalec/frontend:latest -<<<"\\{\\}"';
    
    exec(cmd, { timeout: 10000, shell: '/bin/bash' }, (err, stdout) => {
      if (err) {
        console.warn('Failed to fetch OS list from docker buildx, using fallback:', err.message);
        resolve(FALLBACK_OS_TARGETS);
        return;
      }

      try {
        const result = JSON.parse(stdout);
        
        // Extract targets from the JSON response
        // Expected format: { "targets": [{ "name": "target1", ... }, ...] }
        if (result && Array.isArray(result.targets)) {
          const targets = result.targets
            .map(t => t.name)
            .filter(name => name.endsWith('/container/depsonly'))
            .map(name => name.replace('/container/depsonly', ''));
          
          if (targets.length > 0) {
            resolve(targets);
            return;
          }
        }
        
        // If no valid targets found, use fallback
        console.warn('No valid targets in docker buildx response, using fallback');
        resolve(FALLBACK_OS_TARGETS);
      } catch (parseErr) {
        console.warn('Failed to parse docker buildx output, using fallback:', parseErr.message);
        resolve(FALLBACK_OS_TARGETS);
      }
    });
  });
}
