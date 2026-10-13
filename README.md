# TaskFlow API

A project/task-management REST API built with Express 5, TypeScript and Prisma
on Prisma Postgres. It exists as a realistic backend to later expose through an
MCP server.

## Running it

Two processes: the database runs on your host, the API runs in Docker.

```bash
npx prisma@prev dev --detach   # local Prisma Postgres (ports 51214/51215)
docker compose up -d           # API on http://localhost:4000
curl localhost:4000/health     # {"status":"ok","database":"up"}
```

First time only, or after changing dependencies:

```bash
docker compose run --rm api npm ci
docker compose exec api npx prisma migrate dev
docker compose exec api npm run db:seed
```

Everything else runs inside the container, because `node_modules` lives in a
Docker volume rather than on your host:

```bash
docker compose exec api npm run typecheck
docker compose exec api npx prisma migrate dev --name <name>
docker compose logs -f api
```

### Why two connection strings

`prisma dev` binds to `127.0.0.1`, and Docker Desktop runs containers inside a
VM, so a container cannot reach that address directly. `.env` therefore carries
both `DATABASE_URL` (localhost, used when the Prisma CLI runs on your host) and
`DATABASE_URL_CONTAINER` (`host.docker.internal`), which `docker-compose.yml`
maps onto `DATABASE_URL` inside the container.

### Seeded accounts

`npm run db:seed` **wipes every table**, then creates the `acme-rockets`
workspace with `ada@taskflow.dev` (owner), `grace@taskflow.dev` (admin) and
`linus@taskflow.dev` (member). Password for all three: `password123`.

## Trying the endpoints

The `requests/` directory holds `.http` files for every endpoint, grouped by
module, runnable from an editor REST client. Each file logs in first and reuses
the returned token, so run the requests top to bottom.

## Layout

```
src/
  server.ts app.ts routes.ts env.ts seed.ts
  lib/         prisma, tokens, password, errors, http, pagination, rbac, scope, activity, actor, logger
  middleware/  requireAuth, errorHandler
  modules/<auth|workspaces|projects|tasks|labels|comments|activity>/
               *.routes.ts  *.controller.ts  *.service.ts  *.schema.ts
```

Every module repeats the same four files. Routes map paths to controllers,
controllers validate input and call services, and services hold the business
logic.

### The one rule that matters

Services never touch `req` or `res`. They take an explicit `actor` and plain
arguments, and they perform their own authorization through
`requireMembership`. That is what makes the MCP phase straightforward: a tool
handler builds an actor and calls the same function the HTTP layer calls, with
identical permission checks and no HTTP round trip.

```
Express routes/controllers ─┐
                            ├─> services ──> Prisma ──> Postgres
MCP tools (later)          ─┘
```

## API

All routes are under `/api` and require `Authorization: Bearer <accessToken>`
except register, login and refresh.

| Area       | Endpoints                                                                             |
| ---------- | ------------------------------------------------------------------------------------- |
| Auth       | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Workspaces | `POST                                                                                 | GET /workspaces`, `GET                                                      | PATCH                                            | DELETE /workspaces/:workspaceId`                                 |
| Members    | `GET                                                                                  | POST /workspaces/:workspaceId/members`, `PATCH                              | DELETE /workspaces/:workspaceId/members/:userId` |
| Projects   | `POST                                                                                 | GET /workspaces/:workspaceId/projects`, `GET                                | PATCH                                            | DELETE /projects/:projectId`, `POST /projects/:projectId/archive | unarchive`                                                                                                      |
| Tasks      | `POST                                                                                 | GET /projects/:projectId/tasks`, `GET /workspaces/:workspaceId/tasks`, `GET | PATCH                                            | DELETE /tasks/:taskId`, `PATCH /tasks/:taskId/status             | assignee`, `GET /tasks/:taskId/subtasks`, `POST /tasks/:taskId/labels`, `DELETE /tasks/:taskId/labels/:labelId` |
| Labels     | `GET                                                                                  | POST /workspaces/:workspaceId/labels`, `PATCH                               | DELETE /labels/:labelId`                         |
| Comments   | `GET                                                                                  | POST /tasks/:taskId/comments`, `PATCH                                       | DELETE /comments/:commentId`                     |
| Activity   | `GET /workspaces/:workspaceId/activity`                                               |

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

## Notes

- Refresh tokens are opaque random strings stored as HMACs and rotated on every
  refresh; replaying a used one fails.
- `completedAt` is derived from status rather than accepted from clients, and a
  task cannot be marked `DONE` while it has unfinished subtasks.
- Comments are soft-deleted so the activity trail keeps pointing at something.
- npm 11 blocks install scripts by default; `argon2`, `esbuild` and the Prisma
  engines are approved in `package.json` under `allowScripts`.
