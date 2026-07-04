# AGENTS.md — Online Cinema

## Architecture

- **Monorepo with three services** orchestrated via `docker-compose.yaml`:
  - `backend/` — NestJS 11, TypeORM 0.3, PostgreSQL, Redis, Socket.IO
  - `frontend/` — React 19, Vite 6, Redux Toolkit, Tailwind CSS v4, Socket.IO client
  - `hate-speech-detector/` — Flask + scikit-learn (internal microservice, port 5000)
- Backend global API prefix is `api` (e.g. `/api/auth/login`).
- TypeORM `synchronize: false` — all schema changes go through migrations.

## Package manager

Both `package-lock.json` and `yarn.lock` exist in backend and frontend. The actual tool depends on context:
- Docker builds use **npm** for both.
- Frontend runtime command in docker-compose is **`yarn dev`** (but installed via `npm install --legacy-peer-deps`).
- Backend runtime uses **npm** (`npm run start:dev`).
- When adding dependencies, prefer npm to match Docker builds, or update Dockerfiles to match.

## Development commands (all run inside Docker)

```
make up                    # start all services
make down                  # stop all
make rebuild               # full rebuild
make rebuild-backend       # rebuild only backend
make rebuild-hate-speech-detector
make logs                  # tail all logs
make test-backend          # unit tests (inside container)
make test-backend-e2e      # e2e tests (runs migrations first)
make ssh-backend           # shell in backend container
make ssh-frontend
make create-migration-backend NAME=MyMigration   # creates migration
make run-migration-backend                      # runs pending migrations
make run-migration-rollback-backend             # reverts last migration
make fix-migration-permissions                  # run after create-migration-backend
```

## Gotchas

- **Migration permissions**: `make create-migration-backend` creates root-owned files inside the container. **Always** follow it with `make fix-migration-permissions` before committing, or git will refuse to read the files.
- **E2E tests run migrations automatically** — the `test:e2e` script executes `migration:run` before Jest.
- **Hardcoded IPs**: `APP_URL` in docker-compose and `VITE_API_HOST` in `frontend/.env` use `192.168.0.10`, not localhost. Change both if your host IP differs.
- **Redis host port is 6380** (not default 6379), mapped via docker-compose.
- **Backend Dockerfile installs ffmpeg** via apt-get — required for video processing (fluent-ffmpeg).
- **Hate speech detector** has a `depends_on: backend` which creates a circular runtime dependency (backend calls the detector at runtime, detector depends on backend startup).

## Backend NestJS structure

Non-standard layout — controllers/services are at top level, not per-module:
```
src/
  main.ts                  # entrypoint, ValidationPipe with whitelist+transform
  modules/                 # NestJS modules (app, auth, database, messages, rooms, users, videos)
  controllers/             # all controllers
  services/                # all services
  dto/                     # data transfer objects
  entities/                # TypeORM entities
  auth/                    # guards/ and strategies/ (Passport JWT)
  gateways/                # Socket.IO WebSocket gateways (chat, room)
  migrations/              # TypeORM migrations
  configs/                 # constants (redis options)
  helpers/                 # shared utilities
  ormconfig.ts             # DataSource config
```
- Unit tests: `src/**/*.spec.ts`, configured in package.json `jest` key.
- E2E tests: `test/*.e2e-spec.ts`, configured in `test/jest-e2e.json`.
- ESLint flat config (`eslint.config.mjs`), Prettier (`singleQuote, trailingComma: all`).

## Frontend structure

```
src/
  main.tsx                 # entrypoint, Redux Provider, BrowserRouter, Axios interceptors
  App.tsx                  # routes (/, /profile, /video-selection/:shortCode, /room/:shortCode)
  features/                # Redux slices (auth, room, user, video) — feature-based
  store/                   # Redux store + localStorage middleware
  services/                # API client + per-resource API modules
  hooks/                   # custom hooks (useAuth, useChat, useRooms, etc.)
  pages/                   # route-level components
  components/              # shared components (ProtectedRoute, etc.)
  layouts/                 # MainLayout
```
- Redux state: `auth`, `profile`, `video`, `room`.
- Auth tokens persisted to localStorage via custom middleware.
- Tailwind CSS v4 via `@tailwindcss/vite` Vite plugin (no postcss config needed).
- No test framework configured yet.

## Conventions

- **TDD required**: write tests before implementation code.
- **Conventional commits**: use `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:` prefixes.

## Tests

- **Backend unit**: `make test-backend` (runs `npm run test` in container)
- **Backend e2e**: `make test-backend-e2e` (runs `npm run test:e2e` which auto-runs migrations)
- To run a single test file: `docker exec -it online-cinema-backend npm run test -- path/to/file.spec.ts`
- **Frontend**: no test runner configured.
- **Hate speech detector**: no tests configured.
