"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";
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
import { can } from "./rbac";
import { queryKeys } from "./query-keys";

type Query = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => apiClient<CurrentUser>("/auth/me"),
  });
}

export function useWorkspaces(query?: Query) {
  return useQuery({
    queryKey: queryKeys.workspaces(query),
    queryFn: () =>
      apiClient<Paginated<Workspace>>("/workspaces", { query }),
  });
}

export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.workspace(workspaceId),
    queryFn: () => apiClient<Workspace>(`/workspaces/${workspaceId}`),
    enabled: Boolean(workspaceId),
  });
}

export function useMembers(workspaceId: string, query?: Query) {
  return useQuery({
    queryKey: queryKeys.members(workspaceId, query),
    queryFn: () =>
      apiClient<Paginated<Member>>(`/workspaces/${workspaceId}/members`, {
        query: { pageSize: 100, ...query },
      }),
    enabled: Boolean(workspaceId),
  });
}

export function useProjects(workspaceId: string, query?: Query) {
  return useQuery({
    queryKey: queryKeys.projects(workspaceId, query),
    queryFn: () =>
      apiClient<Paginated<Project>>(`/workspaces/${workspaceId}/projects`, {
        query,
      }),
    enabled: Boolean(workspaceId),
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => apiClient<Project>(`/projects/${projectId}`),
    enabled: Boolean(projectId),
  });
}

export function useWorkspaceTasks(workspaceId: string, query?: Query) {
  return useQuery({
    queryKey: queryKeys.workspaceTasks(workspaceId, query),
    queryFn: () =>
      apiClient<Paginated<Task>>(`/workspaces/${workspaceId}/tasks`, {
        query,
      }),
    enabled: Boolean(workspaceId),
  });
}

export function useProjectTasks(projectId: string, query?: Query) {
  return useQuery({
    queryKey: queryKeys.projectTasks(projectId, query),
    queryFn: () =>
      apiClient<Paginated<Task>>(`/projects/${projectId}/tasks`, { query }),
    enabled: Boolean(projectId),
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: queryKeys.task(taskId),
    queryFn: () => apiClient<Task>(`/tasks/${taskId}`),
    enabled: Boolean(taskId),
  });
}

export function useLabels(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.labels(workspaceId),
    queryFn: () => apiClient<Label[]>(`/workspaces/${workspaceId}/labels`),
    enabled: Boolean(workspaceId),
  });
}

export function useActivity(workspaceId: string, query?: Query) {
  return useQuery({
    queryKey: queryKeys.activity(workspaceId, query),
    queryFn: () =>
      apiClient<Paginated<ActivityEvent>>(
        `/workspaces/${workspaceId}/activity`,
        { query },
      ),
    enabled: Boolean(workspaceId),
  });
}

export type TaskDetailContext = {
  task: Task;
  workspace: Workspace;
  members: Member[];
  labels: Label[];
  subtasks: Task[];
  comments: Comment[];
  me: CurrentUser;
  canEdit: boolean;
  canModerateComments: boolean;
};

export function useTaskDetailContext(workspaceId: string, taskId: string | null) {
  return useQuery({
    queryKey: queryKeys.taskDetail(workspaceId, taskId ?? ""),
    queryFn: async (): Promise<TaskDetailContext> => {
      const task = await apiClient<Task>(`/tasks/${taskId}`);
      if (task.project.workspaceId !== workspaceId) {
        throw new Error("Task not found");
      }

      const [workspace, members, labels, subtasks, comments, me] =
        await Promise.all([
          apiClient<Workspace>(`/workspaces/${workspaceId}`),
          apiClient<Paginated<Member>>(`/workspaces/${workspaceId}/members`, {
            query: { pageSize: 100 },
          }),
          apiClient<Label[]>(`/workspaces/${workspaceId}/labels`),
          apiClient<Task[]>(`/tasks/${taskId}/subtasks`),
          apiClient<Paginated<Comment>>(`/tasks/${taskId}/comments`, {
            query: { pageSize: 100 },
          }),
          apiClient<CurrentUser>("/auth/me"),
        ]);

      return {
        task,
        workspace,
        members: members.data,
        labels,
        subtasks,
        comments: comments.data,
        me,
        canEdit: can(workspace.role, "MEMBER"),
        canModerateComments: can(workspace.role, "ADMIN"),
      };
    },
    enabled: Boolean(workspaceId && taskId),
  });
}
