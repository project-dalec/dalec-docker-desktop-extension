import { exec } from 'child_process';

// Fallback OS list with labels
const FALLBACK_OS_TARGETS = [
  { value: 'mariner2', label: 'Azure Linux 2 (formerly CBL-Mariner)' },
  { value: 'azlinux3', label: 'Azure Linux 3' },
  { value: 'bullseye', label: 'Debian 11 (Bullseye) (v0.11)' },
  { value: 'bookworm', label: 'Debian 12 (Bookworm) (v0.11)' },
  { value: 'trixie', label: 'Debian 13 (Trixie) (v0.next)' },
  { value: 'bionic', label: 'Ubuntu 18.04 (Bionic) (v0.11)' },
  { value: 'focal', label: 'Ubuntu 20.04 (focal) (v0.11)' },
  { value: 'jammy', label: 'Ubuntu 22.04 (jammy) (v0.9)' },
  { value: 'noble', label: 'Ubuntu 24.04 (noble) (v0.11)' },
  { value: 'windowscross', label: 'Cross compile from Ubuntu Jammy to Windows' },
  { value: 'almalinux9', label: 'AlmaLinux 9 (v0.13)' },
  { value: 'almalinux8', label: 'AlmaLinux 8 (v0.13)' },
  { value: 'rockylinux8', label: 'Rocky Linux 8 (v0.13)' },
  { value: 'rockylinux9', label: 'Rocky Linux 9 (v0.13)' },
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
        // Expected format: { "targets": { "target1": {...}, "target2": {...} } }
        if (result && result.targets) {
          const targets = Object.keys(result.targets).map(target => ({
            value: target,
            label: target
          }));
          
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
