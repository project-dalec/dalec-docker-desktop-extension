import type { Target, DepTypeMeta, PackagesMap } from '../types';

export const TARGETS: Target[] = [
  { id: 'bionic',       label: 'Ubuntu Bionic 18.04', family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'focal',        label: 'Ubuntu Focal 20.04',  family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'jammy',        label: 'Ubuntu Jammy 22.04',  family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'noble',        label: 'Ubuntu Noble 24.04',  family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'bullseye',     label: 'Debian Bullseye 11',  family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'bookworm',     label: 'Debian Bookworm 12',  family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'trixie',       label: 'Debian Trixie 13',    family: 'deb', group: 'Debian / Ubuntu' },
  { id: 'azlinux3',     label: 'Azure Linux 3',       family: 'rpm', group: 'RPM-based' },
  { id: 'mariner2',     label: 'CBL-Mariner 2',       family: 'rpm', group: 'RPM-based' },
  { id: 'almalinux8',   label: 'AlmaLinux 8',         family: 'rpm', group: 'RPM-based' },
  { id: 'almalinux9',   label: 'AlmaLinux 9',         family: 'rpm', group: 'RPM-based' },
  { id: 'rockylinux8',  label: 'Rocky Linux 8',       family: 'rpm', group: 'RPM-based' },
  { id: 'rockylinux9',  label: 'Rocky Linux 9',       family: 'rpm', group: 'RPM-based' },
  { id: 'fedora40',     label: 'Fedora 40',           family: 'rpm', group: 'RPM-based' },
  { id: 'opensuse',     label: 'openSUSE Leap 15.5',  family: 'rpm', group: 'RPM-based' },
  { id: 'windowscross', label: 'Windows (cross)',     family: 'windows', group: 'Windows' },
];

export const TARGETS_BY_ID: Record<string, Target> = Object.fromEntries(
  TARGETS.map((t) => [t.id, t]),
);

/** Returns the exact --target value to pass to docker build for a given target. */
export function getBuildTarget(target: Target): string {
  if (target.family === 'windows') return `${target.id}/container`;
  if (target.family === 'rpm')     return `${target.id}/container`;
  return `${target.id}/testing/container`; // deb
}

export const PRESET_PACKAGES: Record<string, string[]> = {
  deb:     ['curl', 'bash', 'jq', 'ca-certificates', 'wget', 'git', 'python3', 'nodejs', 'openssl', 'net-tools', 'vim', 'htop', 'strace', 'tcpdump', 'iputils-ping', 'make', 'gcc', 'libssl-dev'],
  rpm:     ['curl', 'bash', 'jq', 'ca-certificates', 'wget', 'git', 'python3', 'nodejs', 'openssl', 'net-tools', 'vim', 'htop', 'strace', 'tcpdump', 'iputils', 'make', 'gcc', 'openssl-devel'],
  windows: [],
};

export const DEP_TYPES: DepTypeMeta[] = [
  { id: 'runtime',    label: 'Runtime',    description: 'Required to run the image' },
  { id: 'build',      label: 'Build',      description: 'Required at build time only' },
  { id: 'recommends', label: 'Recommends', description: 'Installed alongside, not strictly required' },
  { id: 'test',       label: 'Test',       description: 'Required to run tests' },
];

export const VERSION_OPS = ['>=', '<=', '=', '>', '<', '!='] as const;

export const EMPTY_PACKAGES_MAP = (): PackagesMap => ({
  runtime: [],
  build: [],
  recommends: [],
  test: [],
});
