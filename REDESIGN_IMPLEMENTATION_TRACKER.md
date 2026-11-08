# TaskFlow redesign and feature upgrade tracker

Last updated: 2026-11-08  
Overall status: **Implementation in progress; backend and desktop foundation implemented, final integration and browser/mobile QA pending**

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
| 1 | Implementation baseline and schema design | Complete | 0 |
| 2 | Fresh Prisma Postgres database and domain foundations | Schema/reset complete; fixture coverage partial | 1 |
| 3 | Backend permissions and workspace/project lifecycle | Implemented; 106 integration assertions passed | 2 |
| 4 | Tasks, labels, comments, search, and recovery APIs | Implemented; 106 integration assertions passed | 3 |
| 5 | Shared visual system and navigation | Refactored to existing design system; QA in progress | 1; final wiring needs 3–4 |
| 6 | Desktop screens and account flows | First implementation complete; browser QA partial | 3–5 |
| 7 | Mobile screens and responsive behavior | Implemented; 390px smoke checks passed, extended QA pending | 5–6 |
| 8 | Integration, regression, and release readiness | In progress | 2–7 |

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
- User clarified that the reset target is the existing hosted Prisma Postgres development/production database, not a new local PostgreSQL instance. That configured database has been reset and the fresh schema applied. No legacy-data conversion/backfill.

## Phase 0 — Requirements and reference review

- [x] Study bundled redesign screens and interaction logic.
- [x] Compare redesign with existing frontend, backend authorization, and schema.
- [x] Create the feature/actor matrix with stable feature IDs.
- [x] Incorporate user corrections and resolve review decisions R1–R12.
- [x] Record configured database reset, six-second Undo, and exclusion of email sending.

Evidence: [Agreed matrix](REDESIGN_FEATURE_MATRIX.md). Source templates/styles were reviewed; rendered visual verification of the local HTML remains to be completed in Phase 1.

## Phase 1 — Implementation baseline and schema design

- [x] Inspect current branch, local changes, applicable repository instructions, scripts, and existing checks before editing implementation files.
- [x] Review reference layout/workflows directly from the source. User clarified that the concept is not a separate design system or a pixel-replication target; existing components/tokens take precedence.
- [x] Inventory existing routes and APIs; map them to retained, replaced, and removed flows.
- [x] Define schema and service contracts for ownership, workspace membership status, project membership/roles, seats, preferences, saved views, and recoverable deletion.
- [x] Define per-project task sequence allocation and key-change behavior without duplicate task identifiers.
- [x] Define the atomic ownership-transfer operation, including explicit former-owner assignments/roles and seat-limit checks.
- [x] Define six-second deletion/Undo behavior across API requests, reloads, expiry, concurrent changes, and cleanup after restart.
- [x] Record implementation choices in the relevant project architecture documentation without changing agreed product requirements.

Acceptance: data relationships, route/API mapping, and recovery behavior are concrete enough to implement; prototype permission conflicts are resolved using the matrix.

## Phase 2 — Fresh Prisma Postgres database and domain foundations

References: R1, R3–R10, R12; W07–W08; Q01–Q06; T07, T17–T20; L01–L07; V05–V08.

- [x] Verify the resolved reset target is the existing Prisma Postgres development/production database named by the user. Do not print database credentials.
- [x] Implement fresh-schema migrations/versioning; do not write migration/backfill logic for existing application data.
- [x] Replace legacy OWNER/VIEWER assumptions with the approved role model and exactly-one-owner constraint.
- [x] Add active/deactivated workspace membership and explicit project membership with Admin/Member roles.
- [x] Add project seats, color, task defaults, board options, and stable task sequencing.
- [x] Move label ownership/uniqueness to project scope in the new schema.
- [x] Add In review task status while retaining full nested tasks and project statuses.
- [x] Add profile, account preferences, and personal saved-view persistence.
- [x] Add recovery records/state needed for six-second Undo and retained author/history references.
- [x] Reset the verified existing Prisma Postgres database and initialize the redesigned schema.
- [ ] Update optional demo fixtures to cover all roles, multiple projects, deactivated users, seat limits, and an account with no workspaces.
- [x] Generate the Prisma client and verify fresh database initialization.

Acceptance: a fresh Prisma Postgres database can be initialized reproducibly with the new schema; no legacy data migration is required and only the intended Prisma Postgres database has been reset.

## Phase 3 — Backend permissions and lifecycle

References: W01–W09; U01–U08; P01–P14; S01–S15; Q01–Q06; R1–R5, R9.

- [x] Centralize workspace ownership and project membership authorization in services, independent of UI visibility.
- [x] Enforce assignment-only project access across detail/list endpoints, counts, search, activity, and task/label/member lookups.
- [x] Allow all users to create a workspace and return context needed for immediate switching.
- [x] Implement owner-only workspace directory/settings, rename, and deletion, including deletion of the only workspace.
- [x] Link existing self-registered accounts by email; remove invitation behavior and another-user profile editing.
- [x] Implement member deactivation/reactivation/removal with agreed access, assignment, history, and seat behavior.
- [x] Implement atomic ownership transfer to an active workspace user with explicit former-owner assignments/roles.
- [x] Implement project membership addition, promotion, demotion, and removal; block Admin self-removal/self-demotion.
- [x] Allow projects without an Admin while preserving owner control.
- [x] Enforce seat limits with workspace-row serialization; verify full-capacity additions and owner-only limit changes. Concurrent-addition stress coverage remains in Phase 8.
- [x] Implement Admin/owner project settings; omit default assignee and visibility controls.
- [x] Restrict project creation/archive/restore/deletion to the workspace owner.
- [x] Block writes to archived projects regardless of actor role.
- [x] Preserve project Active / Paused / Completed status behavior.

Acceptance: direct API requests enforce every agreed permission, including cross-project access denial and lifecycle safeguards.

## Phase 4 — Tasks, collaboration, search, and recovery APIs

References: T01–T21; L01–L07; A01–A10; V01–V12; M06; R6–R8.

- [x] Support task CRUD, In review transitions, column moves, due dates, priorities, duplication, and project-scoped readable identifiers.
- [x] Apply project default status/priority; column creation overrides default status. No default assignee.
- [x] Restrict assignee choices to active assigned project users and the workspace owner.
- [x] Retain nested-task fields; allow renaming/deleting subtasks and parent completion with unfinished subtasks.
- [x] Enforce project-scoped labels and Admin/owner label administration; allow Member label creation through task picker.
- [x] Implement own-comment edits/deletion and prohibit editing/deleting others' comments for every role.
- [x] Retain authored history when users lose membership or delete accounts.
- [x] Provide project/task activity and assignment-scoped workspace activity; expose project/event-type activity filtering only to the owner.
- [x] Support global/project search, task filters/sorts, and personal saved views with creator enforcement.
- [x] Implement recoverable deletion and six-second Undo for tasks, labels, projects, and workspace-member removal.
- [x] Enforce the Undo deadline on the server; prevent restoration after expiry and preserve concurrent edits.
- [x] Ensure access revocation is immediate during pending membership removal and Undo never bypasses current permissions or seat limits.
- [ ] Ensure expiry cleanup and recovery work correctly after page reload and API restart.

Acceptance: workflows work against persisted data, permissions apply to direct API calls, and Undo has a server-enforced six-second deadline.

## Phase 5 — Shared visual system and navigation

References: prototype-wide design; W01–W02; V02, V12; M01–M05.

- [x] Use the existing application typography/theme tokens and shadcn/ui primitives; use the concept for layout/workflows rather than a parallel visual system.
- [x] Build reusable buttons, inputs, menus, tabs, dialogs, sheets, badges, avatars, toasts, and empty/loading/error states.
- [x] Implement workspace switcher, project navigation, archived-project navigation, and account menu with role-aware visibility.
- [x] Implement project header and Board / List / Activity / Members / Settings tabs with role-aware actions.
- [x] Remove obsolete navigation and prototype controls excluded by the matrix.
- [x] Implement accessible focus behavior, keyboard navigation, Escape handling, and meaningful control labels.
- [x] Implement persistent desktop/mobile appearance controls and reusable responsive layouts.

Acceptance: shared shell and controls match the reference direction and expose only actions permitted for the active context.

## Phase 6 — Desktop screens and account flows

References: all desktop prototype screens and feature groups W, U, P, S, Q, T, L, A, V, C.

- [x] Implement board cards, status columns, optional Cancelled column, WIP warnings, drag/drop, and inline task creation.
- [x] Implement list view, subtask display, pagination, filters, sorting, and personal saved views.
- [x] Implement task detail side panel/full-width mode, autosave, assignment picker, duplication, subtasks, labels, comments, and history.
- [x] Implement project settings, task defaults, card options, label management, and read-only seat usage for Members/Admins where appropriate.
- [x] Implement project team search, add-person flow, role management, and removal safeguards.
- [x] Implement owner-only workspace people/settings, seat allocation, and ownership transfer.
- [x] Implement owner-only project creation/archive/restore/deletion and permitted workspace deletion.
- [x] Implement activity screens with assigned-project data boundaries and owner-only activity filters.
- [x] Implement global search/jump navigation with permission-filtered results and actions.
- [x] Implement self-registration, login, logout, existing-account workspace linking, and authenticated password change.
- [x] Implement profile editing, avatar, name/email changes, timezone, personal statistics, and default project view.
- [x] Implement own-account deletion with transfer/deletion of owned workspaces first and retained surviving history.
- [x] Exclude email-based password reset, all notification/reminder/digest sending, and associated preference controls.
- [ ] Implement no-workspace, no-project, empty-result, access-revoked, archived, pending-deletion, and failed-request states.

Acceptance: desktop screens use live API data and complete end-to-end workflows with correct role and project context.

## Phase 7 — Mobile and responsive behavior

References: M01–M06 and the mobile reference screen.

- [x] Implement Board / My tasks / Activity / More navigation and workspace/project selection.
- [x] Implement task creation/editing/status movement/deletion using mobile sheets with desktop-equivalent permissions.
- [x] Implement assigned-to-me filtering and readable card/list layouts at narrow widths.
- [x] Support owner project creation/archive and all-user workspace creation on mobile.
- [ ] Make project/team/settings/account flows usable on mobile without exposing forbidden actions.
- [x] Implement personal appearance controls and six-second Undo with adequate touch targets.
- [ ] Verify keyboard/focus, scrolling, horizontal board navigation, long content, and sheet/dialog sizing on narrow screens.

Acceptance: the agreed feature set is usable on desktop and mobile; smaller screens do not change permissions.

## Phase 8 — Verification and release readiness

- [x] Run the API/web checks used by CI: Prisma generation, API type check/lint/build, web lint/type check/production build. Local checks passed; remote GitHub Actions has not been run.
- [ ] Test each role against allowed/denied actions in the matrix, including direct API calls.
- [x] Test a user who owns one workspace, is Admin in one project, and Member in another; context switching must not leak privileges.
- [x] Verify unassigned projects are absent from navigation, lists, counts, search, activity, and direct URLs/API responses.
- [ ] Verify ownership transfer, seat-limit races, deactivation/reactivation/removal, and Admin self-action restrictions.
- [ ] Verify six-second Undo before/after expiry, nested data recovery, concurrent edits, reloads, and restarts.
- [x] Verify comment ownership, personal saved-view isolation, account deletion prerequisites, and retained history.
- [x] Verify archived-project write protection and owner-only restoration.
- [ ] Compare desktop/mobile screens against the reference; record screenshots and material deviations.
- [ ] Verify accessibility basics, keyboard flows, responsive layouts, error recovery, and loading/empty states.
- [x] Verify no excluded invitation/email/visibility/default-assignee features remain exposed.
- [x] Verify the fresh schema initialization against the configured hosted Prisma Postgres target and update README/web architecture documentation. No replacement local database is used.
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
| 2026-11-08 | Reviewed concept and agreed permissions, exclusions, six-second Undo, and database reset. Created matrix and tracker. | REDESIGN_FEATURE_MATRIX.md. | Implement schema and authorization. |
| 2026-11-08 | Implemented ownership/project membership, seats, project labels/settings, task sequences/In review, personal profile/preferences/views, and recovery schema. Reset the existing configured hosted Prisma Postgres database and regenerated Prisma Client 7.10.0. | Prisma migrate reset completed successfully; API health reports database up. No replacement local database is used. | Verify new API workflows. |
| 2026-11-08 | Implemented API role enforcement, ownership transfer, member activation/removal, own-comment rules, scoped activity, task workflows, and six-second Undo. Bound access tokens to server-side sessions; atomic refresh rotation and logout revocation. | API lint, type checking, and build passed. Initial integration suite passed 77 assertions. Expanded coverage passed 99 assertions, including seat limits, concurrent task IDs, label/project/member Undo, preference persistence, and concurrent refresh rotation. | Finish expanded integration checks and audit coverage. |
| 2026-11-08 | Built the first board/list/task panel, team/settings, workspace users/settings, profile/account, search/views, and responsive navigation implementation. | Desktop board/settings rendered in browser; not every workflow has been browser-tested. | Complete browser/mobile checks. |
| 2026-11-08 | User clarified that existing shadcn/ui components and design tokens take precedence over the concept styling. Removed the temporary redesign directory and taskflow.css; moved code into existing component folders and composed existing UI primitives. | Frontend type checking passed after refactor; browser showed shadcn Select/Checkbox/color popover controls. | Finish focus, menu, responsive, and mutation checks. |
| 2026-11-08 | Patched Next.js and eslint-config-next from 16.4.0 to 16.4.5 after the build reported a security patch requirement. | Host production web build passed on 16.4.5. Container dependencies synchronized and web service restarted on the patched installation. | Verify container is running the patched version. |
| 2026-11-08 | Expanded API regression suite completed. | npm run test:redesign passed 99 assertions against the running API and configured Prisma Postgres database; fixture cleanup completed. | Final desktop/mobile browser checks and release documentation. |
| 2026-11-08 | Corrected nested Next.js route rendering: workspace/project layouts now render children and route pages are lightweight shell markers. | Frontend type checking passed; browser navigation validation is in progress. | Recheck board/list/settings navigation and mobile viewport. |
| 2026-11-08 | Final expanded API suite passed with restart verification and mixed workspace/project role contexts. | TASKFLOW_TEST_RESTART=1 npm run test:redesign passed 106 assertions; API lint/type checks/build passed. | Final production web build result and review. |
| 2026-11-08 | Desktop board/list navigation, task Sheet, Select and Calendar checked; mobile list/task Sheet/navigation checked at 390x844. Corrected mobile Sheet width and restored default viewport. | Browser smoke checks passed. DOM measurement: document width 375px and Sheet width 375px within a 390px viewport. No user data was changed by these read-only browser checks. | Extended role-by-role browser mutations and cross-browser QA remain. |
| 2026-11-08 | Final production web build completed on Next.js 16.4.5 after route/component changes. README and architecture notes updated for the new model. | API/web local CI-equivalent checks passed; web lint retains three warnings in pre-existing legacy code. Remote CI/deployment were not run. | Complete remaining extended QA/review items. |

## Blockers and limitations

- No unresolved product decisions from requirements review.
- The source concept was reviewed directly. Rendering its local HTML was policy-blocked and is no longer a pixel-baseline requirement after the user clarified that existing design-system components take precedence.
- Browser verification is partial. Desktop board/list/settings and shared controls, task Sheet/Calendar, and 390px mobile list/Sheet/navigation were inspected. Full role-by-role browser mutation flows and cross-browser/accessibility QA remain pending.
- Expanded integration suite passed 106 assertions, including an API restart. Do not treat unchecked browser/mobile/restart checks as verified completion.
- Optional demo seeding refused to run because the database already contained accounts. This guard preserved newly created user data; no further reset was performed. The integration suite creates and cleans up only its own uniquely named fixtures.
- Deployment and production-account/browser verification have not been performed. The app currently runs through the development services.
- Workspace route pages now render as lightweight markers through the persistent shell, and all nested layouts render their children. Board/list navigation was rechecked successfully. The workspace layout uses the documented instant=false option because the existing token session guard resolves in the browser. Legacy unused feature components remain available for later cleanup.
- Keep this tracker updated at each implementation milestone and after each validation run.
- Final diff review found an extra blank line at EOF in the generated initial migration SQL. It is cosmetic and left unchanged because this exact migration was already applied; review remains open rather than silently changing applied migration history.
