# ===========================
# STAGE 1 — BUILD THE WEB APP
# ===========================
FROM node:lts-alpine AS builder

# Enable pnpm and specify version
RUN corepack enable && corepack prepare pnpm@9 --activate

# Set working directory
WORKDIR /app

# Copy only dependency manifests first (for Docker caching)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy project config files
COPY vite.config.js eslint.config.js ./

# Copy packages and web app source
COPY packages ./packages

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Build for production
RUN pnpm run build


# ===========================
# STAGE 2 — RUN PRODUCTION APP
# ===========================
FROM node:lts-alpine AS runner

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Set working directory
WORKDIR /app

# Copy only necessary files from builder
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/web/package.json ./packages/web/package.json

# Install only production dependencies (no devDependencies)
RUN pnpm install --prod --frozen-lockfile

# Copy built output from builder stage
COPY vite.config.js ./
COPY /packages/web/vite.config.js ./packages/web/
COPY --from=builder /app/packages/web/dist ./packages/web/dist
COPY --from=builder /app/packages/extension/dist ./packages/extension/dist

# Expose the app’s port
EXPOSE 5173

# Run the app (preview mode or your own serve command)
CMD ["pnpm", "run", "preview:web", "--", "--port", "5173"]
