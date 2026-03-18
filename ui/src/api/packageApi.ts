import { ddClient } from './ddClient';

const FALLBACK_PACKAGES = [
  'curl', 'bash', 'git', 'wget', 'vim', 'ca-certificates',
  'openssl', 'jq', 'tar', 'gzip', 'grep', 'python3', 'nodejs',
  'nginx', 'gcc', 'make', 'cmake', 'kubectl', 'helm',
  'tmux', 'htop', 'net-tools', 'openssh-client', 'rsync',
  'unzip', 'zip', 'less', 'nano', 'coreutils', 'util-linux', 'procps',
];

export async function getPackages(): Promise<string[]> {
  try {
    return await ddClient.extension.vm!.service!.get('/api/packages') as string[];
  } catch {
    return FALLBACK_PACKAGES;
  }
}
