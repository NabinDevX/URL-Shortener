FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

ARG NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID
ARG NEXT_PUBLIC_API_BASE_URL

ENV NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile --filter @repo/web...

COPY . .

RUN pnpm --filter @repo/web build

FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY --from=builder /app/apps/web ./apps/web

RUN pnpm install --frozen-lockfile --filter @repo/web... --prod

EXPOSE 3000
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@repo/web", "start"]
