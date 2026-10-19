type QueryRecord = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

export const queryKeys = {
  me: ["auth", "me"] as const,
  workspaces: (query?: QueryRecord) => ["workspaces", query ?? {}] as const,
  workspace: (workspaceId: string) => ["workspace", workspaceId] as const,
  members: (workspaceId: string, query?: QueryRecord) =>
    ["members", workspaceId, query ?? {}] as const,
  projects: (workspaceId: string, query?: QueryRecord) =>
    ["projects", workspaceId, query ?? {}] as const,
  project: (projectId: string) => ["project", projectId] as const,
  workspaceTasks: (workspaceId: string, query?: QueryRecord) =>
    ["workspaceTasks", workspaceId, query ?? {}] as const,
  projectTasks: (projectId: string, query?: QueryRecord) =>
    ["projectTasks", projectId, query ?? {}] as const,
  task: (taskId: string) => ["task", taskId] as const,
  taskDetail: (workspaceId: string, taskId: string) =>
    ["taskDetail", workspaceId, taskId] as const,
  subtasks: (taskId: string) => ["subtasks", taskId] as const,
  labels: (workspaceId: string) => ["labels", workspaceId] as const,
  comments: (taskId: string, query?: QueryRecord) =>
    ["comments", taskId, query ?? {}] as const,
  activity: (workspaceId: string, query?: QueryRecord) =>
    ["activity", workspaceId, query ?? {}] as const,
};
