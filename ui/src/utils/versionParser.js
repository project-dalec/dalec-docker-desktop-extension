/**
 * Parses a comma-separated string of version constraints into an array.
 * Handles constraints with or without quotes (single or double).
 *
 * Examples:
 *   ">=1.0.0, <2.0.0" => [">=1.0.0", "<2.0.0"]
 *   '">=1.0.0", "<2.0.0"' => [">=1.0.0", "<2.0.0"]
 *   "'>=1.0.0', '<2.0.0'" => [">=1.0.0", "<2.0.0"]
 *   ">=1.0.0" => [">=1.0.0"]
 *   "" => []
 *
 * @param {string} versionString - Comma-separated version constraints
 * @returns {string[]} Array of version constraint strings
 */
export function parseVersionConstraints(versionString) {
  if (!versionString || typeof versionString !== 'string') {
    return [];
  }

  return versionString
    .split(',')
    .map(constraint => {
      let trimmed = constraint.trim();

      // Remove surrounding quotes (single or double)
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        trimmed = trimmed.slice(1, -1).trim();
      }

      return trimmed;
    })
    .filter(constraint => constraint.length > 0);
}
