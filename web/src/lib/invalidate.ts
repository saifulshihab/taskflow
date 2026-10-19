import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";

export function invalidateWorkspaceShell(
  queryClient: QueryClient,
  workspaceId: string,
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.workspace(workspaceId),
  });
}

export function invalidateProjectViews(
  queryClient: QueryClient,
  workspaceId: string,
  projectId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.projects(workspaceId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.project(projectId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.projectTasks(projectId),
  });
  void queryClient.invalidateQueries({
    queryKey: ["workspaceTasks", workspaceId],
  });
}

export function invalidateTaskViews(
  queryClient: QueryClient,
  workspaceId: string,
  projectId: string | undefined,
  taskId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.task(taskId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.taskDetail(workspaceId, taskId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.subtasks(taskId),
  });
  void queryClient.invalidateQueries({
    queryKey: ["comments", taskId],
  });
  void queryClient.invalidateQueries({
    queryKey: ["workspaceTasks", workspaceId],
  });
  if (projectId) {
    invalidateProjectViews(queryClient, workspaceId, projectId);
  }
}
