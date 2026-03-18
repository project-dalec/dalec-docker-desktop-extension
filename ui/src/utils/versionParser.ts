/**
 * Parses a comma-separated string of version constraints into an array.
 * Handles constraints with or without surrounding quotes (single or double).
 *
 * Examples:
 *   ">=1.0.0, <2.0.0"  => [">=1.0.0", "<2.0.0"]
 *   '">=1.0.0", "<2.0.0"' => [">=1.0.0", "<2.0.0"]
 *   ">=1.0.0"           => [">=1.0.0"]
 *   ""                  => []
 */
export function parseVersionConstraints(versionString: string): string[] {
  if (!versionString || typeof versionString !== 'string') {
    return [];
  }

  return versionString
    .split(',')
    .map((constraint) => {
      let trimmed = constraint.trim();
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        trimmed = trimmed.slice(1, -1).trim();
      }
      return trimmed;
    })
    .filter((c) => c.length > 0);
}
