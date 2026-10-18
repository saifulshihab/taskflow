# TaskFlow

Full-stack project and task management: workspaces, Kanban boards, labels,
comments, and an activity feed. The **Express REST API** and **Next.js web app**
share the same domain logic; the UI talks to the API through a BFF layer
(httpOnly cookies, Server Actions). The backend is structured so the same
services can later be exposed through an MCP server without duplicating
authorization or business rules.

## Stack

| Layer    | Technologies |
| -------- | ------------ |
| API      | Express 5, TypeScript, Zod, Prisma 7, Prisma Postgres |
| Web      | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, dnd-kit |
| Auth     | JWT access tokens + rotating opaque refresh tokens (argon2 password hashing) |
| Dev ops  | Docker Compose (API + web), hosted Prisma Postgres |

## Features

- **Workspaces** with slug, settings, and role-based access (`OWNER` → `VIEWER`)
- **Projects** with status, archive/unarchive, and per-project **board** and **list** views
- **Tasks** with status, priority, assignee, due dates, subtasks, and drag-and-drop on boards
- **Labels** at workspace scope, attachable to tasks
- **Comments** (soft-deleted for activity continuity)
- **Activity** feed per workspace
- **Members** management and invitations by role

## Running it

**Prerequisites:** Docker, a Prisma Postgres database, and a copy of `.env`
(see `.env.example`). In Prisma Console, generate both connection strings for
the same database. Put the pooled string in `DATABASE_URL` and the direct string
in `DIRECT_URL`. If you already have a `.env`, replace its local database URLs
and remove the old `*_CONTAINER` and local `SHADOW_DATABASE_URL` entries. Keep
the credentials in the ignored `.env` file.

The API and web run in Docker and connect to the hosted database.

```bash
cp .env.example .env             # first time; set both database URLs and JWT secrets
docker compose up -d --build     # API on http://localhost:4000, web on http://localhost:3100
docker compose exec api npm run db:migrate  # apply the checked-in migrations
curl localhost:4000/health       # {"status":"ok","database":"up"}
```

The API Dockerfile generates the Prisma client and compiles the API while
building the image. Its default command applies committed migrations before
starting the compiled API. Compose overrides that command with the dev server,
so run the migration command shown above for local development. Compose also
regenerates the client at startup because its development bind mount hides
generated files from the image.

Open the UI at `http://localhost:${WEB_PORT:-3100}` and register an account.
Existing data in a local database is not copied by the migration command.

**First time**, or after changing dependencies:

```bash
docker compose run --rm api npm ci
docker compose run --rm web npm ci
docker compose exec api npm run db:migrate
```

The seed is optional and **deletes all existing application data** before
creating demo accounts. Run `docker compose exec api npm run db:seed` only against
a disposable database.

### Web on the host

The Compose `web` service uses `API_URL=http://api:4000/api`. If you run the UI
locally instead:

```bash
cd web && npm ci && API_URL=http://localhost:4000/api npm run dev
```

You still need the API running (`docker compose up -d api` is enough) and valid
Prisma Postgres credentials in the API container's `.env`.

Auth uses httpOnly cookies (BFF): `web/src/proxy.ts` refreshes access tokens
before Server Components run, and Server Actions call the REST API via
`web/src/lib/api.ts`.

### Day-to-day commands

`node_modules` for API and web live in Docker volumes when using Compose:

```bash
docker compose exec api npm run typecheck
docker compose exec web npx tsc --noEmit
docker compose exec api npm run db:migrate
docker compose logs -f api
docker compose logs -f web
```

### Database connections and migrations

`DATABASE_URL` is Prisma Postgres's pooled connection for API queries.
`DIRECT_URL` connects directly for Prisma CLI commands such as migrations.
Both values come from the same database in Prisma Console and require TLS.
`npm run db:migrate` applies the migration files in `prisma/migrations`; review
them before running against a database with data. To create a new migration with
`npm run db:migrate:dev -- --name <name>`, configure `SHADOW_DATABASE_URL` for a
**separate disposable database** first; never point it at the main database.

### GitHub CI and Vercel deployment

GitHub Actions runs API and web checks on pull requests and pushes to `main`.
The API Docker image build does not connect to the database. When a production
container starts, it runs `prisma migrate deploy` before accepting requests.
This applies only committed migrations; it does not run the destructive seed
script. Set `DIRECT_URL` on the API host to the **direct connection URL for the
production database**. The API container also needs `DATABASE_URL` for its
pooled application queries.

Deploy the Express API on a separate host. Set `JWT_ACCESS_SECRET` and
`JWT_REFRESH_SECRET` there. Import this repository into Vercel as a Next.js
project with **Root Directory** set to `web`. Set Vercel's server-side
`API_URL` to the deployed API's HTTPS URL ending in `/api` (for example,
`https://api.example.com/api`). The web app does not need database credentials.

Vercel deploys from GitHub automatically. Start the updated API container and
verify its migration succeeds before promoting web changes that depend on the
new schema.

### Seeded accounts

`npm run db:seed` **wipes every table**, then creates the `acme-rockets`
workspace with `ada@taskflow.dev` (owner), `grace@taskflow.dev` (admin) and
`linus@taskflow.dev` (member). Password for all three: `password123`.

## Trying the API

The `requests/` directory holds `.http` files grouped by module, runnable from an
editor REST client. Each file logs in first and reuses the token; run requests
top to bottom.

Files: `auth.http`, `workspaces.http`, `projects.http`, `tasks.http`,
`comments-activity.http`.

## Repository layout

```
src/                    # Express API
  server.ts app.ts routes.ts env.ts seed.ts
  lib/                  prisma, tokens, password, errors, http, pagination, rbac, …
  middleware/           requireAuth, errorHandler
  modules/<auth|workspaces|projects|tasks|labels|comments|activity>/
                        *.routes.ts  *.controller.ts  *.service.ts  *.schema.ts

web/                    # Next.js app
  src/app/              routes (auth, workspaces, /w/[workspaceId]/…)
  src/components/       UI, app shell, tasks (board, table, detail)
  src/lib/              api client, Server Actions, RBAC helpers, data loaders

prisma/                 schema and migrations
requests/               REST client examples
```

Every API module repeats the same four files: routes map paths to controllers,
controllers validate input and call services, and services hold business logic.

### The one rule that matters

Services never touch `req` or `res`. They take an explicit `actor` and plain
arguments, and they perform their own authorization through
`requireMembership`. That is what makes an MCP phase straightforward: a tool
handler builds an actor and calls the same function the HTTP layer calls, with
identical permission checks and no HTTP round trip.

```
Express routes/controllers ─┐
                            ├─> services ──> Prisma ──> Postgres
MCP tools (later)          ─┘
```

## API reference

Base path: `/api`. Send `Authorization: Bearer <accessToken>` on all routes
except register, login, and refresh.

### Auth

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `GET /auth/me`

### Workspaces and members

- `POST /workspaces`, `GET /workspaces`
- `GET /workspaces/:workspaceId`, `PATCH /workspaces/:workspaceId`, `DELETE /workspaces/:workspaceId`
- `GET /workspaces/:workspaceId/members`, `POST /workspaces/:workspaceId/members`
- `PATCH /workspaces/:workspaceId/members/:userId`, `DELETE /workspaces/:workspaceId/members/:userId`

### Projects

- `POST /workspaces/:workspaceId/projects`, `GET /workspaces/:workspaceId/projects`
- `GET /projects/:projectId`, `PATCH /projects/:projectId`, `DELETE /projects/:projectId`
- `POST /projects/:projectId/archive`, `POST /projects/:projectId/unarchive`

### Tasks

- `POST /projects/:projectId/tasks`, `GET /projects/:projectId/tasks`
- `GET /workspaces/:workspaceId/tasks`
- `GET /tasks/:taskId`, `PATCH /tasks/:taskId`, `DELETE /tasks/:taskId`
- `PATCH /tasks/:taskId/status`, `PATCH /tasks/:taskId/assignee`
- `GET /tasks/:taskId/subtasks`
- `POST /tasks/:taskId/labels`, `DELETE /tasks/:taskId/labels/:labelId`

### Labels, comments, activity

- `GET /workspaces/:workspaceId/labels`, `POST /workspaces/:workspaceId/labels`
- `PATCH /labels/:labelId`, `DELETE /labels/:labelId`
- `GET /tasks/:taskId/comments`, `POST /tasks/:taskId/comments`
- `PATCH /comments/:commentId`, `DELETE /comments/:commentId`
- `GET /workspaces/:workspaceId/activity`

### Roles

`OWNER > ADMIN > MEMBER > VIEWER`. Reads need `VIEWER`, creating and editing
content needs `MEMBER`, managing members and archiving needs `ADMIN`, and
deleting a workspace or granting ownership needs `OWNER`. A workspace always
keeps at least one owner. Non-members get `404` rather than `403`, so private
workspaces are indistinguishable from ones that do not exist.

### Conventions

Lists return `{ data, meta: { page, pageSize, total, totalPages } }` and accept
`page` and `pageSize` (max 100). Errors return
`{ error: { code, message, details? } }`: `400` bad request, `401`
unauthorized, `403` forbidden, `404` not found, `409` conflict, `422`
validation failure.

Task list filters: `status`, `priority` (repeatable), `assigneeId` (a uuid, or
`me`/`unassigned`), `projectId`, `labelId`, `parentTaskId`, `topLevelOnly`,
`dueBefore`, `dueAfter`, `search`, and `sort` (prefix with `-` to reverse).

## Implementation notes

- Refresh tokens are opaque random strings stored as HMACs and rotated on every
  refresh; replaying a used one fails.
- `completedAt` is derived from status rather than accepted from clients, and a
  task cannot be marked `DONE` while it has unfinished subtasks.
- Comments are soft-deleted so the activity trail keeps pointing at something.
- npm 11 blocks install scripts by default; `argon2`, `esbuild` and the Prisma
  engines are approved in `package.json` under `allowScripts`.
