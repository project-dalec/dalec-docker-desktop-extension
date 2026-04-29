import type { ImageSpec } from '../types';
import { getBuildTarget } from '../constants/targets';

/** Escape a string for safe inclusion as a YAML double-quoted value. */
function yamlEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function generateYAML(spec: ImageSpec): string {
  const { name, version, description, website, revision, license, packages, entrypoint, cmd, workdir, user, envVars, labels } = spec;
  const lines: string[] = [];

  lines.push('# syntax=ghcr.io/project-dalec/dalec/frontend:latest');
  lines.push(`name: "${yamlEscape(name || 'my-image')}"`);
  lines.push(`version: "${yamlEscape(version || '0.1.0')}"`);
  lines.push(`revision: "${yamlEscape(revision || '1')}"`);
  lines.push(`description: "${yamlEscape(description)}"`);
  lines.push(`website: "${yamlEscape(website)}"`);
  lines.push(`license: "${yamlEscape(license)}"`);
  lines.push('packager: builtin');

  if (packages.length > 0) {
    lines.push('');
    lines.push('dependencies:');
    lines.push('  runtime:');
    packages.forEach((pkg) => {
      const activeConstraints = pkg.versions.filter((v) => v.op && v.val);
      if (!activeConstraints.length) {
        lines.push(`    ${pkg.name}: {}`);
      } else {
        lines.push(`    ${pkg.name}:`);
        lines.push(`      version:`);
        activeConstraints.forEach((c) => lines.push(`        - "${c.op}${c.val}"`));
      }
    });
  }

  lines.push('');
  lines.push('image:');
  if (entrypoint) lines.push(`  entrypoint: ${entrypoint}`);
  if (cmd)        lines.push(`  cmd: ${cmd}`);
  if (workdir)    lines.push(`  workdir: ${workdir}`);
  if (user)       lines.push(`  user: ${user}`);

  const activeEnv = envVars.filter((e) => e.key);
  if (activeEnv.length) {
    lines.push('  env:');
    activeEnv.forEach((e) => lines.push(`    - ${e.key}=${e.value}`));
  }

  const activeLabels = labels.filter((l) => l.key);
  if (activeLabels.length) {
    lines.push('  labels:');
    activeLabels.forEach((l) => lines.push(`    ${l.key}: "${l.value}"`));
  }

  return lines.join('\n');
}

export function generateBuildCommand(spec: ImageSpec): string {
  const { name, version, target } = spec;
  const buildTarget = target ? getBuildTarget(target) : '';
  return [
    `docker buildx build \\`,
    `  -f ${name || 'spec'}.yml \\`,
    `  --target=${buildTarget} \\`,
    `  -t ${name || 'my-image'}:${version || '0.1.0'} \\`,
    `  --load \\`,
    `  .`,
  ].join('\n');
}

export type YamlLineCategory =
  | 'comment'
  | 'topKey'
  | 'subKey'
  | 'packageLeaf'
  | 'packageName'
  | 'constraint'
  | 'default';

export function categorizeYamlLine(line: string): YamlLineCategory {
  if (line.startsWith('#'))                                                  return 'comment';
  if (/^(name|version|revision|description|website|license|packager|dependencies|image):/.test(line)) return 'topKey';
  if (/^\s+(runtime|env|labels|version):/.test(line)) return 'subKey';
  if (line.includes(': {}'))                                                 return 'packageLeaf';
  if (/^\s{4,8}[\w][\w-]+:/.test(line) && !line.includes('{}'))            return 'packageName';
  if (/^\s*- "/.test(line))                                                  return 'constraint';
  return 'default';
}
