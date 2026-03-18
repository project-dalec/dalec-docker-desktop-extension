import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { buildManager } from './buildManager.js';
import { fetchOsList } from './osProvider.js';
import { fetchPackages } from './packageProvider.js';
import type { BuildStatusResponse, StartBuildPayload } from './types.js';
import { isValidImageName, isValidOsTarget, isValidYamlSpec } from './validators.js';

const app = express();
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[req] ${req.method} ${req.url}`);
  next();
});

app.use(express.static('./public'));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/os', async (_req: Request, res: Response) => {
  try {
    const list = await fetchOsList();
    res.json(list);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[os] Error fetching OS targets:', err);
    res.status(500).json({ error: message });
  }
});

app.get('/api/packages', (_req: Request, res: Response) => {
  res.json(fetchPackages());
});

app.post('/api/build', (req: Request<unknown, unknown, StartBuildPayload>, res: Response) => {
  try {
    console.log('[build] Received build request:', req.body);
    const { imageName, osTarget, packages, yamlSpec } = req.body || {};

    if (!imageName || !osTarget || !Array.isArray(packages) || packages.length === 0) {
      console.log('[build] Invalid request params');
      return res.status(400).json({ error: 'imageName, osTarget and packages[] required' });
    }

    if (!isValidImageName(imageName)) {
      console.log('[build] Invalid imageName:', imageName);
      return res.status(400).json({ error: 'Invalid imageName format' });
    }

    if (!isValidOsTarget(osTarget)) {
      console.log('[build] Invalid osTarget:', osTarget);
      return res.status(400).json({ error: 'Invalid osTarget format' });
    }

    if (!isValidYamlSpec(yamlSpec)) {
      console.log('[build] Invalid yamlSpec (missing #syntax=)');
      return res.status(400).json({ error: 'Invalid yamlSpec format' });
    }

    const { id, command } = buildManager.startBuild(req.body);
    console.log(`[build] Started build ${id}`);
    res.json({ buildId: id, command });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[build] Error starting build:', err);
    res.status(500).json({ error: message });
  }
});

app.get('/api/build/:id/status', (req: Request<{ id: string }>, res: Response<BuildStatusResponse | { error: string }>) => {
  const { id } = req.params;
  console.log(`[req] GET /api/build/${id}/status`);

  const build = buildManager.getBuild(id);
  if (!build) {
    console.log(`[status] Build ${id} not found`);
    return res.status(404).json({ error: 'Build not found' });
  }

  const payload: BuildStatusResponse = {
    buildId: id,
    status: build.status,
    logs: build.logs,
    error: build.error ?? undefined,
    imageName: build.imageName,
    osTarget: build.osTarget,
    packages: build.packages,
    digest: build.digest,
  };

  res.json(payload);
});

const socketPath = process.env.SOCKET_PATH || '/run/guest-services/backend.sock';

app.get('/', (_req: Request, res: Response) => {
  const indexPath = path.join('./public', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile('index.html', { root: './public' });
  }
  res.setHeader('Content-Type', 'text/html');
  res.end(
    '<!DOCTYPE html><html><head><title>Dalec Fallback</title></head><body><h1>Dalec Extension Fallback</h1><p>index.html missing; check build logs.</p></body></html>',
  );
});

if (fs.existsSync(socketPath)) {
  fs.unlinkSync(socketPath);
  console.log('Removed existing socket file');
}

app.listen(socketPath, () => {
  let publicListing: string[] = [];
  try {
    publicListing = fs.readdirSync('./public');
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    publicListing = [`error reading public dir: ${message}`];
  }
  console.log(`[startup] Dalec extension backend listening on socket: ${socketPath}`);
  console.log('[startup] Public directory contents:', publicListing);
});

