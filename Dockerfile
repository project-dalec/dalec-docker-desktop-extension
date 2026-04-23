FROM node:22-alpine AS backend-builder
WORKDIR /backend
# Copy package files
COPY backend/package.json backend/package-lock.json* ./
# Install all dependencies (including dev) to build TypeScript
RUN npm install
# Copy backend source and tsconfig, then build
COPY backend/tsconfig.json backend/tsconfig.build.json ./
COPY backend/src ./src
RUN npm run build

FROM node:22-alpine AS client-builder
WORKDIR /ui
# cache packages in layer
COPY ui/package.json ui/package-lock.json* ./
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm install
# Copy source and build
COPY ui .
RUN npm run build

FROM node:22-alpine
LABEL org.opencontainers.image.title="Dalec" \
    org.opencontainers.image.description="Dalec Docker Desktop Extension" \
    org.opencontainers.image.vendor="project-dalec" \
    com.docker.desktop.extension.api.version="0.3.4" \
    com.docker.extension.screenshots="[{\"alt\":\"Configure image metadata, target, and dependencies\",\"url\":\"https://raw.githubusercontent.com/project-dalec/dalec-docker-desktop-extension/main/docs/screenshots/configure-step.png\"},{\"alt\":\"Preview the generated Dalec YAML spec and build command\",\"url\":\"https://raw.githubusercontent.com/project-dalec/dalec-docker-desktop-extension/main/docs/screenshots/preview-step.png\"},{\"alt\":\"Build logs streaming live\",\"url\":\"https://raw.githubusercontent.com/project-dalec/dalec-docker-desktop-extension/main/docs/screenshots/build-in-progress.png\"},{\"alt\":\"Completed build with image details\",\"url\":\"https://raw.githubusercontent.com/project-dalec/dalec-docker-desktop-extension/main/docs/screenshots/build-complete.png\"}]" \
    com.docker.desktop.extension.icon="logo.svg" \
    com.docker.extension.detailed-description="Build minimal container images using the Dalec BuildKit frontend. Select an OS target, pick packages, preview the generated YAML spec, and build — all from a single UI inside Docker Desktop." \
    com.docker.extension.publisher-url="https://github.com/project-dalec/dalec" \
    com.docker.extension.additional-urls="[{\"title\":\"Dalec\",\"url\":\"https://github.com/project-dalec/dalec\"},{\"title\":\"Source\",\"url\":\"https://github.com/project-dalec/dalec-docker-desktop-extension\"}]" \
    com.docker.extension.categories="developer-tools" \
    com.docker.extension.changelog="Initial alpha release."

# Install required tools for builds
RUN apk add --no-cache bash jq docker-cli docker-cli-buildx

# Copy metadata to root (required by Docker Desktop)
COPY docker-compose.yaml /
COPY metadata.json /
COPY logo.svg /

# Copy UI to root (required by Docker Desktop)
COPY --from=client-builder /ui/dist /ui

# Copy backend (compiled JS + node_modules)
WORKDIR /app/backend
COPY --from=backend-builder /backend/node_modules ./node_modules
COPY --from=backend-builder /backend/dist ./dist
COPY --from=backend-builder /backend/package.json ./

# Link UI as public for backend to serve
RUN ln -s /ui /app/backend/public

CMD ["node", "dist/server.js"]
