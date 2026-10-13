"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import type { Project, ProjectStatus } from "@/lib/api-types";
import {
  field,
  nullableField,
  optionalField,
  toFormState,
  type FormState,
} from "@/lib/form-state";

function revalidateProject(workspaceId: string, projectId: string) {
  revalidatePath(`/w/${workspaceId}`);
  revalidatePath(`/w/${workspaceId}/projects/${projectId}`);
  revalidatePath(`/w/${workspaceId}/projects/${projectId}/list`);
}

export async function createProjectAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  let project: Project;

  try {
    project = await api<Project>(`/workspaces/${workspaceId}/projects`, {
      method: "POST",
      body: {
        name: field(formData, "name"),
        key: optionalField(formData, "key"),
        description: optionalField(formData, "description"),
        status: (optionalField(formData, "status") ??
          "ACTIVE") as ProjectStatus,
      },
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/w/${workspaceId}`);
  redirect(`/w/${workspaceId}/projects/${project.id}`);
}

export async function updateProjectAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");

  try {
    await api(`/projects/${projectId}`, {
      method: "PATCH",
      body: {
        name: field(formData, "name"),
        description: nullableField(formData, "description"),
        status: field(formData, "status") as ProjectStatus,
      },
    });
  } catch (error) {
    return toFormState(error);
  }

  revalidateProject(workspaceId, projectId);
  return { ok: true };
}

export async function archiveProjectAction(
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");

  try {
    await api(`/projects/${projectId}/archive`, { method: "POST" });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/w/${workspaceId}`);
  return { ok: true };
}

export async function unarchiveProjectAction(
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");

  try {
    await api(`/projects/${projectId}/unarchive`, { method: "POST" });
  } catch (error) {
    return toFormState(error);
  }

  revalidateProject(workspaceId, projectId);
  return { ok: true };
}

export async function deleteProjectAction(formData: FormData): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");

  try {
    await api(`/projects/${projectId}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }

  revalidatePath(`/w/${workspaceId}`);
  redirect(`/w/${workspaceId}`);
}
