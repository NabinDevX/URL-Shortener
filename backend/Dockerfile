# Build stage
FROM node:lts-alpine AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package files
COPY pnpm-lock.yaml package.json ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source files and configs
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

# Build TypeScript
RUN pnpm build

# Production stage
FROM node:lts-alpine AS production

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package files
COPY pnpm-lock.yaml package.json ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy runtime assets (views, public files)
COPY views ./views
COPY public ./public

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 8001

# Start application
CMD ["pnpm", "start:production"]
