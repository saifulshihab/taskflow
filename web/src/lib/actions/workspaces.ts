"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import type { Role, Workspace } from "@/lib/api-types";
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
    workspace = await api<Workspace>("/workspaces", {
      method: "POST",
      body: {
        name: field(formData, "name"),
        slug: optionalField(formData, "slug"),
      },
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/workspaces");
  redirect(`/w/${workspace.id}`);
}

export async function updateWorkspaceAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");

  try {
    await api(`/workspaces/${workspaceId}`, {
      method: "PATCH",
      body: { name: field(formData, "name") },
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/workspaces");
  revalidatePath(`/w/${workspaceId}`, "layout");
  return { ok: true };
}

export async function deleteWorkspaceAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");

  try {
    const workspace = await api<Workspace>(`/workspaces/${workspaceId}`);
    if (field(formData, "confirmation") !== workspace.name) {
      return { error: `Type ${workspace.name} to confirm deletion.` };
    }

    await api(`/workspaces/${workspaceId}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath("/workspaces");
  redirect("/workspaces");
}

export async function addMemberAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");

  try {
    await api(`/workspaces/${workspaceId}/members`, {
      method: "POST",
      body: {
        email: field(formData, "email"),
        role: field(formData, "role") as Role,
      },
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/w/${workspaceId}/members`);
  return { ok: true };
}

export async function updateMemberRoleAction(
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const userId = field(formData, "userId");

  try {
    await api(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "PATCH",
      body: { role: field(formData, "role") as Role },
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/w/${workspaceId}/members`);
  return { ok: true };
}

export async function removeMemberAction(
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const userId = field(formData, "userId");

  try {
    await api(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "DELETE",
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/w/${workspaceId}/members`);
  return { ok: true };
}
