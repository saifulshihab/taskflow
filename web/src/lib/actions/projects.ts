import { apiClient } from "@/lib/api-client";
import type { Project, ProjectStatus } from "@/lib/api-types";
import { invalidateProjectViews } from "@/lib/invalidate";
import { getQueryClient } from "@/lib/query-client";
import { projectPath } from "@/lib/project-paths";
import { queryKeys } from "@/lib/query-keys";
import {
  field,
  nullableField,
  optionalField,
  toFormState,
  type FormState,
} from "@/lib/form-state";

export async function createProjectAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  let project: Project;

  try {
    project = await apiClient<Project>(`/workspaces/${workspaceId}/projects`, {
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

  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.projects(workspaceId),
  });
  return {
    ok: true,
    redirect: projectPath(workspaceId, project.id, "board"),
  };
}

export async function updateProjectAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");

  try {
    await apiClient(`/projects/${projectId}`, {
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

  invalidateProjectViews(getQueryClient(), workspaceId, projectId);
  return { ok: true };
}

export async function archiveProjectAction(
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");

  try {
    await apiClient(`/projects/${projectId}/archive`, { method: "POST" });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.projects(workspaceId),
  });
  return { ok: true };
}

export async function unarchiveProjectAction(
  formData: FormData,
): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");

  try {
    await apiClient(`/projects/${projectId}/unarchive`, { method: "POST" });
  } catch (error) {
    return toFormState(error);
  }

  invalidateProjectViews(getQueryClient(), workspaceId, projectId);
  return { ok: true };
}

export async function deleteProjectAction(formData: FormData): Promise<FormState> {
  const workspaceId = field(formData, "workspaceId");
  const projectId = field(formData, "projectId");

  try {
    await apiClient(`/projects/${projectId}`, { method: "DELETE" });
  } catch (error) {
    return toFormState(error);
  }

  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.projects(workspaceId),
  });
  return { ok: true, redirect: `/w/${workspaceId}/projects` };
}
