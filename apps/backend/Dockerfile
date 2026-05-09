FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN npm install -g pnpm

# Install the full backend workspace, including dev dependencies, so the build has everything it needs.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend

RUN pnpm install --frozen-lockfile --filter @repo/backend... --allow-scripts

COPY . .

RUN pnpm --filter @repo/backend build


FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN npm install -g pnpm

ENV NODE_ENV=production

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm install --prod --frozen-lockfile --filter @repo/backend... --allow-scripts

WORKDIR /app/apps/backend

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/views ./views
COPY --from=builder /app/apps/backend/public ./public

EXPOSE 8000
CMD ["node", "--experimental-specifier-resolution=node", "dist/index.js"]
