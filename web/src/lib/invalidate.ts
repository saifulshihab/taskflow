import type { QueryClient } from "@tanstack/react-query";
import type { Paginated, Task } from "./api-types";
import { queryKeys } from "./query-keys";

/** Immediate board/list update; invalidation alone races with useOptimistic reset. */
export function patchTaskInProjectTasksCache(
  queryClient: QueryClient,
  projectId: string,
  updated: Task,
) {
  queryClient.setQueriesData<Paginated<Task>>(
    { queryKey: ["projectTasks", projectId] },
    (current) => {
      if (!current) return current;
      return {
        ...current,
        data: current.data.map((task) =>
          task.id === updated.id ? updated : task,
        ),
      };
    },
  );
}

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
