# ===========================
# STAGE 1 - BUILD THE WEB APP
# ===========================
FROM node:lts-alpine AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Set working directory
WORKDIR /app

# Copy dependency manifests first (for Docker caching)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy workspace package.json files
COPY apps/web/package.json ./apps/web/
COPY apps/extension/package.json ./apps/extension/
COPY packages/ui/package.json ./packages/ui/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source files and configs
COPY tsconfig.json tsconfig.node.json vite.config.ts eslint.config.js ./
COPY configs ./configs
COPY apps ./apps
COPY packages ./packages

# Build for production
RUN pnpm run build

# ===========================
# STAGE 2 - PRODUCTION SERVER
# ===========================
FROM node:lts-alpine AS production

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy dependency manifests
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/

# Install production dependencies
RUN pnpm install --frozen-lockfile

# Copy built web app from builder
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Copy extension build for sharing via volume
COPY --from=builder /app/apps/extension/dist ./extension

# Copy vite configs needed for preview
COPY vite.config.ts ./
COPY apps/web/vite.config.ts ./apps/web/

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5173

# Run preview server
CMD ["pnpm", "preview:web", "--", "--host", "0.0.0.0", "--port", "5173"]
