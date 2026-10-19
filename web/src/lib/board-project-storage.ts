const key = (workspaceId: string) => `tf_board_project_${workspaceId}`;

export function getStoredBoardProjectId(workspaceId: string) {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key(workspaceId));
}

export function setStoredBoardProjectId(workspaceId: string, projectId: string) {
  localStorage.setItem(key(workspaceId), projectId);
}
