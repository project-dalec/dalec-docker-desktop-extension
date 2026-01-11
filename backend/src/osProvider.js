import { exec } from 'child_process';

// Attempt to run `dalec os list`, fallback to a curated list if not available.
export function fetchOsList() {
  return new Promise((resolve) => {
    exec('dalec os list', { timeout: 5000 }, (err, stdout) => {
      if (err) {
        // Fallback list (can be expanded)
        resolve(['azlinux3']);
        return;
      }
      const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      resolve(lines.length ? lines : ['azlinux3']);
    });
  });
}
