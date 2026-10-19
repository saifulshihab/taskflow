import { apiClient } from "@/lib/api-client";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { field, toFormState, type FormState } from "@/lib/form-state";

export async function createCommentAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const taskId = field(formData, "taskId");

  try {
    await apiClient(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: { body: field(formData, "body") },
    });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.comments(taskId),
  });
  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.taskDetail(field(formData, "workspaceId"), taskId),
  });
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
    await apiClient(`/comments/${commentId}`, {
      method: "PATCH",
      body: { body: field(formData, "body") },
    });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.comments(taskId),
  });
  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.taskDetail(workspaceId, taskId),
  });
  return { ok: true };
}

export async function deleteCommentAction(
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const taskId = field(formData, "taskId");
  const commentId = field(formData, "commentId");

  try {
    await apiClient(`/comments/${commentId}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.comments(taskId),
  });
  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.taskDetail(workspaceId, taskId),
  });
  return { ok: true };
}
