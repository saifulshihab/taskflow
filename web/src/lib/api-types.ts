export const ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const TASK_STATUSES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PROJECT_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
}

export interface CurrentUser extends UserSummary {
  createdAt: string;
}

export interface AuthResponse {
  user: CurrentUser;
  tokens: { accessToken: string; refreshToken: string };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt?: string;
  role: Role;
  _count?: { projects: number; memberships: number };
}

export interface Member {
  id: string;
  role: Role;
  createdAt: string;
  user: UserSummary;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number };
  taskCounts?: Partial<Record<TaskStatus, number>>;
}

export interface Label {
  id: string;
  workspaceId?: string;
  name: string;
  color: string;
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  creatorId: string;
  assigneeId: string | null;
  parentTaskId: string | null;
  dueDate: string | null;
  completedAt: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  assignee: UserSummary | null;
  creator: UserSummary;
  project: { id: string; key: string; name: string; workspaceId: string };
  labels: Label[];
  _count: { subtasks: number; comments: number };
}

export interface Comment {
  id: string;
  taskId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  author: UserSummary;
}

export interface ActivityEvent {
  id: string;
  workspaceId: string;
  actorId: string | null;
  entityType: "workspace" | "membership" | "project" | "task" | "comment";
  entityId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: UserSummary | null;
}
