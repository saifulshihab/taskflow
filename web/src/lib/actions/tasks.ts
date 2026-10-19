import { apiClient } from "@/lib/api-client";
import type { Priority, Task, TaskStatus } from "@/lib/api-types";
import {
  invalidateProjectViews,
  invalidateTaskViews,
  patchTaskInProjectTasksCache,
} from "@/lib/invalidate";
import { projectPath } from "@/lib/project-paths";
import { getQueryClient } from "@/lib/query-client";
import {
  field,
  nullableField,
  optionalField,
  toFormState,
  type FormState,
} from "@/lib/form-state";

export async function createTaskAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");
  let task: Task;

  try {
    task = await apiClient<Task>(`/projects/${projectId}/tasks`, {
      method: "POST",
      body: {
        title: field(formData, "title"),
        description: optionalField(formData, "description"),
        status: (optionalField(formData, "status") ?? "BACKLOG") as TaskStatus,
        priority: (optionalField(formData, "priority") ??
          "MEDIUM") as Priority,
        assigneeId: nullableField(formData, "assigneeId"),
        parentTaskId: nullableField(formData, "parentTaskId"),
        dueDate: nullableField(formData, "dueDate") || undefined,
      },
    });
  } catch (error) {
    return toFormState(error);
  }

  const qc = getQueryClient();
  invalidateProjectViews(qc, workspaceId, projectId);
  if (field(formData, "redirect") === "detail") {
    return { ok: true, redirect: `/w/${workspaceId}/tasks/${task.id}` };
  }
  return { ok: true };
}

export async function updateTaskAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");
  const taskId = field(formData, "taskId");

  try {
    await apiClient(`/tasks/${taskId}`, {
      method: "PATCH",
      body: {
        title: field(formData, "title"),
        description: nullableField(formData, "description"),
        status: field(formData, "status") as TaskStatus,
        priority: field(formData, "priority") as Priority,
        assigneeId: nullableField(formData, "assigneeId"),
        dueDate: nullableField(formData, "dueDate"),
      },
    });
  } catch (error) {
    return toFormState(error);
  }

  invalidateTaskViews(getQueryClient(), workspaceId, projectId, taskId);
  return { ok: true };
}

export async function deleteTaskAction(formData: FormData): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = optionalField(formData, "projectId");
  const taskId = field(formData, "taskId");

  try {
    await apiClient(`/tasks/${taskId}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }

  const qc = getQueryClient();
  if (projectId) {
    invalidateProjectViews(qc, workspaceId, projectId);
  }
  void qc.invalidateQueries({ queryKey: ["workspaceTasks", workspaceId] });

  if (field(formData, "skipRedirect") === "true") {
    return { ok: true };
  }

  return {
    ok: true,
    redirect: projectId
      ? projectPath(workspaceId, projectId, "board")
      : `/w/${workspaceId}/tasks`,
  };
}

export async function setTaskStatusAction(
  taskId: string,
  status: TaskStatus,
  workspaceId: string,
  projectId: string,
): Promise<{ ok: true; task: Task } | { ok: false; error: string }> {
  try {
    const task = await apiClient<Task>(`/tasks/${taskId}/status`, {
      method: "PATCH",
      body: { status },
    });
    const qc = getQueryClient();
    patchTaskInProjectTasksCache(qc, projectId, task);
    invalidateProjectViews(qc, workspaceId, projectId);
    return { ok: true, task };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update status",
    };
  }
}

export async function setTaskAssigneeAction(
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");
  const taskId = field(formData, "taskId");
  const assigneeRaw = field(formData, "assigneeId");

  try {
    await apiClient(`/tasks/${taskId}/assignee`, {
      method: "PATCH",
      body: {
        assigneeId: assigneeRaw === "" ? null : assigneeRaw,
      },
    });
  } catch (error) {
    return toFormState(error);
  }

  invalidateTaskViews(getQueryClient(), workspaceId, projectId, taskId);
  return { ok: true };
}

export async function attachLabelAction(formData: FormData): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");
  const taskId = field(formData, "taskId");

  try {
    await apiClient(`/tasks/${taskId}/labels`, {
      method: "POST",
      body: { labelId: field(formData, "labelId") },
    });
  } catch (error) {
    return toFormState(error);
  }

  invalidateTaskViews(getQueryClient(), workspaceId, projectId, taskId);
  return { ok: true };
}

export async function detachLabelAction(formData: FormData): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");
  const taskId = field(formData, "taskId");
  const labelId = field(formData, "labelId");

  try {
    await apiClient(`/tasks/${taskId}/labels/${labelId}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }

  invalidateTaskViews(getQueryClient(), workspaceId, projectId, taskId);
  return { ok: true };
}
