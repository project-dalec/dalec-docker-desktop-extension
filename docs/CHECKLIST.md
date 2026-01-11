# Pre-Flight Checklist ✈️

Before testing the enhanced extension, verify these items:

## 🔧 Prerequisites

- [ ] Docker Desktop is installed and running
- [ ] Docker Extensions are enabled in Docker Desktop settings
- [ ] BuildKit is enabled (default in modern Docker)
- [ ] You have terminal access for verification commands

## 📦 Build & Install

```bash
cd /dalec-docker-desktop-extension

# Option 1: Using Makefile
make build-extension
make install-extension

# Option 2: Using docker commands
docker buildx build -t dalec-extension:latest . --load
docker extension install dalec-extension:latest -f

# Verify installation
docker extension ls | grep dalec
```

Expected output:
```
dalec-extension:latest    Dalec    Minimal Image Builder
```

## 🧪 Quick Smoke Test

### Test 1: Extension Loads
- [ ] Open Docker Desktop
- [ ] Find "Dalec" in left sidebar
- [ ] Click it - UI should load without errors
- [ ] Check browser console (Cmd+Option+I) - no errors

### Test 2: API Connectivity
Open browser DevTools and run in Console:
```javascript
fetch('/api/health').then(r => r.json()).then(console.log)
// Should return: { status: 'ok', time: '...' }
```

### Test 3: Basic Build
- [ ] Image Name: `test-dalec:v1`
- [ ] OS Target: `azlinux3`
- [ ] Packages: Check `bash`
- [ ] Click "Create Image"
- [ ] Logs appear in real-time
- [ ] Wait for completion (2-5 min first time)
- [ ] Green success banner appears
- [ ] Image name matches input

### Test 4: Verify Built Image
```bash
# Check image exists
docker images | grep test-dalec

# Run it
docker run -it test-dalec:v1 /bin/bash
# Inside container:
echo "Hello from Dalec!"
exit

# Clean up
docker rmi test-dalec:v1
```

### Test 5: Quick Actions
- [ ] Click "🔍 Inspect" - Alert shows image details
- [ ] Click "📋 Copy Image Name" - Paste works
- [ ] Click "🚀 Run Image" - Container starts
- [ ] Verify: `docker ps -a | grep test-dalec`

### Test 6: Log Viewer Features
- [ ] Auto-scroll checkbox works
- [ ] Can scroll manually
- [ ] Line numbers visible
- [ ] Colors appear (blue/red/green)
- [ ] "Clear Logs" button works

## 🐛 Troubleshooting Tests

### Test 7: Error Handling
Try these intentional failures:

#### Invalid image name:
```
Image: "BAD NAME WITH SPACES"
→ Should fail gracefully
→ Red error banner should appear
```

#### Non-existent package (if testing with more packages):
```
(Future test when more packages available)
```

## 📊 Performance Tests

### Test 8: Build Performance
- [ ] First build: 2-5 minutes (pulls Dalec frontend)
- [ ] Second build: 30-90 seconds (cached)
- [ ] Logs stream without lag
- [ ] UI remains responsive during build

### Test 9: Memory/CPU
- [ ] Open Activity Monitor / Task Manager
- [ ] Check Docker Desktop resource usage
- [ ] Should not spike abnormally during build

## 🎨 UI/UX Tests

### Test 10: Visual Polish
- [ ] Success banner is green and prominent
- [ ] Error banner is red and clear
- [ ] Buttons have hover effects
- [ ] Text is readable (not too small)
- [ ] Layout works at different window sizes

### Test 11: User Flow
- [ ] Flow is intuitive without instructions
- [ ] Status updates are clear
- [ ] Command preview shows before build
- [ ] Actions are obviously clickable

## 🔍 Code Quality Checks

### Test 12: No Errors in Console
```bash
# Check for TypeScript/ESLint errors
cd ui
npm install
npm run build
# Should complete without errors

cd ../backend
npm install
# Should install without warnings
```

### Test 13: Verify Files
```bash
# All new files exist
ls -la *.md
# Should show:
# ARCHITECTURE.md
# CHANGES.md
# ENHANCEMENTS.md
# QUICKSTART.md
# README.md
# TESTING.md
```

## 📝 Documentation Tests

### Test 14: Docs Are Accurate
- [ ] README.md reflects new features
- [ ] QUICKSTART.md commands work
- [ ] ARCHITECTURE.md diagrams make sense
- [ ] TESTING.md scenarios are testable

## 🚀 Ready for Production?

If all tests pass:
- ✅ Extension is production-ready
- ✅ Documentation is complete
- ✅ User experience is polished
- ✅ Error handling is robust

## 🎯 Next Steps

Once verified:
1. [ ] Test with different OS targets (when available)
2. [ ] Test with different package combinations
3. [ ] Share with team for feedback
4. [ ] Consider publishing to Docker Extensions Marketplace

## 📞 Support

If any test fails:
1. Check Docker Desktop is running
2. Review logs in extension
3. Check browser console for errors
4. Verify Docker daemon is accessible: `docker ps`
5. Restart Docker Desktop if needed

**Ready to ship! 🚢**
