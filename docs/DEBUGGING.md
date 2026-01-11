# 🐛 Debugging Guide - "Failed to fetch" Error

## Error: "Status: error: Failed to fetch"

This error typically occurs when the frontend can't communicate with the backend. Here's how to debug and fix it:

---

## 🔍 Step 1: Check Backend is Running

### In Docker Desktop:
1. Settings → Extensions → Show Docker Extensions system containers
2. Look for containers related to `dalec-extension`
3. Check if backend container is running

### Via Terminal:
```bash
# List extension containers
docker ps --filter "label=com.docker.compose.project"

# Check dalec backend logs
docker logs <backend-container-id> --tail 50

# You should see:
# [startup] Dalec extension backend listening on 8080
```

---

## 🔍 Step 2: Test Backend API Directly

### Open Browser Console (in Docker Desktop)
Press `Cmd+Option+I` (Mac) or `F12` (Windows/Linux)

### Run these tests:
```javascript
// Test 1: Health check
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
// Expected: { status: 'ok', time: '...' }

// Test 2: List OS targets
fetch('/api/os')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
// Expected: ['azlinux3']

// Test 3: List packages
fetch('/api/packages')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
// Expected: ['curl', 'bash']

// Test 4: Start a build
fetch('/api/build', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageName: 'test:v1',
    osTarget: 'azlinux3',
    packages: ['bash']
  })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
// Expected: { buildId: '...', command: '...' }
```

---

## 🔍 Step 3: Check Network Configuration

### Verify docker-compose.yaml
```bash
cat docker-compose.yaml
```

Should expose backend socket:
```yaml
services:
  backend:
    # ...
    volumes:
      - type: bind
        source: /var/run/docker.sock
        target: /var/run/docker.sock
```

---

## 🔍 Step 4: Check for CORS Issues

### In Browser Console, look for:
```
Access to fetch at 'http://...' from origin '...' has been blocked by CORS policy
```

### Fix: Backend already has CORS enabled
The backend has `app.use(cors())` - this should work.

If you see CORS errors, check:
```javascript
// In backend/src/server.js
app.use(cors()); // ✅ Should be present
```

---

## 🔍 Step 5: Common Issues & Fixes

### Issue 1: Backend not starting
**Symptom**: No backend container running

**Fix**:
```bash
# Rebuild and reinstall
docker buildx build -t dalec-extension:latest . --load
docker extension update dalec-extension:latest -f

# Check logs
docker extension ls
docker logs <backend-container-id>
```

### Issue 2: Port conflict
**Symptom**: Backend fails to bind to port 8080

**Fix**: Check if another process is using port 8080:
```bash
lsof -i :8080
# Kill conflicting process or change backend port
```

### Issue 3: Missing dependencies
**Symptom**: Backend crashes on startup

**Fix**:
```bash
cd backend
npm install
# Rebuild extension
```

### Issue 4: Docker socket not accessible
**Symptom**: Backend can't run docker commands

**Check**:
```bash
# In backend container:
docker exec -it <backend-container-id> sh
docker ps  # Should work
```

**Fix**: Ensure docker-compose.yaml mounts docker socket

---

## 🔍 Step 6: Enable Verbose Logging

### Check all console logs:

1. **Backend logs** (see Step 1)
2. **Browser console** (Cmd+Option+I)
3. **Network tab** (in DevTools)

### Look for these log messages:

**In Backend:**
```
[req] POST /api/build
[build] Received build request: {...}
[build] Started build <uuid>
[buildManager] Starting build <uuid>
```

**In Frontend Console:**
```
Starting build with: {imageName, osTarget, packages}
Build started: {buildId, command}
```

---

## 🔍 Step 7: Test with curl

### From your host machine:
```bash
# Health check
curl http://localhost:8080/api/health

# Note: This might not work if backend is only accessible via extension
# Use browser console tests instead (Step 2)
```

---

## 🔧 Quick Fixes

### Fix 1: Restart Extension
```bash
docker extension update dalec-extension:latest -f
```

### Fix 2: Restart Docker Desktop
```bash
# macOS
osascript -e 'quit app "Docker"'
open -a Docker

# Or use Docker Desktop UI: Troubleshoot → Restart
```

### Fix 3: Clean Rebuild
```bash
cd dalec-docker-extension
docker buildx build -t dalec-extension:latest . --load --no-cache
docker extension rm dalec-extension:latest
docker extension install dalec-extension:latest -f
```

### Fix 4: Check metadata.json
```bash
cat metadata.json
```

Should have:
```json
{
  "vm": {
    "composefile": "docker-compose.yaml",
    "exposes": {
      "socket": "backend.sock"
    }
  }
}
```

---

## 🧪 Debugging Checklist

- [ ] Backend container is running
- [ ] Backend logs show "listening on 8080"
- [ ] `/api/health` returns 200 OK
- [ ] `/api/os` returns array
- [ ] `/api/packages` returns array
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows requests reaching backend
- [ ] Docker socket is accessible in backend
- [ ] No port conflicts on 8080

---

## 🆘 Still Not Working?

### Collect Debug Info:
```bash
# 1. Extension list
docker extension ls

# 2. Backend logs (last 100 lines)
docker logs <backend-container-id> --tail 100 > backend-logs.txt

# 3. Docker info
docker info > docker-info.txt

# 4. Extension containers
docker ps -a --filter "label=com.docker.compose.project" > containers.txt
```

### Try Minimal Test:

Create a simple test endpoint:
```javascript
// In backend/src/server.js
app.get('/api/test', (_req, res) => {
  res.json({ message: 'Backend is alive!' });
});
```

Then test in browser:
```javascript
fetch('/api/test').then(r => r.json()).then(console.log);
```

If this works, the issue is with the `/api/build` endpoint specifically.

---

## 💡 Most Common Cause

**The error "Failed to fetch" usually means:**

1. ❌ Backend is not running
2. ❌ Backend crashed during startup
3. ❌ Network configuration issue in docker-compose
4. ❌ CORS blocking requests

**Check backend logs first!** 90% of issues are visible there.

---

## 📝 Enhanced Logging

We've added extensive logging to help debug:

**Backend logs what to look for:**
- `[startup]` - Server starting
- `[req]` - Incoming requests
- `[build]` - Build operations
- `[buildManager]` - Build process details
- `[log]` - Log streaming

**Frontend console logs:**
- Build start/stop events
- Parsed responses
- Error details

---

## ✅ Success Indicators

When everything works, you should see:

**Backend logs:**
```
[startup] Dalec extension backend listening on 8080
[req] GET /api/os
[req] GET /api/packages
[req] POST /api/build
[build] Received build request: {...}
[build] Started build abc-123
[buildManager] Starting build abc-123
```

**Browser console:**
```
Starting build with: {...}
Build started: {buildId: 'abc-123', ...}
```

**UI:**
```
Status: running
[Logs streaming...]
```
