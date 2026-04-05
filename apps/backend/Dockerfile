FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend

RUN pnpm install --frozen-lockfile --filter @repo/backend...

COPY . .

RUN pnpm --filter @repo/backend build


FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm

ENV NODE_ENV=production

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm install --prod --frozen-lockfile --filter @repo/backend...

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/views ./apps/backend/views
COPY --from=builder /app/apps/backend/public ./apps/backend/public

WORKDIR /app/apps/backend

EXPOSE 8000
CMD ["node", "dist/index.js"]
