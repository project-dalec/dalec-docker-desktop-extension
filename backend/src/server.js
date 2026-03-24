import fs from 'fs';
import { app } from './app.js';

const socketPath = process.env.SOCKET_PATH || '/run/guest-services/backend.sock';

if (fs.existsSync(socketPath)) {
  fs.unlinkSync(socketPath);
  console.log('Removed existing socket file');
}

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
