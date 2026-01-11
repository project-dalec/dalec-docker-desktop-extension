FROM node:22-alpine AS backend-builder
WORKDIR /backend
# Copy package files
COPY backend/package.json backend/package-lock.json* ./
# Install dependencies
RUN npm install --production
# Copy backend source
COPY backend/src ./src

FROM node:22-alpine AS client-builder
WORKDIR /ui
# cache packages in layer
COPY ui/package.json ui/package-lock.json* ./
RUN --mount=type=cache,target=/usr/src/app/.npm \
    npm set cache /usr/src/app/.npm && \
    npm ci
# Copy source and build
COPY ui .
RUN npm run build

FROM node:22-alpine
LABEL org.opencontainers.image.title="Dalec" \
    org.opencontainers.image.description="Enables Easy DALEC Adoption" \
    org.opencontainers.image.vendor="Awesome inc." \
    com.docker.desktop.extension.api.version="0.3.4" \
    com.docker.extension.screenshots="" \
    com.docker.desktop.extension.icon="" \
    com.docker.extension.detailed-description="" \
    com.docker.extension.publisher-url="" \
    com.docker.extension.additional-urls="" \
    com.docker.extension.categories="" \
    com.docker.extension.changelog=""

# Install required tools for builds
RUN apk add --no-cache bash jq docker-cli docker-cli-buildx

# Copy metadata to root (required by Docker Desktop)
COPY docker-compose.yaml /
COPY metadata.json /
COPY docker.svg /

# Copy UI to root (required by Docker Desktop)
COPY --from=client-builder /ui/dist /ui

# Copy backend
WORKDIR /app/backend
COPY --from=backend-builder /backend/node_modules ./node_modules
COPY --from=backend-builder /backend/src ./src
COPY --from=backend-builder /backend/package.json ./

# Link UI as public for backend to serve
RUN ln -s /ui /app/backend/public

CMD ["node", "src/server.js"]
