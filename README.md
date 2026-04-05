# URL Shortener

A full-stack URL shortener platform with a web app, a browser extension, shared UI package, analytics, QR support, JWT authentication, Google OAuth, and Docker deployment.

## Monorepo Layout

- `apps/backend`: Node.js + TypeScript API server
- `apps/web`: Next.js web app
- `apps/extension`: Vite + React browser extension
- `packages/ui`: shared UI/context/hooks package
- `docker-compose.yaml`: production-style container setup
- `turbo.json`: Turborepo task pipeline

## Core Features

- URL shortening with optional custom short IDs
- URL analytics and visit history
- Dynamic QR generation in frontend with optional PNG download
- User authentication with JWT + refresh flow
- Google OAuth login/register endpoints
- Browser extension with draggable in-page widget
- Shared UI package consumed by web and extension apps

## Tech Stack

### Backend

- Node.js
- TypeScript
- Express
- tRPC + trpc-to-openapi
- MongoDB + Mongoose
- Redis
- JWT
- google-auth-library + googleapis

### Frontend

- React 19
- Vite
- pnpm workspaces
- Tailwind CSS
- Axios

### Tooling

- Jest + Supertest
- Docker + Docker Compose

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
- pnpm
- MongoDB
- Redis

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Generate starter env files:

```bash
pnpm generate:env
```

Then adjust the generated values for your local setup.

Backend env (apps/backend/.env) typically includes:

- `PORT`
- `MONGODB_URI`
- `DB_NAME`
- `REDIS_URL`
- `CORS_ORIGIN`
- `USER_SECRET_ACCESS_TOKEN`
- `USER_SECRET_REFRESH_TOKEN`
- `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_EXPIRY`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`

OTP email behavior:

- Production: requires `BREVO_API_KEY` + `BREVO_SENDER_EMAIL`.
- Development/test: OTP defaults to logging in backend logs. To enable real emails set `OTP_EMAIL_IN_NON_PRODUCTION=true`.

For Google OAuth, keep your Google client secret file at:

- `apps/backend/config/client_secret.json`

Web env (apps/web/.env) typically includes:

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_API_PREFIX` (default: `/api/v1`)
- `NEXT_PUBLIC_API_BASE_URL` (backend base URL for local dev; default in repo is `http://localhost:8000`)

## Run in Development

### Backend

```bash
pnpm dev:backend
```

### Frontend web app

```bash
pnpm dev:web
```

### Frontend extension app

```bash
pnpm dev:extension
```

Or run everything at once:

```bash
pnpm dev
```

## Workspace Scripts

Available from the repo root:

- `pnpm dev` - run all development tasks through Turborepo
- `pnpm dev:backend` - run backend only
- `pnpm dev:web` - run Next.js web app only
- `pnpm dev:extension` - run extension app only
- `pnpm build` - build all workspaces
- `pnpm build:backend` - build backend CSS + TypeScript output
- `pnpm build:web` - build web app only
- `pnpm build:extension` - build extension only
- `pnpm test` - run all tests configured in workspaces
- `pnpm test:backend` - run backend test suite
- `pnpm lint` - lint all workspaces
- `pnpm check-types` - type-check all workspaces

## Build Commands

### Backend

```bash
pnpm build:backend
```

### Frontend (all workspace packages)

```bash
pnpm build
```

### Build web app only

```bash
pnpm build:web
```

### Build extension only

```bash
pnpm build:extension
```

## Testing

```bash
pnpm test:backend
```

## Troubleshooting

- `pnpm dev:backend` fails immediately: verify `apps/backend/.env` exists and `MONGODB_URI`/`REDIS_URL` are reachable.
- `pnpm dev:web` fails with API/auth issues: verify `apps/web/.env` and make sure `NEXT_PUBLIC_API_BASE_URL` points to the running backend.
- Turbo output is noisy in CI or scripted runs: set `TURBO_UI=false` before the command.
- OAuth errors: ensure `apps/backend/config/client_secret.json` is present and matches your Google OAuth app.

## Docker

```bash
docker compose -f docker-compose.yaml up -d
```

This compose file is designed to pull pre-built images from GHCR (see the GitHub Actions workflow in .github/workflows/ci-cd.yaml).

## Main API Groups

- User/auth: `/api/v1/user/*`
- URL operations: `/api/v1/url/*`
- Redirect: `/:shortId`

## Security Notes

- Do not commit secret files or env secrets
- `apps/backend/config/client_secret.json` should remain ignored from git
- Use strong token secrets in production

## License

MIT
