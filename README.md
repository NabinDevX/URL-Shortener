# URL Shortener

A full-stack URL shortener platform with a web app, a browser extension, shared UI package, analytics, QR support, JWT authentication, Google OAuth, and Docker deployment.

## Monorepo Layout

- `backend`: Node.js + TypeScript API server
- `frontend/apps/web`: Vite + React web app
- `frontend/apps/extension`: Vite + React browser extension
- `frontend/packages/ui`: shared UI/context/hooks package
- `docker-compose.yaml`: production-style container setup
- `docker-compose.prometheus.yml`: Prometheus container setup

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
cd backend
pnpm install

cd ../frontend
pnpm install
```

### 2. Configure environment

Create env files according to your deployment needs.

Common backend variables include:

- `PORT`
- `MONGODB_URI`
- `DB_NAME`
- `REDIS_URL`
- `CORS_ORIGIN`
- `USER_SECRET_ACCESS_TOKEN`
- `USER_SECRET_REFRESH_TOKEN`
- `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_EXPIRY`

For Google OAuth, keep your Google client secret file at:

- `backend/config/client_secret.json`

## Run in Development

### Backend

```bash
cd backend
pnpm dev
```

### Frontend web app

```bash
cd frontend
pnpm dev:web
```

### Frontend extension app

```bash
cd frontend
pnpm dev:extension
```

## Build Commands

### Backend

```bash
cd backend
pnpm build
```

### Frontend (all workspace packages)

```bash
cd frontend
pnpm build
```

### Build web app only

```bash
cd frontend
pnpm build:web
```

### Build extension only

```bash
cd frontend
pnpm build:extension
```

## Testing

```bash
cd backend
pnpm test
```

## Docker

```bash
docker compose -f docker-compose.yaml up -d
```

Prometheus stack:

```bash
docker compose -f docker-compose.prometheus.yml up -d
```

## Main API Groups

- User/auth: `/api/v1/user/*`
- URL operations: `/api/v1/url/*`
- Redirect: `/:shortId`

## Security Notes

- Do not commit secret files or env secrets
- `backend/config/client_secret.json` should remain ignored from git
- Use strong token secrets in production

## License

MIT
