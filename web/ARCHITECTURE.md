# Web app architecture notes

## Project-scoped navigation

Workspace context uses URLs under `/w/:workspaceId/p/:projectId/…` for Board, Tasks, Labels, and Members. Activity, project management, and workspace settings stay at `/w/:workspaceId/…`.

The sidebar **project switcher** keeps the current section (board, list, tasks, labels, members) when changing projects. The active project id is stored in the URL and mirrored in `localStorage` (`tf_board_project_${workspaceId}`).

## Data scope vs routes

| UI route (project context) | API today        | Planned                          |
| -------------------------- | ---------------- | -------------------------------- |
| Board / Tasks              | Project-scoped   | Same                             |
| Labels                     | Workspace labels | `GET /projects/:id/labels`       |
| Members                    | Workspace members| Project membership / contributors |

Labels and Members pages show workspace-wide data with a banner until project-scoped APIs exist. Routes and navigation will not need to change when those APIs land—only the query hooks and copy.

## Settings

Workspace settings (`/w/:workspaceId/settings`) require `ADMIN` or `OWNER` in the API. The sidebar hides Settings for non-admins; the page shows a read-only message if opened directly.

Project settings (archive, delete, edit) remain on the board header via `ProjectActions` for now. A future `/w/:workspaceId/p/:projectId/settings` route can consolidate project admin actions.
