"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import type { Priority, Task, TaskStatus } from "@/lib/api-types";
import {
  field,
  nullableField,
  optionalField,
  toFormState,
  type FormState,
} from "@/lib/form-state";

function revalidateTaskPaths(workspaceId: string, projectId?: string) {
  revalidatePath(`/w/${workspaceId}/tasks`);
  if (projectId) {
    revalidatePath(`/w/${workspaceId}/projects/${projectId}`);
    revalidatePath(`/w/${workspaceId}/projects/${projectId}/list`);
  }
}

export async function createTaskAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");
  let task: Task;

  try {
    task = await api<Task>(`/projects/${projectId}/tasks`, {
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

  revalidateTaskPaths(workspaceId, projectId);
  if (field(formData, "redirect") === "detail") {
    redirect(`/w/${workspaceId}/tasks/${task.id}`);
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
    await api(`/tasks/${taskId}`, {
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

  revalidateTaskPaths(workspaceId, projectId);
  revalidatePath(`/w/${workspaceId}/tasks/${taskId}`);
  return { ok: true };
}

export async function deleteTaskAction(formData: FormData): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = optionalField(formData, "projectId");
  const taskId = field(formData, "taskId");

  try {
    await api(`/tasks/${taskId}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }

  revalidateTaskPaths(workspaceId, projectId);
  revalidatePath(`/w/${workspaceId}/tasks/${taskId}`);

  if (field(formData, "skipRedirect") === "true") {
    return { ok: true };
  }

  redirect(
    projectId
      ? `/w/${workspaceId}/projects/${projectId}`
      : `/w/${workspaceId}/tasks`,
  );
}

export async function setTaskStatusAction(
  taskId: string,
  status: TaskStatus,
  workspaceId: string,
  projectId: string,
): Promise<{ ok: true; task: Task } | { ok: false; error: string }> {
  try {
    const task = await api<Task>(`/tasks/${taskId}/status`, {
      method: "PATCH",
      body: { status },
    });
    revalidateTaskPaths(workspaceId, projectId);
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
    await api(`/tasks/${taskId}/assignee`, {
      method: "PATCH",
      body: {
        assigneeId: assigneeRaw === "" ? null : assigneeRaw,
      },
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidateTaskPaths(workspaceId, projectId);
  revalidatePath(`/w/${workspaceId}/tasks/${taskId}`);
  return { ok: true };
}

export async function attachLabelAction(formData: FormData): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");
  const taskId = field(formData, "taskId");

  try {
    await api(`/tasks/${taskId}/labels`, {
      method: "POST",
      body: { labelId: field(formData, "labelId") },
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidateTaskPaths(workspaceId, projectId);
  revalidatePath(`/w/${workspaceId}/tasks/${taskId}`);
  return { ok: true };
}

export async function detachLabelAction(formData: FormData): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");
  const taskId = field(formData, "taskId");
  const labelId = field(formData, "labelId");

  try {
    await api(`/tasks/${taskId}/labels/${labelId}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }

  revalidateTaskPaths(workspaceId, projectId);
  revalidatePath(`/w/${workspaceId}/tasks/${taskId}`);
  return { ok: true };
}
