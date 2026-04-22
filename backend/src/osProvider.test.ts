import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOsList } from './osProvider.js';
import { exec, type ChildProcess } from 'child_process';

vi.mock('child_process');

interface Target {
  name: string;
  default?: boolean;
  description?: string;
}

interface TargetsResponse {
  targets: Target[];
  sources: null;
}

describe('osProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchOsList', () => {
    it('parses docker buildx targets response and returns OsTarget objects for default targets', async () => {
      const mockResponse: TargetsResponse = {
        targets: [
          { name: 'almalinux8/container', default: true,  description: 'Builds a container image for AlmaLinux 8' },
          { name: 'almalinux8/rpm',       default: true,  description: 'Builds an rpm for AlmaLinux 8' },
          { name: 'almalinux9/container', default: true,  description: 'Builds a container image for AlmaLinux 9' },
          { name: 'almalinux9/rpm',       default: true,  description: 'Builds an rpm for AlmaLinux 9' },
          { name: 'azlinux3/container',   default: true,  description: 'Builds a container image for Azure Linux 3' },
          { name: 'azlinux3/rpm',         default: true,  description: 'Builds an rpm for Azure Linux 3' },
          { name: 'mariner2/container',   default: true,  description: 'Builds a container image for Mariner 2' },
          { name: 'mariner2/rpm',         default: true,  description: 'Builds an rpm for Mariner 2' },
        ],
        sources: null,
      };

      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback?.(null, JSON.stringify(mockResponse), '');
        return {} as ChildProcess;
      });

      const result = await fetchOsList();

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(4);
      expect(result).toContainEqual(expect.objectContaining({ id: 'almalinux8', label: 'AlmaLinux 8',   family: 'rpm' }));
      expect(result).toContainEqual(expect.objectContaining({ id: 'almalinux9', label: 'AlmaLinux 9',   family: 'rpm' }));
      expect(result).toContainEqual(expect.objectContaining({ id: 'azlinux3',   label: 'Azure Linux 3', family: 'rpm' }));
      expect(result).toContainEqual(expect.objectContaining({ id: 'mariner2',   label: 'CBL-Mariner 2', family: 'rpm' }));
    });

    it('deduplicates OS ids when multiple default sub-targets share the same prefix', async () => {
      const mockResponse: TargetsResponse = {
        targets: [
          { name: 'azlinux3/container', default: true, description: 'Builds a container image for Azure Linux 3' },
          { name: 'azlinux3/rpm',       default: true, description: 'Builds an rpm' },
        ],
        sources: null,
      };

      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback?.(null, JSON.stringify(mockResponse), '');
        return {} as ChildProcess;
      });

      const result = await fetchOsList();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'azlinux3', label: 'Azure Linux 3', family: 'rpm', group: 'RPM-based' });
    });

    it('infers deb family when an <id>/deb target exists in the full target list', async () => {
      const mockResponse: TargetsResponse = {
        targets: [
          { name: 'bookworm/container', default: true, description: 'Builds a container image for Bookworm' },
          { name: 'bookworm/deb',                      description: 'Builds a deb package' },
        ],
        sources: null,
      };

      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback?.(null, JSON.stringify(mockResponse), '');
        return {} as ChildProcess;
      });

      const result = await fetchOsList();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'bookworm', label: 'Debian Bookworm 12', family: 'deb', group: 'Debian / Ubuntu' });
    });

    it('falls back to hardcoded list on command error', async () => {
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback?.(new Error('Command failed'), '', '');
        return {} as ChildProcess;
      });

      const result = await fetchOsList();

      expect(result).toBeInstanceOf(Array);
      expect(result).toContainEqual(expect.objectContaining({ id: 'azlinux3' }));
      expect(result).toContainEqual(expect.objectContaining({ id: 'mariner2' }));
      expect(result).toContainEqual(expect.objectContaining({ id: 'almalinux8' }));
    });

    it('falls back to hardcoded list on invalid JSON', async () => {
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback?.(null, 'invalid json', '');
        return {} as ChildProcess;
      });

      const result = await fetchOsList();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('falls back to hardcoded list when targets field is missing', async () => {
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback?.(null, JSON.stringify({ sources: null }), '');
        return {} as ChildProcess;
      });

      const result = await fetchOsList();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('falls back to hardcoded list when targets array is empty', async () => {
      const mockResponse: TargetsResponse = {
        targets: [],
        sources: null,
      };

      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback?.(null, JSON.stringify(mockResponse), '');
        return {} as ChildProcess;
      });

      const result = await fetchOsList();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('falls back to hardcoded list when no targets have default: true', async () => {
      const mockResponse: TargetsResponse = {
        targets: [
          { name: 'azlinux3/container', description: 'Builds a container image' },
          { name: 'azlinux3/rpm',       description: 'Builds an rpm' },
        ],
        sources: null,
      };

      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback?.(null, JSON.stringify(mockResponse), '');
        return {} as ChildProcess;
      });

      const result = await fetchOsList();

      expect(result).toBeInstanceOf(Array);
      expect(result).toContainEqual(expect.objectContaining({ id: 'azlinux3' }));
      expect(result).toContainEqual(expect.objectContaining({ id: 'mariner2' }));
    });

    it('uses correct docker buildx command', async () => {
      const mockResponse: TargetsResponse = {
        targets: [{ name: 'azlinux3/container', default: true }],
        sources: null,
      };

      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback?.(null, JSON.stringify(mockResponse), '');
        return {} as ChildProcess;
      });

      await fetchOsList();

      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('docker buildx build --call targets,format=json'),
        expect.objectContaining({ timeout: 10000, shell: '/bin/bash' }),
        expect.any(Function),
      );
    });
  });
});
