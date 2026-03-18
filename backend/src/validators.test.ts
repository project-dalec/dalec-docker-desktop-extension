import { describe, it, expect } from 'vitest';
import { isValidImageName, isValidOsTarget } from './validators.js';

// ── isValidImageName ────────────────────────────────────────────────────────

describe('isValidImageName', () => {
  describe('valid names', () => {
    it('accepts a bare image name', () => {
      expect(isValidImageName('myimage')).toBe(true);
    });

    it('accepts name:tag', () => {
      expect(isValidImageName('myimage:latest')).toBe(true);
    });

    it('accepts name with semver tag', () => {
      expect(isValidImageName('myimage:1.2.3')).toBe(true);
    });

    it('accepts namespaced image', () => {
      expect(isValidImageName('myorg/myimage:latest')).toBe(true);
    });

    it('accepts deeply namespaced image', () => {
      expect(isValidImageName('registry.example.com/myorg/myimage:latest')).toBe(true);
    });

    it('accepts registry with port', () => {
      expect(isValidImageName('registry.example.com:5000/myimage:latest')).toBe(true);
    });

    it('accepts digest reference with @', () => {
      expect(isValidImageName('myimage@sha256:abc123def456')).toBe(true);
    });

    it('accepts names with dots, underscores, and hyphens', () => {
      expect(isValidImageName('my.image_name-v2:tag')).toBe(true);
    });
  });

  describe('invalid names', () => {
    it('rejects empty string', () => {
      expect(isValidImageName('')).toBe(false);
    });

    it('rejects name starting with a dot', () => {
      expect(isValidImageName('.myimage')).toBe(false);
    });

    it('rejects semicolon (shell command separator)', () => {
      expect(isValidImageName('myimage; rm -rf /')).toBe(false);
    });

    it('rejects ampersand (shell background operator)', () => {
      expect(isValidImageName('myimage && curl evil.com')).toBe(false);
    });

    it('rejects pipe', () => {
      expect(isValidImageName('myimage | cat /etc/passwd')).toBe(false);
    });

    it('rejects dollar sign (variable expansion)', () => {
      expect(isValidImageName('myimage$VAR')).toBe(false);
    });

    it('rejects backtick (command substitution)', () => {
      expect(isValidImageName('myimage`whoami`')).toBe(false);
    });

    it('rejects spaces', () => {
      expect(isValidImageName('my image')).toBe(false);
    });

    it('rejects double quotes', () => {
      expect(isValidImageName('myimage"latest"')).toBe(false);
    });

    it('rejects single quotes', () => {
      expect(isValidImageName("myimage'latest'")).toBe(false);
    });

    it('rejects backslash', () => {
      expect(isValidImageName('myimage\\latest')).toBe(false);
    });

    it('rejects newline', () => {
      expect(isValidImageName('myimage\nlatest')).toBe(false);
    });

  });
});

// ── isValidOsTarget ─────────────────────────────────────────────────────────

describe('isValidOsTarget', () => {
  describe('valid targets', () => {
    it('accepts a two-part target', () => {
      expect(isValidOsTarget('azlinux3/container')).toBe(true);
    });

    it('accepts a three-part target', () => {
      expect(isValidOsTarget('bookworm/testing/container')).toBe(true);
    });

    it('accepts rpm sub-target', () => {
      expect(isValidOsTarget('almalinux8/rpm')).toBe(true);
    });

    it('accepts deb sub-target', () => {
      expect(isValidOsTarget('bullseye/deb')).toBe(true);
    });

    it('accepts windows cross-compile target', () => {
      expect(isValidOsTarget('windowscross/container')).toBe(true);
    });

    it('accepts targets with dots and hyphens in segments', () => {
      expect(isValidOsTarget('my-os.v2/container')).toBe(true);
    });

  });

  describe('invalid targets', () => {
    it('rejects empty string', () => {
      expect(isValidOsTarget('')).toBe(false);
    });

    it('rejects a bare id with no slash', () => {
      expect(isValidOsTarget('azlinux3')).toBe(false);
    });

    it('rejects semicolon', () => {
      expect(isValidOsTarget('azlinux3/container; rm -rf /')).toBe(false);
    });

    it('rejects ampersand', () => {
      expect(isValidOsTarget('azlinux3/container && evil')).toBe(false);
    });

    it('rejects spaces', () => {
      expect(isValidOsTarget('az linux3/container')).toBe(false);
    });

    it('rejects dollar sign', () => {
      expect(isValidOsTarget('azlinux3/$container')).toBe(false);
    });

    it('rejects colon (not allowed in target path segments)', () => {
      expect(isValidOsTarget('azlinux3:container')).toBe(false);
    });

    it('rejects target starting with a slash', () => {
      expect(isValidOsTarget('/azlinux3/container')).toBe(false);
    });

    it('rejects target with empty segment (double slash)', () => {
      expect(isValidOsTarget('azlinux3//container')).toBe(false);
    });

  });
});
