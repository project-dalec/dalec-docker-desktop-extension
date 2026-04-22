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
    com.docker.extension.screenshots="" \
    com.docker.desktop.extension.icon="logo.svg" \
    com.docker.extension.detailed-description="Build minimal container images using the Dalec BuildKit frontend. Select an OS target, pick packages, preview the generated YAML spec, and build — all from a single UI inside Docker Desktop." \
    com.docker.extension.publisher-url="https://github.com/project-dalec/dalec" \
    com.docker.extension.additional-urls="" \
    com.docker.extension.categories="developer-tools" \
    com.docker.extension.changelog=""

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
