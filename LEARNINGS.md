# Learnings (Project Notes)

This file is not a “how to run the repo” doc; it’s a summary of what I learned by building, debugging, and shipping this project.

## 1) Monorepo + Turborepo (pnpm workspaces)

- A pnpm monorepo becomes manageable when each app/package has a clear boundary:
  - `apps/backend` (API server)
  - `apps/web` (Next.js web app)
  - `apps/extension` (browser extension)
  - `packages/*` (shared code)
- Turbo is great for consistent pipelines (`lint`, `check-types`, `build`) across apps.
- `pnpm --filter ...` is the fastest way to focus on one app while keeping shared packages in sync.
- When build/test tools read environment variables, Turbo may warn about undeclared envs. The right fix is to declare them in `turbo.json` (not to ignore the warning).

## 2) API architecture: tRPC + OpenAPI in one backend

- tRPC gives a typed router and shared runtime validation (Zod) for procedures.
- `trpc-to-openapi` bridges “typed procedures” to “documented REST-like endpoints”:
  - An OpenAPI document is generated from the router.
  - The backend serves it at `/document`.
  - The file is also written to `apps/backend/openapi-specification.json`.

What I learned: when you attach OpenAPI metadata in tRPC router definitions, you get (a) strongly typed handlers for the app and (b) a single source of truth for documentation.

## 3) Google OAuth: the real moving pieces

- OAuth is not just “a button”; it’s a handshake between:
  1. Web app obtains an auth URL (or uses Google’s own login flow)
  2. Backend exchanges the code/token
  3. Backend verifies identity and either links or creates a user

Implementation highlights in this repo:

- Backend reads Google client secrets from `apps/backend/config/client_secret.json`.
- The logic supports exchanging an auth code for a verified profile, and also verifying a Google ID token.

Key lesson: most “OAuth bugs” are actually config mismatch bugs:

- redirect URI mismatch
- client ID mismatch between frontend and backend
- expecting email claims that are absent when token verification fails

## 4) Auth patterns: cookies + JWT + API keys

- There are two main auth entrypoints:
  - browser flow: JWT in cookies (access/refresh)
  - programmatic/API flow: `x-api-key` header
- A robust system needs:
  - refresh token rotation / verification
  - blacklist support for logout (Redis)
  - rate limiting for API key usage

What I learned: it’s worth supporting both cookie-based auth (best UX) and API keys (best automation), but they must share the same permission model.

## 5) OTP email delivery: app logic vs provider reality

- OTP sending has two sides:
  - “Business logic” (rate-limit, TTL, existing user checks)
  - “Delivery” (Brevo credentials, sender validation, provider policies)

In this repo:

- OTP is stored in Redis when available, with an in-memory fallback when Redis is down.
- In non-production environments, OTP email sending can be intentionally gated behind an env flag.

What I learned: if emails aren’t arriving, check in this order:

1. Is the backend actually attempting to send (not short-circuiting to logs)?
2. Are `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` present and valid?
3. Is the sender domain verified / permitted in Brevo?
4. Does the provider return a non-2xx response (log response body!)?

## 6) Docker in a monorepo: build context matters

- The biggest “Docker + monorepo” pitfall is using the wrong build context.
- The stable approach is:
  - build from the repo root
  - copy only what the specific app needs
  - run `pnpm --filter <app> ...` inside the image

This repo’s `docker-compose.yaml` is production-ish:

- Backend and frontend run as separate containers.
- Frontend talks to backend via an internal service name.

## 7) Frontend API routing: proxies beat hard-coded URLs

- The web app calls relative URLs like `/api/v1/*`.
- Next.js rewrites proxy them to a configurable backend target via `API_PROXY_TARGET`.

What I learned: if you avoid hard-coded `localhost` in the UI, you avoid a whole class of “works on my machine / breaks in Docker” bugs.

## 8) Observability: logs + metrics are the foundation

What exists in this repo today:

- Request logging middleware (structured logs around request start/finish)
- Prometheus-style metrics endpoint: `/metrics` using `prom-client`

What I learned about the Prometheus/Grafana/Loki stack (conceptually):

- Prometheus scrapes `/metrics` and stores time series.
- Grafana visualizes those metrics and can also visualize logs.
- Loki stores logs (usually shipped from Docker via Promtail/Fluent Bit).

Important note: this repo already exposes `/metrics`, but it does not currently include Docker services for Prometheus/Grafana/Loki in `docker-compose.yaml`. If we want the full stack, we’d add those services and wire scrape configs + log shipping.

## 9) Commands I used most while iterating

- `pnpm i`
- `pnpm dev:backend`, `pnpm dev:web`
- `pnpm lint`, `pnpm check-types`
- `pnpm --filter @repo/backend test`

## 10) Windows dev gotchas

- Some terminals can show stray control sequences that break the prompt.
- When that happens, run commands in a fresh shell (or use a background terminal run) to get clean output.

## 11) Env naming and runtime/build boundaries

- `NEXT_PUBLIC_*` values are build-time inputs for the web app, but the backend also consumes the Google client IDs at runtime to validate OAuth audiences.
- The backend Google OAuth flow currently expects `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, and `GOOGLE_WEB_CLIENT_SECRET`.
- `API_KEY_RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_MS`, and `RATE_LIMIT_MAX_REQUESTS` are present in deployment config, but the current backend rate-limit middleware still uses hardcoded constants, so those env vars do not change behavior yet.
