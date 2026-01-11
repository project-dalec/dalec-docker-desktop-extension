# Testing the Enhanced DALEC Extension

## 🧪 How to Test the New Features

### Prerequisites
1. Docker Desktop installed with extensions enabled
2. Dalec BuildKit frontend available (automatically pulled on first build)
3. Extension installed: `docker extension install <your-extension-name>`

### Test Scenario 1: Basic Build with Success Banner
```bash
# In the extension UI:
1. Image Name: test-minimal:v1
2. OS Target: azlinux3
3. Packages: Select "curl" and "bash"
4. Click "Create Image"

# Expected Results:
✅ Real-time logs appear showing Docker BuildKit output
✅ Logs show Dalec stages being executed
✅ Green success banner appears when complete
✅ Image name "test-minimal:v1" is displayed
✅ OS target and packages listed

# Verify in terminal:
docker images | grep test-minimal
# Should show: test-minimal  v1  ...
```

### Test Scenario 2: Quick Actions
```bash
# After successful build from Scenario 1:

# Test "Inspect" button:
1. Click "🔍 Inspect"
2. Alert should show:
   - Image name
   - Size in MB
   - Creation timestamp
   - Architecture

# Test "Copy Image Name" button:
1. Click "📋 Copy Image Name"
2. Paste in terminal: Ctrl+V (should be "test-minimal:v1")

# Test "Run Image" button:
1. Click "🚀 Run Image"
2. Alert shows container ID
3. Verify: docker ps -a | grep test-minimal
```

### Test Scenario 3: Log Viewer Features
```bash
# During a build:

# Test Auto-scroll:
1. Start a build
2. Observe logs scroll automatically
3. Scroll up manually
4. Notice "Auto-scroll" checkbox unchecks
5. New logs arrive but don't auto-scroll
6. Re-check "Auto-scroll" - jumps to bottom

# Test Clear Logs:
1. After build completes
2. Click "Clear Logs"
3. Log viewer empties

# Test Log Highlighting:
- Look for green text (success/DONE messages)
- Look for red text (error keywords)
- Look for yellow text (warning keywords)
- Look for blue text (BuildKit stages)
```

### Test Scenario 4: Error Handling
```bash
# Force a build failure:

# In the extension UI:
1. Image Name: bad-image:fail (use invalid characters if needed)
2. Or disconnect Docker daemon temporarily
3. Click "Create Image"

# Expected Results:
❌ Red error banner appears
❌ Status shows "failed"
❌ Logs show error details
❌ No quick action buttons appear
```

### Test Scenario 5: Multiple Packages
```bash
# Test with just bash:
1. Image Name: bash-only:v1
2. Packages: Only "bash" selected
3. Build and verify size

# Test with curl + bash:
1. Image Name: curl-bash:v1
2. Packages: Both selected
3. Build and compare size (should be larger)

# Compare in terminal:
docker images | grep -E "(bash-only|curl-bash)"
```

## 🐛 Known Issues to Watch For
- First build may take longer (pulling Dalec frontend)
- Very long logs may cause performance issues (future: pagination)
- Docker daemon must be running

## 📊 Success Criteria
✅ All logs from `docker build` appear in real-time
✅ Success banner shows accurate image information
✅ Quick actions work without errors
✅ Log viewer auto-scroll and formatting work
✅ Error states display correctly
✅ Built images are usable (`docker run` works)

## 🎯 Manual Verification Commands

After building `test-minimal:v1`:

```bash
# 1. Verify image exists
docker images test-minimal:v1

# 2. Check image history
docker history test-minimal:v1

# 3. Run the image interactively
docker run -it test-minimal:v1 /bin/bash

# Inside container:
which curl  # Should show path if curl was included
which bash  # Should show /bin/bash
exit

# 4. Inspect image (compare with UI)
docker image inspect test-minimal:v1 | jq '.[0] | {Size, Created, Os, Architecture}'

# 5. Clean up
docker rmi test-minimal:v1
```

## 📱 UI/UX Checklist
- [ ] Logs are readable (not too small)
- [ ] Success banner is visually distinct (green)
- [ ] Error banner is visually distinct (red)
- [ ] Buttons have hover effects
- [ ] Auto-scroll checkbox is intuitive
- [ ] Line numbers help with debugging
- [ ] Color-coding makes errors stand out
- [ ] Action buttons are clearly labeled with emojis
