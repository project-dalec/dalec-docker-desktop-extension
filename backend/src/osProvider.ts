import { exec } from 'child_process';
import type { OsTarget, OsFamily } from './types.js';

const LABEL_MAP: Record<string, string> = {
  bionic:       'Ubuntu Bionic 18.04',
  focal:        'Ubuntu Focal 20.04',
  jammy:        'Ubuntu Jammy 22.04',
  noble:        'Ubuntu Noble 24.04',
  bullseye:     'Debian Bullseye 11',
  bookworm:     'Debian Bookworm 12',
  trixie:       'Debian Trixie 13',
  azlinux3:     'Azure Linux 3',
  mariner2:     'CBL-Mariner 2',
  almalinux8:   'AlmaLinux 8',
  almalinux9:   'AlmaLinux 9',
  rockylinux8:  'Rocky Linux 8',
  rockylinux9:  'Rocky Linux 9',
  fedora40:     'Fedora 40',
  opensuse:     'openSUSE Leap 15.5',
};

function inferFamily(id: string, allNames: Set<string>): OsFamily {
  if (allNames.has(`${id}/deb`)) return 'deb';
  if (allNames.has(`${id}/rpm`)) return 'rpm';
  return 'deb';
}

function groupForFamily(family: OsFamily): string {
  return family === 'rpm' ? 'RPM-based' : 'Debian / Ubuntu';
}

function buildOsTarget(id: string, allTargetNames: Set<string>): OsTarget {
  const family = inferFamily(id, allTargetNames);
  return { id, label: LABEL_MAP[id] ?? id, family, group: groupForFamily(family) };
}

// Windows targets are intentionally excluded — this extension builds container images,
// and the windowscross target is for cross-compiling Windows packages, not containers.
const FALLBACK_OS_TARGETS: OsTarget[] = [
  { id: 'mariner2',     label: 'CBL-Mariner 2',      family: 'rpm', group: 'RPM-based' },
  { id: 'azlinux3',     label: 'Azure Linux 3',       family: 'rpm', group: 'RPM-based' },
  { id: 'almalinux8',   label: 'AlmaLinux 8',         family: 'rpm', group: 'RPM-based' },
  { id: 'almalinux9',   label: 'AlmaLinux 9',         family: 'rpm', group: 'RPM-based' },
  { id: 'rockylinux8',  label: 'Rocky Linux 8',       family: 'rpm', group: 'RPM-based' },
  { id: 'rockylinux9',  label: 'Rocky Linux 9',       family: 'rpm', group: 'RPM-based' },
  { id: 'bullseye',     label: 'Debian Bullseye 11',  family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'bookworm',     label: 'Debian Bookworm 12',  family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'trixie',       label: 'Debian Trixie 13',    family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'bionic',       label: 'Ubuntu Bionic 18.04', family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'focal',        label: 'Ubuntu Focal 20.04',  family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'jammy',        label: 'Ubuntu Jammy 22.04',  family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'noble',        label: 'Ubuntu Noble 24.04',  family: 'deb', group: 'Debian / Ubuntu' },
];

interface BuildxTarget {
  name: string;
  default?: boolean;
  description?: string;
}

interface BuildxTargetsResponse {
  targets?: BuildxTarget[];
  sources?: unknown;
}

export function fetchOsList(): Promise<OsTarget[]> {
  return new Promise((resolve) => {
    const cmd =
      'docker buildx build --call targets,format=json --build-arg BUILDKIT_SYNTAX=ghcr.io/project-dalec/dalec/frontend:latest -<<<"{}"';

    exec(cmd, { timeout: 10000, shell: '/bin/bash' }, (err: Error | null, stdout: string | Buffer | null) => {
      if (err) {
        console.warn('Failed to fetch OS list from docker buildx, using fallback:', err.message);
        resolve(FALLBACK_OS_TARGETS);
        return;
      }

      try {
        const text   = stdout?.toString() ?? '';
        const result = JSON.parse(text) as BuildxTargetsResponse;

        if (result && Array.isArray(result.targets)) {
          const allNames = new Set(result.targets.map((t) => t.name));
          const seen     = new Set<string>();
          const targets  = result.targets
            .filter((t) => t.default === true)
            .map((t) => t.name.split('/')[0])
            .filter((id) => id !== 'windowscross')
            .filter((id) => { if (seen.has(id)) return false; seen.add(id); return true; })
            .map((id) => buildOsTarget(id, allNames));

          if (targets.length > 0) {
            resolve(targets);
            return;
          }
        }

        console.warn('No valid targets in docker buildx response, using fallback');
        resolve(FALLBACK_OS_TARGETS);
      } catch (parseErr) {
        const message = parseErr instanceof Error ? parseErr.message : String(parseErr);
        console.warn('Failed to parse docker buildx output, using fallback:', message);
        resolve(FALLBACK_OS_TARGETS);
      }
    });
  });
}
