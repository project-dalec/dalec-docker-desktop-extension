import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOsList } from './osProvider.js';
import { exec } from 'child_process';
import { mkdtemp, writeFile, rm } from 'fs/promises';

vi.mock('child_process');
vi.mock('fs/promises');

/**
 * @typedef {Object} Target
 * @property {string} name - The target name (e.g., "azlinux3/container/depsonly")
 * @property {boolean} [default] - Whether this is a default target
 * @property {string} [description] - Description of the target
 */

/**
 * @typedef {Object} TargetsResponse
 * @property {Target[]} targets - Array of available targets
 * @property {null} sources - Sources field (currently null)
 */

describe('osProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mkdtemp).mockResolvedValue('/tmp/dalec-abc123');
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(rm).mockResolvedValue(undefined);
  });

  describe('fetchOsList', () => {
    it('parses docker buildx targets response and extracts OS names from /container/depsonly targets', async () => {
      /** @type {TargetsResponse} */
      const mockResponse = {
        "targets": [
          {
            "name": "almalinux8/container",
            "default": true,
            "description": "Builds a container image for AlmaLinux 8"
          },
          {
            "name": "almalinux8/container/depsonly",
            "description": "Builds a container image with only the runtime dependencies installed."
          },
          {
            "name": "almalinux9/container/depsonly",
            "description": "Builds a container image with only the runtime dependencies installed."
          },
          {
            "name": "azlinux3/container/depsonly",
            "description": "Builds a container image with only the runtime dependencies installed."
          },
          {
            "name": "mariner2/container/depsonly",
            "description": "Builds a container image with only the runtime dependencies installed."
          }
        ],
        "sources": null
      };

      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback(null, JSON.stringify(mockResponse));
      });

      const result = await fetchOsList();

      expect(result).toBeInstanceOf(Array);
      expect(result).toContain('almalinux8');
      expect(result).toContain('almalinux9');
      expect(result).toContain('azlinux3');
      expect(result).toContain('mariner2');
      expect(result.length).toBe(4);
    });

    it('filters only /container/depsonly targets and strips suffix', async () => {
      /** @type {TargetsResponse} */
      const mockResponse = {
        "targets": [
          {
            "name": "azlinux3/container",
            "default": true,
            "description": "Builds a container image for Azure Linux 3"
          },
          {
            "name": "azlinux3/container/depsonly",
            "description": "Builds a container image with only the runtime dependencies installed."
          },
          {
            "name": "azlinux3/rpm",
            "description": "Builds an rpm and src.rpm."
          }
        ],
        "sources": null
      };

      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback(null, JSON.stringify(mockResponse));
      });

      const result = await fetchOsList();

      // Should only include the OS name from /container/depsonly targets
      expect(result).toEqual(['azlinux3']);
      expect(result).not.toContain('azlinux3/container');
      expect(result).not.toContain('azlinux3/rpm');
    });

    it('falls back to default on command error', async () => {
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback(new Error('Command failed'), null);
      });

      const result = await fetchOsList();

      expect(result).toEqual(['azlinux3']);
    });

    it('falls back to default on invalid JSON', async () => {
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback(null, 'invalid json');
      });

      const result = await fetchOsList();

      expect(result).toEqual(['azlinux3']);
    });

    it('falls back to default when targets field is missing', async () => {
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback(null, JSON.stringify({ sources: null }));
      });

      const result = await fetchOsList();

      expect(result).toEqual(['azlinux3']);
    });

    it('falls back to default when targets array is empty', async () => {
      /** @type {TargetsResponse} */
      const mockResponse = {
        "targets": [],
        "sources": null
      };

      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback(null, JSON.stringify(mockResponse));
      });

      const result = await fetchOsList();

      expect(result).toEqual(['azlinux3']);
    });

    it('falls back to default when no /container/depsonly targets found', async () => {
      /** @type {TargetsResponse} */
      const mockResponse = {
        "targets": [
          {
            "name": "azlinux3/container",
            "description": "Builds a container image"
          },
          {
            "name": "azlinux3/rpm",
            "description": "Builds an rpm"
          }
        ],
        "sources": null
      };

      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback(null, JSON.stringify(mockResponse));
      });

      const result = await fetchOsList();

      expect(result).toEqual(['azlinux3']);
    });

    it('creates a temp dir with a Dockerfile and passes it to docker buildx', async () => {
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback(null, JSON.stringify({ targets: [{ name: "test/container/depsonly" }], sources: null }));
      });

      await fetchOsList();

      expect(mkdtemp).toHaveBeenCalledWith(expect.stringContaining('dalec-'));
      expect(writeFile).toHaveBeenCalledWith('/tmp/dalec-abc123/Dockerfile', '{}');
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('/tmp/dalec-abc123'),
        expect.objectContaining({ timeout: 10000 }),
        expect.any(Function)
      );
    });

    it('does not require bash shell', async () => {
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback(null, JSON.stringify({ targets: [{ name: "test/container/depsonly" }], sources: null }));
      });

      await fetchOsList();

      const execCall = vi.mocked(exec).mock.calls[0];
      const options = execCall[1];
      expect(options).not.toHaveProperty('shell');
    });

    it('cleans up temp dir after successful fetch', async () => {
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback(null, JSON.stringify({ targets: [{ name: "test/container/depsonly" }], sources: null }));
      });

      await fetchOsList();

      expect(rm).toHaveBeenCalledWith('/tmp/dalec-abc123', { recursive: true });
    });

    it('cleans up temp dir after command error', async () => {
      vi.mocked(exec).mockImplementation((cmd, options, callback) => {
        callback(new Error('Command failed'), null);
      });

      await fetchOsList();

      expect(rm).toHaveBeenCalledWith('/tmp/dalec-abc123', { recursive: true });
    });

    it('falls back to default when mkdtemp fails', async () => {
      vi.mocked(mkdtemp).mockRejectedValue(new Error('Cannot create temp dir'));

      const result = await fetchOsList();

      expect(result).toEqual(['azlinux3']);
    });
  });
});
