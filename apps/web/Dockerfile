FROM node:22-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-workspace.yaml .
COPY pnpm-lock.yaml .
COPY package.json .
COPY apps/web ./apps/web
COPY apps/extension ./apps/extension
COPY configs ./configs
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY . .
COPY --from=deps /app/node_modules ./node_modules
WORKDIR /app/apps/web
RUN pnpm run build
WORKDIR /app/apps/extension
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY configs ./configs
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json
COPY apps/web/next.config.js ./apps/web/next.config.js
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/extension/dist /app/extension-dist
RUN pnpm install --prod --frozen-lockfile --filter @repo/web...
EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
WORKDIR /app/apps/web
CMD ["pnpm", "start"]
