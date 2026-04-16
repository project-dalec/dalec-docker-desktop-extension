import type { Target, DepTypeMeta, PackagesMap } from '../types';

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

/** Interval (ms) between build-status polling requests. */
export const BUILD_POLL_INTERVAL_MS = 500;

export const EMPTY_PACKAGES_MAP = (): PackagesMap => ({
  runtime: [],
  build: [],
  recommends: [],
  test: [],
});
