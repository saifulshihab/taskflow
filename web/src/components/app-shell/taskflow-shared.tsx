"use client";
import {
  AvatarFallback,
  AvatarImage,
  Avatar as UiAvatar,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label as UiLabel } from "@/components/ui/label";
import type { RequestOptions } from "@/lib/api-client";
import type {
  CurrentUser,
  Priority,
  Project,
  Role,
  Task,
  TaskStatus,
} from "@/lib/api-types";
import type { ReactNode } from "react";
export type Person = {
  id: string;
  userId: string;
  role: Role;
  active: boolean;
  user: CurrentUser;
  projects?: { project: Project; role: Role }[];
};
export type ProjectData = Project & {
  role: Role;
  color: string;
  seats: number;
  seatsUsed: number;
  defaultStatus: TaskStatus;
  defaultPriority: Priority;
  showCancelled: boolean;
  wipLimit: number;
  cardFields: Record<string, boolean>;
};
export type Me = CurrentUser & {
  avatar: string | null;
  jobTitle: string;
  bio: string;
  timezone: string;
  theme: string;
  startPage: string;
};
export type WorkTask = Task & { key: string; number: number };
export type SavedView = {
  id: string;
  name: string;
  filters: Record<string, string>;
};
export type Recovery = { recoveryId?: string; expiresAt?: string };
export type Filters = {
  search: string;
  status: string;
  priority: string;
  assigneeId: string;
  labelId: string;
  sort: string;
};
export const cleanFilters: Filters = {
  search: "",
  status: "",
  priority: "",
  assigneeId: "",
  labelId: "",
  sort: "-priority",
};
export const statuses: { id: TaskStatus; name: string; color: string }[] = [
  { id: "BACKLOG", name: "Backlog", color: "#78716c" },
  { id: "TODO", name: "To do", color: "#1d4ed8" },
  { id: "IN_PROGRESS", name: "In progress", color: "#b45309" },
  { id: "IN_REVIEW", name: "In review", color: "#7c3aed" },
  { id: "DONE", name: "Done", color: "#15803d" },
  { id: "CANCELLED", name: "Cancelled", color: "#78716c" },
];
export const priorities: Priority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];
export const labelColors = [
  "#0E7490",
  "#7C3AED",
  "#15803D",
  "#B45309",
  "#BE185D",
  "#57534E",
];
export const human = (s: string) =>
  s
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
export const initials = (s: string) =>
  s
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("");
export const formatDate = (s: string | null) =>
  s
    ? new Date(s).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "—";
export function Avatar({
  user,
}: {
  user: { name: string; avatar?: string | null };
}) {
  return (
    <UiAvatar size="sm" title={user.name}>
      {user.avatar && <AvatarImage src={user.avatar} alt="" />}
      <AvatarFallback>{initials(user.name)}</AvatarFallback>
    </UiAvatar>
  );
}
export function Status({ status }: { status: TaskStatus }) {
  const s = statuses.find((x) => x.id === status)!;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium [&>i]:inline-block [&>i]:size-2 [&>i]:rounded-full">
      <i style={{ background: s.color }} />
      {s.name}
    </span>
  );
}
export function PriorityChip({ priority }: { priority: Priority }) {
  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] text-muted-foreground   ${["URGENT", "HIGH"].includes(priority) ? "border-destructive/20 bg-destructive/5 text-destructive" : ""}`}
    >
      <span aria-hidden>▂▄▆</span> {human(priority)}
    </Badge>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <UiLabel className="flex min-w-0 flex-col items-stretch gap-2 text-left text-sm [&>span]:font-medium">
      <span>{label}</span>
      {children}
    </UiLabel>
  );
}

export type Mutate = <T = unknown>(
  url: string,
  method: RequestOptions["method"],
  body?: unknown,
  message?: string,
) => Promise<T | undefined>;
