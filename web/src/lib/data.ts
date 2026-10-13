import "server-only";
import { api } from "./api";
import type {
  ActivityEvent,
  Comment,
  CurrentUser,
  Label,
  Member,
  Paginated,
  Project,
  Task,
  Workspace,
} from "./api-types";

type Query = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

export const getMe = () => api<CurrentUser>("/auth/me");

export const listWorkspaces = (query?: Query) =>
  api<Paginated<Workspace>>("/workspaces", { query });

export const getWorkspace = (workspaceId: string) =>
  api<Workspace>(`/workspaces/${workspaceId}`);

export const listMembers = (workspaceId: string, query?: Query) =>
  api<Paginated<Member>>(`/workspaces/${workspaceId}/members`, {
    query: { pageSize: 100, ...query },
  });

export const listProjects = (workspaceId: string, query?: Query) =>
  api<Paginated<Project>>(`/workspaces/${workspaceId}/projects`, { query });

export const getProject = (projectId: string) =>
  api<Project>(`/projects/${projectId}`);

export const listWorkspaceTasks = (workspaceId: string, query?: Query) =>
  api<Paginated<Task>>(`/workspaces/${workspaceId}/tasks`, { query });

export const listProjectTasks = (projectId: string, query?: Query) =>
  api<Paginated<Task>>(`/projects/${projectId}/tasks`, { query });

export const getTask = (taskId: string) => api<Task>(`/tasks/${taskId}`);

export const listSubtasks = (taskId: string) =>
  api<Task[]>(`/tasks/${taskId}/subtasks`);

export const listLabels = (workspaceId: string) =>
  api<Label[]>(`/workspaces/${workspaceId}/labels`);

export const listComments = (taskId: string, query?: Query) =>
  api<Paginated<Comment>>(`/tasks/${taskId}/comments`, {
    query: { pageSize: 100, ...query },
  });

export const listActivity = (workspaceId: string, query?: Query) =>
  api<Paginated<ActivityEvent>>(`/workspaces/${workspaceId}/activity`, {
    query,
  });
