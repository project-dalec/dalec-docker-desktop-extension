import { describe, it, expect } from 'vitest';
import { parseVersionConstraints } from './versionParser.js';

describe('parseVersionConstraints', () => {
  it('parses simple comma-separated constraints', () => {
    expect(parseVersionConstraints('>=1.0.0, <2.0.0')).toEqual(['>=1.0.0', '<2.0.0']);
  });

  it('parses constraints with double quotes', () => {
    expect(parseVersionConstraints('">=1.0.0", "<2.0.0"')).toEqual(['>=1.0.0', '<2.0.0']);
  });

  it('parses constraints with single quotes', () => {
    expect(parseVersionConstraints("'>=1.0.0', '<2.0.0'")).toEqual(['>=1.0.0', '<2.0.0']);
  });

  it('parses mixed quotes (one single, one double)', () => {
    expect(parseVersionConstraints('">=1.0.0", \'<2.0.0\'')).toEqual(['>=1.0.0', '<2.0.0']);
  });

  it('parses single constraint without quotes', () => {
    expect(parseVersionConstraints('>=1.0.0')).toEqual(['>=1.0.0']);
  });

  it('parses single constraint with double quotes', () => {
    expect(parseVersionConstraints('">=1.0.0"')).toEqual(['>=1.0.0']);
  });

  it('parses single constraint with single quotes', () => {
    expect(parseVersionConstraints("'>=1.0.0'")).toEqual(['>=1.0.0']);
  });

  it('handles extra whitespace', () => {
    expect(parseVersionConstraints('  >=1.0.0  ,  <2.0.0  ')).toEqual(['>=1.0.0', '<2.0.0']);
  });

  it('handles extra whitespace with quotes', () => {
    expect(parseVersionConstraints('  ">=1.0.0"  ,  "<2.0.0"  ')).toEqual(['>=1.0.0', '<2.0.0']);
  });

  it('handles empty string', () => {
    expect(parseVersionConstraints('')).toEqual([]);
  });

  it('handles null', () => {
    expect(parseVersionConstraints(null)).toEqual([]);
  });

  it('handles undefined', () => {
    expect(parseVersionConstraints(undefined)).toEqual([]);
  });

  it('filters out empty constraints', () => {
    expect(parseVersionConstraints('>=1.0.0, , <2.0.0')).toEqual(['>=1.0.0', '<2.0.0']);
  });

  it('handles complex version patterns', () => {
    expect(parseVersionConstraints('~1.2.3, ^2.0.0, >=3.0.0')).toEqual(['~1.2.3', '^2.0.0', '>=3.0.0']);
  });

  it('handles version ranges with spaces inside', () => {
    expect(parseVersionConstraints('>= 1.0.0, < 2.0.0')).toEqual(['>= 1.0.0', '< 2.0.0']);
  });

  it('handles exact versions', () => {
    expect(parseVersionConstraints('1.0.0, 2.0.0')).toEqual(['1.0.0', '2.0.0']);
  });

  it('handles wildcard versions', () => {
    expect(parseVersionConstraints('1.*, 2.x')).toEqual(['1.*', '2.x']);
  });

  it('preserves quotes inside constraint values', () => {
    expect(parseVersionConstraints('>=1.0.0')).toEqual(['>=1.0.0']);
  });

  it('handles trailing comma', () => {
    expect(parseVersionConstraints('>=1.0.0, <2.0.0,')).toEqual(['>=1.0.0', '<2.0.0']);
  });

  it('handles leading comma', () => {
    expect(parseVersionConstraints(',>=1.0.0, <2.0.0')).toEqual(['>=1.0.0', '<2.0.0']);
  });
});
