import { apiClient } from "@/lib/api-client";
import type { Role, Workspace } from "@/lib/api-types";
import { invalidateWorkspaceShell } from "@/lib/invalidate";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import {
  field,
  optionalField,
  toFormState,
  type FormState,
} from "@/lib/form-state";

export async function createWorkspaceAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  let workspace: Workspace;

  try {
    workspace = await apiClient<Workspace>("/workspaces", {
      method: "POST",
      body: {
        name: field(formData, "name"),
        slug: optionalField(formData, "slug"),
      },
    });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({ queryKey: queryKeys.workspaces() });
  return { ok: true, redirect: `/w/${workspace.id}/board` };
}

export async function updateWorkspaceAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");

  try {
    await apiClient(`/workspaces/${workspaceId}`, {
      method: "PATCH",
      body: { name: field(formData, "name") },
    });
  } catch (error) {
    return toFormState(error);
  }

  invalidateWorkspaceShell(getQueryClient(), workspaceId);
  return { ok: true };
}

export async function deleteWorkspaceAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");

  try {
    const workspace = await apiClient<Workspace>(`/workspaces/${workspaceId}`);
    if (field(formData, "confirmation") !== workspace.name) {
      return { error: `Type ${workspace.name} to confirm deletion.` };
    }

    await apiClient(`/workspaces/${workspaceId}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({ queryKey: queryKeys.workspaces() });
  return { ok: true, redirect: "/workspaces" };
}

export async function addMemberAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");

  try {
    await apiClient(`/workspaces/${workspaceId}/members`, {
      method: "POST",
      body: {
        email: field(formData, "email"),
        role: field(formData, "role") as Role,
      },
    });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.members(workspaceId),
  });
  return { ok: true };
}

export async function updateMemberRoleAction(
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const userId = field(formData, "userId");

  try {
    await apiClient(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "PATCH",
      body: { role: field(formData, "role") as Role },
    });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.members(workspaceId),
  });
  return { ok: true };
}

export async function removeMemberAction(
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const userId = field(formData, "userId");

  try {
    await apiClient(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "DELETE",
    });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.members(workspaceId),
  });
  return { ok: true };
}
