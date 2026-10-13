import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import type { Priority, ProjectStatus, Role, TaskStatus } from "./api-types";

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const formatDate = (value: string | Date) =>
  format(new Date(value), "MMM d, yyyy");

export const formatDateTime = (value: string | Date) =>
  format(new Date(value), "MMM d, yyyy 'at' HH:mm");

export const fromNow = (value: string | Date) =>
  formatDistanceToNow(new Date(value), { addSuffix: true });

/** `<input type="date">` wants a plain yyyy-MM-dd, never an ISO timestamp. */
export const toDateInput = (value: string | null | undefined) =>
  value ? format(new Date(value), "yyyy-MM-dd") : "";

export const isOverdue = (dueDate: string | null, status: TaskStatus) =>
  Boolean(
    dueDate &&
      status !== "DONE" &&
      status !== "CANCELLED" &&
      isPast(new Date(dueDate)) &&
      !isToday(new Date(dueDate)),
  );

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export const PRIORITY_CLASSES: Record<Priority, string> = {
  LOW: "border-transparent bg-muted text-muted-foreground",
  MEDIUM: "border-transparent bg-sky-500/10 text-sky-700 dark:text-sky-300",
  HIGH: "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-300",
  URGENT: "border-transparent bg-red-500/10 text-red-700 dark:text-red-300",
};

export const TASK_STATUS_CLASSES: Record<TaskStatus, string> = {
  BACKLOG: "bg-muted-foreground/40",
  TODO: "bg-sky-500",
  IN_PROGRESS: "bg-amber-500",
  DONE: "bg-emerald-500",
  CANCELLED: "bg-muted-foreground/40",
};
