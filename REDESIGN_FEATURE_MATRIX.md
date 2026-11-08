# TaskFlow redesign — feature and actor matrix

Status: **Requirements agreed — ready for implementation**  
Source: `TaskFlow Redesign.html`, its screen templates and interaction logic, plus the user's confirmed role names and feature-ID corrections. User corrections take precedence over prototype behavior.  
Date: 2026-11-08

This document describes proposed permissions for the redesigned app. It does not describe what the current backend already supports. Change the cells and notes to correct the requirements before implementation.

## Legend and scope

- ✅ Allowed in the proposed requirements.
- ❌ Not allowed in the proposed requirements.
- ❓ Unresolved: a requirement still needs a user decision.
- ❌ also marks removed or unavailable features; their Notes distinguish these from restricted actions.
- Role names are exactly `WORKSPACE_OWNER`, `ADMIN`, and `MEMBER`. There is no `VIEWER` role in the new model.
- WORKSPACE_OWNER has access to every project in their workspace. ADMIN and MEMBER can access only projects they are assigned to. Unassigned projects must not appear in search, activity, counts, or navigation.
- ADMIN and MEMBER are project-specific roles. There is no workspace-wide Admin role. A user can own a workspace and have a different role in another workspace/project.
- Each workspace has exactly one WORKSPACE_OWNER. Only that owner may transfer ownership to an active workspace user. Transfer explicitly sets the former owner's project assignments and roles; it does not add a second owner.
- There is no self-service workspace leaving. Owners may delete their workspace; admins/members cannot leave it themselves.
- Every user can create a workspace and becomes WORKSPACE_OWNER in that new workspace; the app switches to it immediately.
- Workspace people/members and workspace settings pages are owner-only. Project team pages remain available to assigned project users.
- Archived projects cannot be edited by any actor. Restore requires the workspace owner.
- There is no invitation feature and no default task assignee feature.
- Users register their own accounts. Owners add existing accounts to a workspace by email; admins add existing workspace users to projects.
- Retain authored comments/history when a user is removed or deactivated, clear affected task assignments, and revoke access. Deactivated users retain project memberships and seats for reactivation.
- Project admins may manage other admins, but cannot remove or demote themselves. A project may have no admin because the workspace owner retains control.
- Saved views are personal to their creator and project. Subtasks remain full nested tasks with independent fields. Keep Active / Paused / Completed project statuses.
- Save personal preferences per account and board settings per project. Appearance controls are available on desktop and mobile.
- Existing local data will be discarded with a full local database reset during implementation. No existing-data migration is required. This decision applies only to the local database; no database reset has been executed during requirements work.
- Personal settings apply to the signed-in actor's own account.
- No email-sending features are included. Remove email notification preferences, reminders, digests, and email-based password reset from the redesign. Email remains an account identifier and can be used to look up existing users.
- Supported deletions offer Undo for six seconds. Once that window expires, deletion is permanent through the application's recovery flow. Preserve required authored history under R4/R11.
- A check mark identifies permission, not implementation readiness. Persistence, authentication, and recovery still require implementation.

## Workspace management

| ID | Feature | WORKSPACE_OWNER | ADMIN | MEMBER | Notes / review decision |
| --- | --- | :---: | :---: | :---: | --- |
| W01 | View and switch between accessible workspaces | ✅ | ✅ | ✅ | Only workspaces the actor belongs to. |
| W02 | Create a workspace | ✅ | ✅ | ✅ | Any user can create a workspace. Immediately switch to the new workspace, where its creator is WORKSPACE_OWNER; roles in other workspaces/projects are unchanged. |
| W03 | View workspace settings | ✅ | ❌ | ❌ | Workspace settings are owner-only. |
| W04 | Rename workspace | ✅ | ❌ | ❌ | Includes its sidebar display name. |
| W05 | Delete workspace | ✅ | ❌ | ❌ | Prototype requires typing its name. |
| W06 | Delete the actor's only workspace | ✅ | ❌ | ❌ | Allowed for its owner even when no other workspace exists. |
| W07 | Transfer workspace ownership | ✅ | ❌ | ❌ | Transfer to an active workspace user and explicitly select the former owner's project assignments and roles. Exactly one owner must remain. |
| W08 | Add another workspace owner | ❌ | ❌ | ❌ | A workspace can have only one owner. Ownership transfer replaces that owner under W07. |
| W09 | Leave a workspace | ❌ | ❌ | ❌ | No self-service leaving for any role. Owner may delete the workspace under W05/W06; admins/members must be removed by the owner under U05/U06. |

## Workspace users

| ID | Feature | WORKSPACE_OWNER | ADMIN | MEMBER | Notes / review decision |
| --- | --- | :---: | :---: | :---: | --- |
| U01 | View workspace people / members page | ✅ | ❌ | ❌ | Workspace directory is available only to the workspace owner. |
| U02 | Filter workspace people by project | ✅ | ❌ | ❌ | Available only on the owner-only workspace people page. |
| U03 | Add an existing account to the workspace by email | ✅ | ❌ | ❌ | Users register themselves first. Link the existing account; do not edit its profile or automatically add it to a project. |
| U04 | Edit another user's workspace directory details or personal settings | ❌ | ❌ | ❌ | No actor may edit another user's personal details or settings. Membership lifecycle actions remain available under U05/U06. |
| U05 | Remove a user from the workspace and all its projects | ✅ | ❌ | ❌ | Revoke access and clear affected task assignments; retain authored comments/history. Remove memberships, not the global account. Support recoverable membership removal under R7. |
| U06 | Deactivate, reactivate, or remove a workspace member | ✅ | ❌ | ❌ | Deactivation revokes access and clears affected task assignments but retains project memberships and seats for reactivation. Preserve authored comments/history. Removal follows U05. |
| U07 | Send or resend an onboarding invitation | ❌ | ❌ | ❌ | Out of scope: there is no invitation feature. |
| U08 | Grant workspace-wide Admin permissions | ❌ | ❌ | ❌ | Out of scope: ADMIN permissions are project-specific, not workspace-wide. |

## Project access and membership

| ID | Feature | WORKSPACE_OWNER | ADMIN | MEMBER | Notes / review decision |
| --- | --- | :---: | :---: | :---: | --- |
| P01 | Create a project | ✅ | ❌ | ❌ | Owner-only control. |
| P02 | View a project without being assigned to it | ✅ | ❌ | ❌ | Owner can access all workspace projects. Admins and members cannot see projects they are not assigned to, regardless of prototype visibility copy. |
| P03 | View a private project without being added | ✅ | ❌ | ❌ | Same assignment requirement as P02; owner always retains access. |
| P04 | View a project after being assigned to it | ✅ | ✅ | ✅ | ADMIN or MEMBER permissions apply to that assigned project. |
| P05 | View project team and search its members | ✅ | ✅ | ✅ | Only accessible projects. |
| P06 | Add an existing workspace user to a project | ✅ | ✅ | ❌ | Requires an available project seat and an active workspace user. |
| P07 | Add someone who is not already a workspace user | ❌ | ❌ | ❌ | Owner must add them to the workspace first through U03. |
| P08 | Assign project Member role | ✅ | ✅ | ❌ | Owner or an Admin of that project can assign its Member role. |
| P09 | Assign project Admin role | ✅ | ✅ | ❌ | Prototype allows project admins to promote others. |
| P10 | Demote a project Admin to Member | ✅ | ✅ | ❌ | Admins may demote other admins, but not themselves. A project may have no admin; the workspace owner retains control. |
| P11 | Remove a person from a project | ✅ | ✅ | ❌ | Admins may remove other admins/members, but not themselves. Clear affected task assignments, preserve authored comments/history, and leave other projects unaffected. |
| P12 | Remove or demote the workspace owner through project controls | ❌ | ❌ | ❌ | Owner is displayed separately from project members. |
| P13 | Change project access between workspace-visible and private | ❌ | ❌ | ❌ | Removed. Every project requires explicit assignment for admins/members; owner access is inherent. |
| P14 | Join or leave a project without an admin/owner action | ❌ | ❌ | ❌ | No self-service join/leave. Project admins or the workspace owner must add/remove users; owner access is inherent. |

## Project settings and lifecycle

| ID | Feature | WORKSPACE_OWNER | ADMIN | MEMBER | Notes / review decision |
| --- | --- | :---: | :---: | :---: | --- |
| S01 | Open project settings | ✅ | ✅ | ❌ | Admins may open settings for their assigned projects. Individual action permissions below still apply. |
| S02 | Rename project | ✅ | ✅ | ❌ | Owner or assigned project Admin. |
| S03 | Change project key and displayed task ID prefixes | ✅ | ✅ | ❌ | Owner or assigned project Admin. Prototype key uses 1-5 uppercase letters/digits, starting with a letter. |
| S04 | Edit project description | ✅ | ✅ | ❌ | Owner or assigned project Admin. |
| S05 | Change project color | ✅ | ✅ | ❌ | Owner or assigned project Admin. |
| S06 | Set default status for new tasks | ✅ | ✅ | ❌ | Adding inside a board column uses that column's status. |
| S07 | Set default priority for new tasks | ✅ | ✅ | ❌ | Owner or assigned project Admin. |
| S08 | Set default assignee for new tasks | ❌ | ❌ | ❌ | Removed from requirements. Manual task assignment remains available through T10-T12. |
| S09 | Show or hide Cancelled board column | ✅ | ✅ | ❌ | Cancelled tasks remain in list and search. |
| S10 | Configure In progress work-in-progress limit | ✅ | ✅ | ❌ | Warning only under the existing baseline; not a hard movement limit. |
| S11 | Configure visible card fields | ✅ | ✅ | ❌ | Assignee, due date, labels, subtask progress, comment count. |
| S12 | Archive project | ✅ | ❌ | ❌ | Only the workspace owner may archive a project. |
| S13 | Restore archived project | ✅ | ❌ | ❌ | Only the workspace owner may restore an archived project. |
| S14 | Delete project and its tasks | ✅ | ❌ | ❌ | Only the workspace owner may delete a project; prototype requires typing its key. |
| S15 | Edit tasks inside an archived project | ❌ | ❌ | ❌ | Not available to anyone while archived. Owner must restore the project before tasks can be edited. |

## Project seats

| ID | Feature | WORKSPACE_OWNER | ADMIN | MEMBER | Notes / review decision |
| --- | --- | :---: | :---: | :---: | --- |
| Q01 | View project seat usage and limit | ✅ | ✅ | ✅ | Read-only for Members/Admins; only the owner can change the limit under Q03. |
| Q02 | View seat allocation across all workspace projects | ✅ | ❌ | ❌ | Workspace settings. |
| Q03 | Increase or decrease project seat limit | ✅ | ❌ | ❌ | Prototype range is 1–100; cannot reduce below occupied seats. |
| Q04 | Occupy a project seat when added to its team | ❌ | ✅ | ✅ | Owner is excluded; this row describes accounting, not an action permission. |
| Q05 | Add a person when project seats are full | ❌ | ❌ | ❌ | Owner can increase the limit first. |
| Q06 | Access or edit a project without occupying a seat | ✅ | ❌ | ❌ | Owner has inherent access without consuming a seat. Admins/members need project assignment and consume a seat; no workspace-visible access exception. |

## Tasks and subtasks

All allowed task actions below apply to accessible, active projects. Admins/members require explicit project assignment; workspace owners have inherent access. Task edits are not restricted to the task creator or assignee. A parent task may be marked Done even with incomplete subtasks.

| ID | Feature | WORKSPACE_OWNER | ADMIN | MEMBER | Notes / review decision |
| --- | --- | :---: | :---: | :---: | --- |
| T01 | View tasks in board and list views | ✅ | ✅ | ✅ | Includes task IDs, status, priority, assignee, and due date. |
| T02 | Open task detail side panel | ✅ | ✅ | ✅ | Expand to full width and return to side panel. |
| T03 | Add task through New task form | ✅ | ✅ | ✅ | Supports creating another task without closing the form. |
| T04 | Add task inline in a board column or list | ✅ | ✅ | ✅ | Column creation uses the selected column's status. |
| T05 | Edit task title | ✅ | ✅ | ✅ | Includes tasks created by other users under the proposed baseline. |
| T06 | Edit task description | ✅ | ✅ | ✅ | Autosave behavior shown. |
| T07 | Change task status | ✅ | ✅ | ✅ | Backlog, To do, In progress, In review, Done, Cancelled. |
| T08 | Move task between board columns by drag and drop | ✅ | ✅ | ✅ | Same permission as changing status. |
| T09 | Change task priority | ✅ | ✅ | ✅ | Urgent, High, Medium, Low. |
| T10 | Assign or reassign task to an eligible project user | ✅ | ✅ | ✅ | Picker includes active assigned project users and the workspace owner; excludes deactivated and unassigned users. |
| T11 | Assign task to self | ✅ | ✅ | ✅ | Must use the actual signed-in actor, not demo identity. |
| T12 | Clear task assignee | ✅ | ✅ | ✅ | Unassigned is allowed. |
| T13 | Set, change, or clear due date | ✅ | ✅ | ✅ | Overdue tasks receive visual emphasis. |
| T14 | Duplicate task | ✅ | ✅ | ✅ | New task ID; demo copies fields/subtasks and omits comments. |
| T15 | Delete task | ✅ | ✅ | ✅ | Recoverable deletion includes subtasks and comments; Undo follows R7. |
| T16 | Copy task reference | ✅ | ✅ | ✅ | Demo copies task key and title; a shareable URL is not specified. |
| T17 | Add a subtask | ✅ | ✅ | ✅ | Keep full nested Task records with independent fields. |
| T18 | Complete or reopen subtask | ✅ | ✅ | ✅ | Subtask progress appears on cards. |
| T19 | Rename or delete a subtask | ✅ | ✅ | ✅ | All three roles may do this within accessible, active projects. |
| T20 | Mark parent task Done with unfinished subtasks | ✅ | ✅ | ✅ | Allowed. Incomplete subtasks do not block parent completion. |
| T21 | Move task to a different project | ❌ | ❌ | ❌ | Out of scope for every role. |

## Labels

| ID | Feature | WORKSPACE_OWNER | ADMIN | MEMBER | Notes / review decision |
| --- | --- | :---: | :---: | :---: | --- |
| L01 | View project labels and filter tasks by label | ✅ | ✅ | ✅ | Labels belong to one project. |
| L02 | Attach or detach an existing label on a task | ✅ | ✅ | ✅ | Only labels from the task's project. |
| L03 | Create project label from task detail picker | ✅ | ✅ | ✅ | Prototype exposes this to all task editors. |
| L04 | Create project label through project settings | ✅ | ✅ | ❌ | Owner or assigned project Admin. Members can create labels through the task picker under L03. |
| L05 | Delete project label through project settings | ✅ | ✅ | ❌ | Owner or assigned project Admin; removes the label from affected tasks too. |
| L06 | Rename label or recolor an existing label | ✅ | ✅ | ❌ | Owner or assigned project Admin. |
| L07 | Apply a label from a different project | ❌ | ❌ | ❌ | Project isolation is explicit. |

## Comments and activity

| ID | Feature | WORKSPACE_OWNER | ADMIN | MEMBER | Notes / review decision |
| --- | --- | :---: | :---: | :---: | --- |
| A01 | Read task comments and task history | ✅ | ✅ | ✅ | Accessible tasks only. |
| A02 | Add task comment | ✅ | ✅ | ✅ | Uses signed-in actor identity. |
| A03 | Edit own comment | ✅ | ✅ | ✅ | Own comments only, within accessible, active projects. |
| A04 | Delete own comment | ✅ | ✅ | ✅ | Own comments only, within accessible, active projects. |
| A05 | Edit or delete someone else's comment | ❌ | ❌ | ❌ | Not allowed for any role, including the workspace owner. |
| A06 | View project activity | ✅ | ✅ | ✅ | Only accessible projects. |
| A07 | View workspace activity | ✅ | ✅ | ✅ | Owner sees workspace-wide activity. Admins/members see only activity from their assigned projects. |
| A08 | Filter activity by project and event type | ✅ | ❌ | ❌ | Only the workspace owner has these activity filtering controls. Task list filters under V03 remain available to all roles. |
| A09 | Open a task from an activity entry | ✅ | ✅ | ✅ | Subject to current task access and existence. |
| A10 | Manually edit or delete audit/activity records | ❌ | ❌ | ❌ | Not allowed for any role. |

## Search, saved views, and navigation

| ID | Feature | WORKSPACE_OWNER | ADMIN | MEMBER | Notes / review decision |
| --- | --- | :---: | :---: | :---: | --- |
| V01 | Search tasks in the active project | ✅ | ✅ | ✅ | Matches title, description, and task key. |
| V02 | Use global search / jump to tasks, projects, and pages | ✅ | ✅ | ✅ | Results and navigation actions must respect permissions. |
| V03 | Filter by status, priority, assignee, and labels | ✅ | ✅ | ✅ | Includes assigned-to-me and unassigned. |
| V04 | Sort by priority, newest, due date, or title | ✅ | ✅ | ✅ | Applies to board/list presentation. |
| V05 | Save a named filtered view | ✅ | ✅ | ✅ | Personal views only, persisted per user and project. |
| V06 | Apply or reset a saved view | ✅ | ✅ | ✅ | Only the actor's own saved views for an accessible project. |
| V07 | Delete own saved view | ✅ | ✅ | ✅ | Creator-only; no sharing or changes to another user's views. |
| V08 | Modify or delete another user's saved view | ❌ | ❌ | ❌ | Not allowed for any role. Saved views must track their creator. |
| V09 | Show or hide subtasks in list view | ✅ | ✅ | ✅ | Presentation control. |
| V10 | Collapse or expand Cancelled board column | ✅ | ✅ | ✅ | When the column is enabled. |
| V11 | Navigate paginated task list | ✅ | ✅ | ✅ | Prototype includes Previous, Next, and page selection. |
| V12 | Use keyboard shortcuts and Escape to close overlays | ✅ | ✅ | ✅ | Shortcuts must not bypass action permissions. |

## Profile, account, and notifications

| ID | Feature | WORKSPACE_OWNER | ADMIN | MEMBER | Notes / review decision |
| --- | --- | :---: | :---: | :---: | --- |
| C01 | View own profile and account settings | ✅ | ✅ | ✅ | All three roles. |
| C02 | Edit own job title, bio, and timezone | ✅ | ✅ | ✅ | Save and discard controls. |
| C03 | View own task and comment statistics | ✅ | ✅ | ✅ | Counts must reflect actual actor and allowed data; demo contains owner-specific counts. |
| C04 | Set assignment notification preference | ❌ | ❌ | ❌ | Removed: no email notifications or inactive email preference controls. |
| C05 | Set comment notification preference | ❌ | ❌ | ❌ | Removed: no comment notification emails or related preference controls. |
| C06 | Set due-date reminder preference | ❌ | ❌ | ❌ | Removed: no reminder emails or related preference controls. |
| C07 | Set weekly digest preference | ❌ | ❌ | ❌ | Removed: no digest emails or related preference controls. |
| C08 | Choose default project view: Board, List, or Activity | ✅ | ✅ | ✅ | Personal preference. |
| C09 | Change own password | ✅ | ✅ | ✅ | Authenticated password change without email sending. Email-based password reset is excluded. |
| C10 | Sign out | ✅ | ✅ | ✅ | Demo sign-out is simulated; production must invalidate the session appropriately. |
| C11 | Edit own name, email, or avatar | ✅ | ✅ | ✅ | Own account only. Other users cannot change these details through workspace management. |
| C12 | Delete own account | ✅ | ✅ | ✅ | Transfer ownership or delete all owned workspaces first. Preserve surviving authored comments/history through an appropriate deleted-author representation. |

## Mobile and recovery

| ID | Feature | WORKSPACE_OWNER | ADMIN | MEMBER | Notes / review decision |
| --- | --- | :---: | :---: | :---: | --- |
| M01 | Use mobile Board, My tasks, Activity, and More navigation | ✅ | ✅ | ✅ | Prototype includes a separate mobile screen. |
| M02 | Filter mobile tasks to assigned-to-me | ✅ | ✅ | ✅ | Actual signed-in actor identity. |
| M03 | Add/edit/move/delete tasks using mobile sheets | ✅ | ✅ | ✅ | Same permissions as desktop task actions. |
| M04 | Change personal appearance/theme on mobile | ✅ | ✅ | ✅ | Also available on desktop; persisted per account. |
| M05 | Create or archive projects from mobile | ✅ | ❌ | ❌ | Mobile supports these actions with desktop-equivalent permissions: P01/S12 allow only the workspace owner. All users can create a workspace on mobile under W02. |
| M06 | Undo own supported destructive action | ✅ | ✅ | ✅ | Six-second Undo for tasks, labels, projects, and workspace-member removal. After expiry, deletion is permanent through the application. Current permissions still apply. |

## Agreed decisions and delivery details

| Ref | Decision | Agreed requirement | Status |
| --- | --- | --- | --- |
| R1 | Role scope | Workspace ownership plus project-specific ADMIN/MEMBER roles. Any user may create and own a workspace. | Agreed. |
| R2 | Admin settings | Admins can edit S02-S07 and S09-S11 and manage labels. Archive, restore, delete, and seat-limit changes are owner-only. Default assignee is removed. | Agreed. |
| R3 | Project visibility | Remove workspace-visible/private settings. Admins/members require explicit project assignment; owner has inherent access. | Agreed. |
| R4 | Membership lifecycle and history | Revoke access and clear affected assignments on removal/deactivation. Retain authored comments/history. Deactivation retains project memberships and seats for reactivation. | Agreed. |
| R5 | Ownership and admin safeguards | Transfer ownership to an active workspace user; explicitly choose former owner's project assignments/roles. Exactly one owner. Admins can manage other admins, but cannot remove/demote themselves. Projects may have no admin. No self-service workspace/project leaving. | Agreed. |
| R6 | Subtasks | Keep full nested tasks and independent fields. All roles may rename/delete subtasks and complete parents with unfinished subtasks. | Agreed. |
| R7 | Undo | Offer Undo for six seconds for deletion of tasks, labels, projects, and workspace-member removal. After expiry, deletion is permanent through the application's recovery flow. Enforce current permissions on recovery, preserve required history, and preserve concurrent edits rather than restoring global snapshots. | Agreed: six seconds, with no longer recovery window. |
| R8 | Saved views | Personal only; persisted per creator and project. No sharing or changes to another user's views. | Agreed. |
| R9 | Account provisioning | Users register themselves. Owners add existing accounts by email; project admins add existing workspace users to projects. No invitations. | Agreed. |
| R10 | Existing local data | Discard the entire local database and initialize the redesigned schema with fresh data. No existing-data migration, role mapping, label conversion, or legacy membership backfill is required. Schema creation/versioning is still required for fresh installs. | Agreed. Local reset will occur during implementation against a verified local target; not executed during requirements work. No remote/production reset is authorized by this decision. |
| R11 | Existing capabilities and account deletion | Retain Active / Paused / Completed project statuses. Users may edit own comments and owner/admin may edit labels. Before deleting an account, transfer or delete its owned workspaces; retain surviving authored history. | Agreed. |
| R12 | Preferences and notifications | Persist personal preferences per account and board settings per project. Appearance controls on desktop and mobile. Exclude all email sending, including notification/reminder/digest emails and email-based password reset; remove the associated email preference controls. | Agreed: no email-sending features. |

## Readiness

All decisions raised during requirements review are resolved. Undo lasts six seconds; email-sending features are excluded. The matrix is ready to guide implementation.

## Review and implementation notes

Keep existing feature IDs stable when making further corrections. User decisions take precedence over prototype controls and copy. This document records requirements only; application implementation and the local database reset have not started.
