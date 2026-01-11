// Placeholder for dynamic package retrieval.
// For now we return a cached sample list.
export function fetchPackages() {
  return [
    'curl', 'bash', 'git', 'wget', 'vim', 'ca-certificates',
    'openssl', 'jq', 'tar', 'gzip', 'sed', 'awk', 'grep',
    'python3', 'nodejs', 'nginx', 'postgresql', 'redis',
    'sqlite', 'gcc', 'make', 'cmake', 'go', 'rust',
    'perl', 'ruby', 'php', 'java', 'maven', 'gradle',
    'docker', 'kubectl', 'helm', 'terraform', 'ansible',
    'tmux', 'screen', 'htop', 'net-tools', 'iputils',
    'bind-utils', 'openssh-client', 'rsync', 'unzip', 'zip',
    'less', 'nano', 'emacs', 'tree', 'findutils',
    'coreutils', 'util-linux', 'procps', 'psmisc'
  ];
}
