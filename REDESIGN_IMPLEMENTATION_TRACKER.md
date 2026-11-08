# TaskFlow redesign and feature upgrade tracker

Last updated: 2026-11-08  
Overall status: **Requirements agreed; implementation not started**

## References and tracking rules

- [Feature and actor matrix](REDESIGN_FEATURE_MATRIX.md) is the source of truth for permissions and agreed behavior.
- [TaskFlow Redesign.html](TaskFlow%20Redesign.html) is the visual and interaction reference. Agreed requirements override conflicting prototype behavior.
- Keep feature IDs from the matrix in implementation notes, tests, and pull requests.
- `[ ]` means unfinished; `[x]` means completed and verified. Describe partial work in the progress log without marking it complete.
- Update this tracker as work lands. Record validation evidence and remaining limitations. A phase is complete only when its implementation and acceptance checks pass.

## Phase overview

| Phase | Scope | Status | Depends on |
| --- | --- | --- | --- |
| 0 | Requirements and reference review | Complete | — |
| 1 | Implementation baseline and schema design | Not started | 0 |
| 2 | Fresh local database and domain foundations | Not started | 1 |
| 3 | Backend permissions and workspace/project lifecycle | Not started | 2 |
| 4 | Tasks, labels, comments, search, and recovery APIs | Not started | 3 |
| 5 | Shared visual system and navigation | Not started | 1; final wiring needs 3–4 |
| 6 | Desktop screens and account flows | Not started | 3–5 |
| 7 | Mobile screens and responsive behavior | Not started | 5–6 |
| 8 | Integration, regression, and release readiness | Not started | 2–7 |

## Agreed scope to preserve

- Exactly three role names: `WORKSPACE_OWNER`, `ADMIN`, `MEMBER`. Ownership is workspace-scoped; Admin/Member assignments are project-scoped.
- Exactly one owner per workspace. Any user can create a workspace, become its owner, and switch to it immediately.
- Admins/members can see only assigned projects. Owners can access all projects in their workspace.
- Workspace directory, workspace settings, project creation/archive/restore/deletion, and seat-limit changes are owner-only.
- Admins can manage assigned-project settings, labels, and other project users/admins. They cannot remove or demote themselves.
- No self-service leaving of workspaces or projects. Owners may delete their only workspace.
- No invitations, workspace-wide Admin role, workspace-visible/private setting, default task assignee, cross-project task moves, shared saved views, or email sending.
- Keep full nested tasks, allow parent completion with unfinished subtasks, and add In review status.
- Keep Active / Paused / Completed project statuses.
- Own comments can be edited/deleted; no actor can edit/delete another user's comments or manually alter audit records.
- Six-second Undo for supported task, label, project, and workspace-member deletions. No longer application recovery window.
- Deactivation revokes access and clears affected task assignments while retaining project memberships and seats. Preserve authored comments/history on removal/deactivation.
- Persist personal settings per account, board settings per project, and personal saved views per user/project.
- Discard existing local data and start fresh; no legacy-data conversion or backfill. Reset only the verified local database target during implementation.

## Phase 0 — Requirements and reference review

- [x] Study bundled redesign screens and interaction logic.
- [x] Compare redesign with existing frontend, backend authorization, and schema.
- [x] Create the feature/actor matrix with stable feature IDs.
- [x] Incorporate user corrections and resolve review decisions R1–R12.
- [x] Record local data reset, six-second Undo, and exclusion of email sending.

Evidence: [Agreed matrix](REDESIGN_FEATURE_MATRIX.md). Source templates/styles were reviewed; rendered visual verification of the local HTML remains to be completed in Phase 1.

## Phase 1 — Implementation baseline and schema design

- [ ] Inspect current branch, local changes, applicable repository instructions, scripts, and existing checks before editing implementation files.
- [ ] Render and inspect the reference screens through an available permitted workflow; capture visual baselines for desktop and mobile.
- [ ] Inventory existing routes and APIs; map them to retained, replaced, and removed flows.
- [ ] Define schema and service contracts for ownership, workspace membership status, project membership/roles, seats, preferences, saved views, and recoverable deletion.
- [ ] Define per-project task sequence allocation and key-change behavior without duplicate task identifiers.
- [ ] Define the atomic ownership-transfer operation, including explicit former-owner assignments/roles and seat-limit checks.
- [ ] Define six-second deletion/Undo behavior across API requests, reloads, expiry, concurrent changes, and cleanup after restart.
- [ ] Record implementation choices in the relevant project architecture documentation without changing agreed product requirements.

Acceptance: data relationships, route/API mapping, and recovery behavior are concrete enough to implement; prototype permission conflicts are resolved using the matrix.

## Phase 2 — Fresh local database and domain foundations

References: R1, R3–R10, R12; W07–W08; Q01–Q06; T07, T17–T20; L01–L07; V05–V08.

- [ ] Verify the resolved reset target is the intended local development database. Do not print database credentials or reset a remote/production database.
- [ ] Implement fresh-schema migrations/versioning; do not write migration/backfill logic for existing application data.
- [ ] Replace legacy OWNER/VIEWER assumptions with the approved role model and exactly-one-owner constraint.
- [ ] Add active/deactivated workspace membership and explicit project membership with Admin/Member roles.
- [ ] Add project seats, color, task defaults, board options, and stable task sequencing.
- [ ] Move label ownership/uniqueness to project scope in the new schema.
- [ ] Add In review task status while retaining full nested tasks and project statuses.
- [ ] Add profile, account preferences, and personal saved-view persistence.
- [ ] Add recovery records/state needed for six-second Undo and retained author/history references.
- [ ] Reset the verified local database and initialize the redesigned schema.
- [ ] Update optional demo fixtures to cover all roles, multiple projects, deactivated users, seat limits, and an account with no workspaces.
- [ ] Generate the Prisma client and verify fresh database initialization.

Acceptance: a clean local database can be initialized reproducibly with the new schema; no legacy data migration is required and no remote data has been reset.

## Phase 3 — Backend permissions and lifecycle

References: W01–W09; U01–U08; P01–P14; S01–S15; Q01–Q06; R1–R5, R9.

- [ ] Centralize workspace ownership and project membership authorization in services, independent of UI visibility.
- [ ] Enforce assignment-only project access across detail/list endpoints, counts, search, activity, and task/label/member lookups.
- [ ] Allow all users to create a workspace and return context needed for immediate switching.
- [ ] Implement owner-only workspace directory/settings, rename, and deletion, including deletion of the only workspace.
- [ ] Link existing self-registered accounts by email; remove invitation behavior and another-user profile editing.
- [ ] Implement member deactivation/reactivation/removal with agreed access, assignment, history, and seat behavior.
- [ ] Implement atomic ownership transfer to an active workspace user with explicit former-owner assignments/roles.
- [ ] Implement project membership addition, promotion, demotion, and removal; block Admin self-removal/self-demotion.
- [ ] Allow projects without an Admin while preserving owner control.
- [ ] Enforce seat limits when assigning project users, including concurrent additions; only owners can change limits.
- [ ] Implement Admin/owner project settings; omit default assignee and visibility controls.
- [ ] Restrict project creation/archive/restore/deletion to the workspace owner.
- [ ] Block writes to archived projects regardless of actor role.
- [ ] Preserve project Active / Paused / Completed status behavior.

Acceptance: direct API requests enforce every agreed permission, including cross-project access denial and lifecycle safeguards.

## Phase 4 — Tasks, collaboration, search, and recovery APIs

References: T01–T21; L01–L07; A01–A10; V01–V12; M06; R6–R8.

- [ ] Support task CRUD, In review transitions, column moves, due dates, priorities, duplication, and project-scoped readable identifiers.
- [ ] Apply project default status/priority; column creation overrides default status. No default assignee.
- [ ] Restrict assignee choices to active assigned project users and the workspace owner.
- [ ] Retain nested-task fields; allow renaming/deleting subtasks and parent completion with unfinished subtasks.
- [ ] Enforce project-scoped labels and Admin/owner label administration; allow Member label creation through task picker.
- [ ] Implement own-comment edits/deletion and prohibit editing/deleting others' comments for every role.
- [ ] Retain authored history when users lose membership or delete accounts.
- [ ] Provide project/task activity and assignment-scoped workspace activity; expose project/event-type activity filtering only to the owner.
- [ ] Support global/project search, task filters/sorts, and personal saved views with creator enforcement.
- [ ] Implement recoverable deletion and six-second Undo for tasks, labels, projects, and workspace-member removal.
- [ ] Enforce the Undo deadline on the server; prevent restoration after expiry and preserve concurrent edits.
- [ ] Ensure access revocation is immediate during pending membership removal and Undo never bypasses current permissions or seat limits.
- [ ] Ensure expiry cleanup and recovery work correctly after page reload and API restart.

Acceptance: workflows work against persisted data, permissions apply to direct API calls, and Undo has a server-enforced six-second deadline.

## Phase 5 — Shared visual system and navigation

References: prototype-wide design; W01–W02; V02, V12; M01–M05.

- [ ] Establish the reference typography, warm neutral palette, accent colors, spacing, borders, radii, icons, and status/priority treatments.
- [ ] Build reusable buttons, inputs, menus, tabs, dialogs, sheets, badges, avatars, toasts, and empty/loading/error states.
- [ ] Implement workspace switcher, project navigation, archived-project navigation, and account menu with role-aware visibility.
- [ ] Implement project header and Board / List / Activity / Members / Settings tabs with role-aware actions.
- [ ] Remove obsolete navigation and prototype controls excluded by the matrix.
- [ ] Implement accessible focus behavior, keyboard navigation, Escape handling, and meaningful control labels.
- [ ] Implement persistent desktop/mobile appearance controls and reusable responsive layouts.

Acceptance: shared shell and controls match the reference direction and expose only actions permitted for the active context.

## Phase 6 — Desktop screens and account flows

References: all desktop prototype screens and feature groups W, U, P, S, Q, T, L, A, V, C.

- [ ] Implement board cards, status columns, optional Cancelled column, WIP warnings, drag/drop, and inline task creation.
- [ ] Implement list view, subtask display, pagination, filters, sorting, and personal saved views.
- [ ] Implement task detail side panel/full-width mode, autosave, assignment picker, duplication, subtasks, labels, comments, and history.
- [ ] Implement project settings, task defaults, card options, label management, and read-only seat usage for Members/Admins where appropriate.
- [ ] Implement project team search, add-person flow, role management, and removal safeguards.
- [ ] Implement owner-only workspace people/settings, seat allocation, and ownership transfer.
- [ ] Implement owner-only project creation/archive/restore/deletion and permitted workspace deletion.
- [ ] Implement activity screens with assigned-project data boundaries and owner-only activity filters.
- [ ] Implement global search/jump navigation with permission-filtered results and actions.
- [ ] Implement self-registration, login, logout, existing-account workspace linking, and authenticated password change.
- [ ] Implement profile editing, avatar, name/email changes, timezone, personal statistics, and default project view.
- [ ] Implement own-account deletion with transfer/deletion of owned workspaces first and retained surviving history.
- [ ] Exclude email-based password reset, all notification/reminder/digest sending, and associated preference controls.
- [ ] Implement no-workspace, no-project, empty-result, access-revoked, archived, pending-deletion, and failed-request states.

Acceptance: desktop screens use live API data and complete end-to-end workflows with correct role and project context.

## Phase 7 — Mobile and responsive behavior

References: M01–M06 and the mobile reference screen.

- [ ] Implement Board / My tasks / Activity / More navigation and workspace/project selection.
- [ ] Implement task creation/editing/status movement/deletion using mobile sheets with desktop-equivalent permissions.
- [ ] Implement assigned-to-me filtering and readable card/list layouts at narrow widths.
- [ ] Support owner project creation/archive and all-user workspace creation on mobile.
- [ ] Make project/team/settings/account flows usable on mobile without exposing forbidden actions.
- [ ] Implement personal appearance controls and six-second Undo with adequate touch targets.
- [ ] Verify keyboard/focus, scrolling, horizontal board navigation, long content, and sheet/dialog sizing on narrow screens.

Acceptance: the agreed feature set is usable on desktop and mobile; smaller screens do not change permissions.

## Phase 8 — Verification and release readiness

- [ ] Run appropriate API/web lint, type checks, builds, and existing required CI checks.
- [ ] Test each role against allowed/denied actions in the matrix, including direct API calls.
- [ ] Test a user who owns one workspace, is Admin in one project, and Member in another; context switching must not leak privileges.
- [ ] Verify unassigned projects are absent from navigation, lists, counts, search, activity, and direct URLs/API responses.
- [ ] Verify ownership transfer, seat-limit races, deactivation/reactivation/removal, and Admin self-action restrictions.
- [ ] Verify six-second Undo before/after expiry, nested data recovery, concurrent edits, reloads, and restarts.
- [ ] Verify comment ownership, personal saved-view isolation, account deletion prerequisites, and retained history.
- [ ] Verify archived-project write protection and owner-only restoration.
- [ ] Compare desktop/mobile screens against the reference; record screenshots and material deviations.
- [ ] Verify accessibility basics, keyboard flows, responsive layouts, error recovery, and loading/empty states.
- [ ] Verify no excluded invitation/email/visibility/default-assignee features remain exposed.
- [ ] Verify fresh local initialization and update setup/architecture/API documentation for the new model.
- [ ] Review final changes, record remaining limitations, and prepare a concrete release summary. Record deployment/production verification separately if performed.

Acceptance: required checks pass, critical workflows are browser-verified, and any unverified environment or deployment behavior is explicitly recorded.

## Coverage index

Ranges include removed/denied features: verification must check their absence or rejection, not implement them as enabled actions.

| Matrix IDs | Implementation phases |
| --- | --- |
| W01–W09 | 2, 3, 5, 6, 8 |
| U01–U08 | 2, 3, 6, 8 |
| P01–P14 | 2, 3, 5, 6, 8 |
| S01–S15 | 2, 3, 5, 6, 8 |
| Q01–Q06 | 2, 3, 6, 8 |
| T01–T21 | 2, 4, 6, 7, 8 |
| L01–L07 | 2, 4, 6, 8 |
| A01–A10 | 3, 4, 6, 8 |
| V01–V12 | 2, 4, 5, 6, 8 |
| C01–C12 | 2, 3, 6, 8 |
| M01–M06 | 4, 5, 7, 8 |

## Progress log

| Date | Work completed | Verification / evidence | Next step |
| --- | --- | --- | --- |
| 2026-11-08 | Reviewed redesign and agreed feature permissions, corrections, exclusions, local reset, and six-second Undo. Created this tracker. | Requirements recorded in REDESIGN_FEATURE_MATRIX.md. No application code changed or database reset performed as part of tracker creation. | Phase 1: implementation baseline, rendered reference review, and schema/service design. |

## Blockers and limitations

- No unresolved product decisions from the completed requirements review.
- Rendered reference inspection remains pending: the earlier browser attempt could not open the local HTML under the available browser policy. Source templates/styles were inspected.
- Application implementation, local database reset, automated implementation checks, and browser workflow verification have not started.
- Identify the actual local database target before the reset step; a configured connection must not be assumed to be local.
