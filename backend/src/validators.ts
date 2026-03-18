// Allowlist-based validators — reject anything with shell metacharacters
// Matches: optional-registry[:port]/ + path-components + optional :tag or @digest
const IMAGE_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._/:@-]*$/;
// Matches: id/sub-target, e.g. "azlinux3/container" or "bookworm/testing/container"
const OS_TARGET_RE  = /^[a-zA-Z0-9][a-zA-Z0-9._-]*(\/[a-zA-Z0-9][a-zA-Z0-9._-]*)+$/;

export function isValidImageName(name: string): boolean {
  return IMAGE_NAME_RE.test(name);
}

export function isValidOsTarget(target: string): boolean {
  return OS_TARGET_RE.test(target);
}

export function isValidYamlSpec(yamlSpec: unknown): yamlSpec is string {
  if (typeof yamlSpec !== 'string') return false;
  const text = yamlSpec.trim();
  if (!text) return false;

  // Dalec uses a BuildKit frontend (`#syntax=...`) at the top of the spec.
  // This is a lightweight structural check to catch obvious bad payloads early.
  const firstNonEmptyLine = text.split(/\r?\n/).find((l) => l.trim() !== '')?.trim() ?? '';
  return /^#\s*syntax=/.test(firstNonEmptyLine);
}
