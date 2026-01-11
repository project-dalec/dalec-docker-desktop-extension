# 🎯 DALEC Extension - Command Cheat Sheet

Quick reference for common commands while working with the DALEC Docker Extension.

---

## 🚀 Installation Commands

```bash
# Build the extension
cd dalec-docker-extension
docker buildx build -t dalec-extension:latest . --load

# Install extension
docker extension install dalec-extension:latest -f

# Verify installation
docker extension ls | grep dalec

# Update extension (after code changes)
docker extension update dalec-extension:latest -f

# Uninstall extension
docker extension rm dalec-extension:latest
```

---

## 🔧 Development Commands

### Frontend Development
```bash
cd ui
npm install
npm run dev
# Runs on http://localhost:3000

# In another terminal:
docker extension dev ui-source dalec-extension:latest http://localhost:3000
```

### Backend Development
```bash
cd backend
npm install
npm start
# Runs on port 8080
```

### Enable DevTools
```bash
# Open Chrome DevTools when extension tab is clicked
docker extension dev debug dalec-extension:latest

# Disable DevTools
docker extension dev reset dalec-extension:latest
```

---

## 🐳 Docker Image Commands

### After Building an Image in Extension
```bash
# List built images
docker images | grep my-minimal

# Run image interactively
docker run -it my-minimal:v1 /bin/bash

# Run image detached
docker run -d my-minimal:v1

# Inspect image
docker inspect my-minimal:v1

# Check image size
docker images my-minimal:v1 --format "{{.Size}}"

# View image layers
docker history my-minimal:v1

# Remove image
docker rmi my-minimal:v1

# Save image to tar
docker save my-minimal:v1 -o my-minimal.tar

# Load image from tar
docker load -i my-minimal.tar
```

---

## 📦 Container Commands

### Working with Built Containers
```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# View container logs
docker logs <container-id>

# Follow container logs
docker logs -f <container-id>

# Execute command in running container
docker exec -it <container-id> /bin/bash

# Stop container
docker stop <container-id>

# Remove container
docker rm <container-id>

# Remove all stopped containers
docker container prune
```

---

## 🔍 Debugging Commands

### Extension Debugging
```bash
# Show extension system containers
docker ps -a --filter "label=com.docker.compose.project=dalec-extension"

# View backend logs
docker logs <backend-container-id>

# Check Docker Desktop logs
# macOS: ~/Library/Containers/com.docker.docker/Data/log/
# Windows: %APPDATA%\Docker\log\

# Test backend API
curl http://localhost:8080/api/health

# Check if Docker daemon is running
docker ps
```

### Build Debugging
```bash
# Enable BuildKit debug output
export BUILDKIT_PROGRESS=plain
docker build ...

# Check BuildKit version
docker buildx version

# Inspect BuildKit builder
docker buildx inspect

# Clean build cache
docker builder prune
```

---

## 🧹 Cleanup Commands

### Remove Everything
```bash
# Remove all dalec-related images
docker images | grep dalec | awk '{print $3}' | xargs docker rmi

# Remove extension
docker extension rm dalec-extension:latest

# Clean all unused Docker resources
docker system prune -a

# Remove build cache
docker builder prune -a
```

### Selective Cleanup
```bash
# Remove dangling images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune
```

---

## 📊 Monitoring Commands

### Resource Usage
```bash
# Real-time container stats
docker stats

# Image disk usage
docker system df

# Detailed disk usage
docker system df -v

# Check Docker Desktop resource limits
# Docker Desktop → Settings → Resources
```

---

## 🎯 Dalec-Specific Commands

### Manual Dalec Builds (without extension)
```bash
# Basic Dalec build
docker build -t my-image:v1 \
  --build-arg BUILDKIT_SYNTAX=ghcr.io/project-dalec/dalec/frontend:latest \
  --target=azlinux3/container/depsonly \
  -<<<"$(jq -c '.dependencies.runtime = {"curl":{},"bash":{}} | .image.entrypoint = "/bin/bash"' <<<"{}" )"

# With custom spec file
cat > dalec-spec.yml <<EOF
dependencies:
  runtime:
    bash: {}
    curl: {}
image:
  entrypoint: /bin/bash
EOF

docker build -t my-image:v1 \
  --build-arg BUILDKIT_SYNTAX=ghcr.io/project-dalec/dalec/frontend:latest \
  --target=azlinux3/container/depsonly \
  -f dalec-spec.yml .
```

---

## 🔐 Registry Commands

### Push to Registry (future feature)
```bash
# Tag for Docker Hub
docker tag my-minimal:v1 username/my-minimal:v1

# Push to Docker Hub
docker push username/my-minimal:v1

# Tag for ACR
docker tag my-minimal:v1 myregistry.azurecr.io/my-minimal:v1

# Login to ACR
az acr login --name myregistry

# Push to ACR
docker push myregistry.azurecr.io/my-minimal:v1
```

---

## 🧪 Testing Commands

### Quick Tests
```bash
# Test if extension is running
curl http://localhost:8080/api/health

# List available OS targets
curl http://localhost:8080/api/os

# List available packages
curl http://localhost:8080/api/packages

# Test Docker connectivity
docker run hello-world

# Test BuildKit
docker buildx build --help
```

---

## 📝 Useful Aliases (add to ~/.zshrc or ~/.bashrc)

```bash
# DALEC Extension Aliases
alias dalec-build="docker buildx build -t dalec-extension:latest . --load"
alias dalec-install="docker extension install dalec-extension:latest -f"
alias dalec-update="docker extension update dalec-extension:latest -f"
alias dalec-remove="docker extension rm dalec-extension:latest"
alias dalec-logs="docker logs \$(docker ps -q --filter 'label=com.docker.compose.project=dalec-extension')"
alias dalec-dev="docker extension dev debug dalec-extension:latest"

# Docker cleanup
alias docker-clean="docker system prune -af && docker builder prune -af"
alias docker-nuke="docker rm -f \$(docker ps -aq) && docker rmi -f \$(docker images -q)"
```

---

## 🎓 Learning Commands

### Explore Built Images
```bash
# Dive into image layers (install dive first)
brew install dive
dive my-minimal:v1

# Extract image to filesystem
docker export $(docker create my-minimal:v1) | tar -C /tmp/image-contents -xvf -

# Compare two images
docker history my-minimal:v1 > image1.txt
docker history my-minimal:v2 > image2.txt
diff image1.txt image2.txt
```

---

## 🆘 Emergency Commands

### When Things Go Wrong
```bash
# Restart Docker Desktop
# macOS: 
osascript -e 'quit app "Docker"' && open -a Docker

# Kill all Docker processes (last resort)
pkill -9 Docker

# Reset Docker to factory defaults
# Docker Desktop → Troubleshoot → Reset to factory defaults

# Check Docker daemon
docker info

# Verify Docker installation
docker run hello-world
```

---

## 📌 Quick Reference URLs

- Docker Extensions Docs: https://docs.docker.com/desktop/extensions-sdk/
- Dalec GitHub: https://github.com/Azure/dalec
- BuildKit Docs: https://github.com/moby/buildkit
- Docker CLI Reference: https://docs.docker.com/engine/reference/commandline/cli/

---

## 💡 Pro Tips

```bash
# Watch extension logs in real-time
docker logs -f <backend-container-id>

# Auto-rebuild and reinstall on file changes (requires entr)
ls backend/**/*.js ui/**/*.jsx | entr sh -c 'docker buildx build -t dalec-extension:latest . --load && docker extension update dalec-extension:latest -f'

# Quick one-liner to rebuild & reinstall
docker buildx build -t dalec-extension:latest . --load && docker extension update dalec-extension:latest -f

# JSON output for scripting
docker images --format '{{json .}}' | jq
```

---

**Save this file for quick reference! 📖**
