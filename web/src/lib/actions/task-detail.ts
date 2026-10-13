"use server";

import type {
  Comment,
  CurrentUser,
  Label,
  Member,
  Task,
  Workspace,
} from "@/lib/api-types";
import {
  getMe,
  getTask,
  getWorkspace,
  listComments,
  listLabels,
  listMembers,
  listSubtasks,
} from "@/lib/data";
import { can } from "@/lib/rbac";

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

export async function fetchTaskDetailContext(
  workspaceId: string,
  taskId: string,
): Promise<TaskDetailContext | { error: string }> {
  try {
    const task = await getTask(taskId);
    if (task.project.workspaceId !== workspaceId) {
      return { error: "Task not found" };
    }

    const [workspace, members, labels, subtasks, comments, me] =
      await Promise.all([
        getWorkspace(workspaceId),
        listMembers(workspaceId),
        listLabels(workspaceId),
        listSubtasks(taskId),
        listComments(taskId),
        getMe(),
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
  } catch {
    return { error: "Task not found" };
  }
}
