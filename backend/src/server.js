import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { buildManager } from './buildManager.js';
import { fetchOsList } from './osProvider.js';
import { fetchPackages } from './packageProvider.js';

const app = express();
app.use(cors());
app.use(express.json());
// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[req] ${req.method} ${req.url}`);
  next();
});
app.use(express.static('./public'));

// Basic health endpoint for diagnostics
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/os', async (_req, res) => {
  const list = await fetchOsList();
  res.json(list);
});

app.get('/api/packages', (_req, res) => {
  res.json(fetchPackages());
});

app.post('/api/build', (req, res) => {
  try {
    console.log('[build] Received build request:', req.body);
    const { imageName, osTarget, packages } = req.body || {};
    if (!imageName || !osTarget || !Array.isArray(packages) || packages.length === 0) {
      console.log('[build] Invalid request params');
      return res.status(400).json({ error: 'imageName, osTarget and packages[] required' });
    }
    const { id, command } = buildManager.startBuild({ imageName, osTarget, packages });
    console.log(`[build] Started build ${id}`);
    res.json({ buildId: id, command });
  } catch (err) {
    console.error('[build] Error starting build:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get build status and logs (polling endpoint)
app.get('/api/build/:id/status', (req, res) => {
  console.log(`[req] GET /api/build/${req.params.id}/status`);
  const { id } = req.params;
  const build = buildManager.getBuild(id);
  if (!build) {
    console.log(`[status] Build ${id} not found`);
    return res.status(404).json({ error: 'Build not found' });
  }
  
  res.json({
    status: build.status,
    logs: build.logs,
    error: build.error,
    imageName: build.imageName,
    osTarget: build.osTarget,
    packages: build.packages
  });
});

// Run a built image
app.post('/api/image/run', async (req, res) => {
  const { imageName } = req.body || {};
  if (!imageName) {
    return res.status(400).json({ error: 'imageName required' });
  }
  
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync(`docker run -d ${imageName}`);
    const containerId = stdout.trim().substring(0, 12);
    res.json({ containerId, imageName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Docker Desktop extension socket path
const socketPath = process.env.SOCKET_PATH || '/run/guest-services/backend.sock';

app.get('/', (_req, res) => {
  const indexPath = path.join('./public', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile('index.html', { root: './public' });
  }
  res.setHeader('Content-Type', 'text/html');
  res.end('<!DOCTYPE html><html><head><title>Dalec Fallback</title></head><body><h1>Dalec Extension Fallback</h1><p>index.html missing; check build logs.</p></body></html>');
});

// Clean up existing socket file before binding
if (fs.existsSync(socketPath)) {
  fs.unlinkSync(socketPath);
  console.log('Removed existing socket file');
}

// Listen on Unix socket for Docker Desktop extension
app.listen(socketPath, () => {
  let publicListing = [];
  try {
    publicListing = fs.readdirSync('./public');
  } catch (e) {
    publicListing = [`error reading public dir: ${e.message}`];
  }
  console.log(`[startup] Dalec extension backend listening on socket: ${socketPath}`);
  console.log('[startup] Public directory contents:', publicListing);
});
