import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('./osProvider.js', () => ({
  fetchOsList: vi.fn(),
}));

const { fetchOsList } = await import('./osProvider.js');
const { app } = await import('./app.js');

describe('GET /api/os', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a JSON array of OS targets', async () => {
    fetchOsList.mockResolvedValue(['azlinux3', 'mariner2', 'almalinux9']);

    const res = await request(app).get('/api/os');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['azlinux3', 'mariner2', 'almalinux9']);
  });

  it('returns fallback when fetchOsList returns default', async () => {
    fetchOsList.mockResolvedValue(['azlinux3']);

    const res = await request(app).get('/api/os');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['azlinux3']);
  });

  it('responds with content-type application/json', async () => {
    fetchOsList.mockResolvedValue(['azlinux3']);

    const res = await request(app).get('/api/os');

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
