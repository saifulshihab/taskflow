"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { field, toFormState, type FormState } from "@/lib/form-state";

export async function createCommentAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const taskId = field(formData, "taskId");

  try {
    await api(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: { body: field(formData, "body") },
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/w/${workspaceId}/tasks/${taskId}`);
  return { ok: true };
}

export async function updateCommentAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const taskId = field(formData, "taskId");
  const commentId = field(formData, "commentId");

  try {
    await api(`/comments/${commentId}`, {
      method: "PATCH",
      body: { body: field(formData, "body") },
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/w/${workspaceId}/tasks/${taskId}`);
  return { ok: true };
}

export async function deleteCommentAction(
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const taskId = field(formData, "taskId");
  const commentId = field(formData, "commentId");

  try {
    await api(`/comments/${commentId}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/w/${workspaceId}/tasks/${taskId}`);
  return { ok: true };
}
