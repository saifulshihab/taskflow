"use client";

import { ActionDialog } from "@/components/dialog-form";
import { ProjectActions } from "@/components/projects/project-actions";
import { ProjectNav } from "@/components/projects/project-nav";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTaskAction } from "@/lib/actions/tasks";
import type { Project } from "@/lib/api-types";

export function ProjectBoardHeader({
  workspaceId,
  projectId,
  project,
  active,
  canEdit,
  canManage,
  listDescription,
}: {
  workspaceId: string;
  projectId: string;
  project: Project;
  active: "board" | "list";
  canEdit: boolean;
  canManage: boolean;
  listDescription?: string;
}) {
  return (
    <PageHeader
      title={active === "board" ? "Board" : "List"}
      description={
        listDescription ??
        (project.description ?? `${project.key} · ${project.name}`)
      }
    >
      <ProjectNav workspaceId={workspaceId} projectId={projectId} active={active} />
      {active === "board" && (
        <>
          <ProjectActions
            workspaceId={workspaceId}
            project={project}
            canManage={canManage}
          />
          {canEdit && (
            <ActionDialog
              trigger={<Button size="sm">Add task</Button>}
              title="New task"
              action={createTaskAction}
              submitLabel="Create"
            >
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input type="hidden" name="projectId" value={projectId} />
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
            </ActionDialog>
          )}
        </>
      )}
    </PageHeader>
  );
}
