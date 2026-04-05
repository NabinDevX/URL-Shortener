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

- Node.js 22+
- pnpm
- MongoDB
- Redis

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create env files according to your deployment needs.

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

- `NEXT_GOOGLE_CLIENT_ID`
- `NEXT_API_PREFIX` (default: `/api/v1`)
- `NEXT_API_BASE_URL` (backend base URL for local dev; default in repo is `http://localhost:8000`)

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
