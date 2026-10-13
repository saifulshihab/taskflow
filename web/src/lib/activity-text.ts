import type { ActivityEvent } from "./api-types";
import { ROLE_LABELS, TASK_STATUS_LABELS } from "./format";

const actorName = (event: ActivityEvent) =>
  event.actor?.name ?? "Someone";

export function describeActivity(event: ActivityEvent): string {
  const meta = event.metadata ?? {};
  const who = actorName(event);

  switch (event.action) {
    case "workspace.created":
      return `${who} created workspace ${String(meta.name ?? "")}`;
    case "workspace.updated":
      return `${who} updated workspace settings`;
    case "membership.added":
      return `${who} added a member`;
    case "membership.role_changed":
      return `${who} changed a member role to ${ROLE_LABELS[String(meta.to) as keyof typeof ROLE_LABELS] ?? String(meta.to)}`;
    case "membership.removed":
      return `${who} removed a member`;
    case "project.created":
      return `${who} created project ${String(meta.name ?? meta.key ?? "")}`;
    case "project.updated":
      return `${who} updated project ${String(meta.name ?? "")}`;
    case "project.archived":
      return `${who} archived a project`;
    case "project.unarchived":
      return `${who} restored a project`;
    case "task.created":
      return `${who} created task ${String(meta.title ?? "")}`;
    case "task.updated":
      return `${who} updated task ${String(meta.title ?? "")}`;
    case "task.status_changed":
      return `${who} moved a task from ${TASK_STATUS_LABELS[String(meta.from) as keyof typeof TASK_STATUS_LABELS] ?? String(meta.from)} to ${TASK_STATUS_LABELS[String(meta.to) as keyof typeof TASK_STATUS_LABELS] ?? String(meta.to)}`;
    case "task.assigned":
      return `${who} assigned a task`;
    case "task.unassigned":
      return `${who} unassigned a task`;
    case "task.deleted":
      return `${who} deleted a task`;
    case "comment.created":
      return `${who} commented on a task`;
    case "comment.updated":
      return `${who} edited a comment`;
    case "comment.deleted":
      return `${who} deleted a comment`;
    default:
      return `${who} ${event.action.replaceAll(".", " ")}`;
  }
}

export function activityEntityLabel(entityType: ActivityEvent["entityType"]) {
  switch (entityType) {
    case "workspace":
      return "Workspace";
    case "membership":
      return "Member";
    case "project":
      return "Project";
    case "task":
      return "Task";
    case "comment":
      return "Comment";
    default:
      return entityType;
  }
}
