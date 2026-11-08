# Web app architecture notes

The agreed permissions and workflows live in [the feature matrix](../REDESIGN_FEATURE_MATRIX.md). Implementation progress and unverified work live in [the tracker](../REDESIGN_IMPLEMENTATION_TRACKER.md).

## Components and presentation

The supplied HTML is a concept for structure and workflows. Use the existing shadcn/ui components, Tailwind utilities, and application theme tokens from `src/app/globals.css`. There is no separate redesign directory, stylesheet, or parallel theme system.

The workspace layout mounts `components/app-shell/taskflow-app.tsx`, which reads the active URL context. Project settings/team components live in `components/projects`; task detail editing lives in `components/tasks`. Shared form controls compose the existing Select, Input, Checkbox, Calendar, Popover, and Button components. Dialogs and the task panel use the existing Dialog and Sheet. The shell renders its route children so Next.js can preserve its nested layout/navigation boundaries. Route pages are currently lightweight markers; the shell selects the active feature screen from URL context. Legacy screen components are not mounted.

## Routes and context

- `/workspaces`: list accessible workspaces and create a workspace.
- `/w/:workspaceId/p/:projectId/board` and `/board/list`: project tasks.
- Project `/activity`, `/members`, and `/settings` use the same project prefix.
- Workspace `/activity`, `/members`, and `/settings` use the workspace prefix.
- `/w/:workspaceId/profile` and `/account`: personal profile and preferences.
- Task panels can be linked through `?task=:taskId` on a project route.

The URL identifies workspace/project context. Selecting a project uses the actor's preferred starting view. Creating a workspace switches directly to that workspace.

The workspace layout opts out of Next.js instant-navigation validation because the existing token session guard resolves in the browser. This does not weaken API authorization or change prerendering; it avoids claiming a static authenticated shell before that guard resolves.

## Authorization and data scope

Workspace ownership is stored as a single `Workspace.ownerId`. Workspace membership tracks access and activation, not Admin rank. Explicit `ProjectMembership` records carry ADMIN or MEMBER. WORKSPACE_OWNER is derived from workspace ownership and has inherent access to its projects without consuming a seat.

API services enforce assignment scope for direct resource reads and list/aggregate queries. UI visibility is supplementary. Workspace directory/settings and project creation/archive/restore/deletion are owner-only. Assigned project admins may manage settings and other project users; self-removal/self-demotion is prohibited. Archived projects reject writes.

Labels and personal saved views belong to projects. Assignee pickers contain active project users plus the owner. Workspace activity for non-owners excludes unassigned projects; activity filters are owner-only.

## Persistence and sessions

The browser calls the Express API through `api-client.ts` and TanStack Query. Tokens use the existing browser storage. Access tokens reference a server-side refresh-session record, so logout/account deletion revoke access. Personal profile/theme/start-view preferences persist on the user; board settings persist on the project. No email-sending or invitation flows are included.

## Six-second recovery

Task, label, project, and workspace-member deletion immediately hides/revokes the affected resource and creates a recovery record. The API enforces the six-second deadline even if cleanup has not run. Undo rechecks current permissions. A cleanup worker permanently removes expired records and their deleted entities; no global state snapshots are restored. Comments/activity retain author references when accounts are anonymized on deletion.

## Database baseline

The user approved resetting the existing hosted Prisma Postgres database. The initial migration is a fresh redesigned schema; there is no legacy-data conversion. The reset has been executed against the configured hosted database. Future production changes still require reviewed schema migrations. Do not run another reset as a routine startup/check.
