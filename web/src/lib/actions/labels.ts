import { apiClient } from "@/lib/api-client";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import {
  field,
  optionalField,
  toFormState,
  type FormState,
} from "@/lib/form-state";

export async function createLabelAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");

  try {
    await apiClient(`/workspaces/${workspaceId}/labels`, {
      method: "POST",
      body: {
        name: field(formData, "name"),
        color: optionalField(formData, "color") ?? "#6b7280",
      },
    });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.labels(workspaceId),
  });
  return { ok: true };
}

export async function updateLabelAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const labelId = field(formData, "labelId");

  try {
    await apiClient(`/labels/${labelId}`, {
      method: "PATCH",
      body: {
        name: field(formData, "name"),
        color: field(formData, "color"),
      },
    });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.labels(workspaceId),
  });
  return { ok: true };
}

export async function deleteLabelAction(formData: FormData): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const labelId = field(formData, "labelId");

  try {
    await apiClient(`/labels/${labelId}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.labels(workspaceId),
  });
  return { ok: true };
}
