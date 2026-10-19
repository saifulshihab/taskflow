"use client";

import { useParams } from "next/navigation";
import { ActionDialog } from "@/components/dialog-form";
import { ProjectActions } from "@/components/projects/project-actions";
import { ProjectNav } from "@/components/projects/project-nav";
import { PageHeader } from "@/components/page-header";
import { TaskBoard } from "@/components/tasks/task-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createTaskAction } from "@/lib/actions/tasks";
import { useProject, useWorkspace } from "@/lib/queries";
import { can } from "@/lib/rbac";

export default function ProjectBoardPage() {
  const params = useParams();
  const workspaceId = String(params.workspaceId);
  const projectId = String(params.projectId);

  const projectQuery = useProject(projectId);
  const workspaceQuery = useWorkspace(workspaceId);
  if (projectQuery.isPending || workspaceQuery.isPending) {
    return <Skeleton className="m-6 h-64 w-full" />;
  }

  if (
    projectQuery.isError ||
    workspaceQuery.isError ||
    !projectQuery.data ||
    !workspaceQuery.data
  ) {
    return (
      <p className="text-destructive p-6 text-sm">Could not load project board.</p>
    );
  }

  const project = projectQuery.data;
  const workspace = workspaceQuery.data;
  const canEdit = can(workspace.role, "MEMBER");
  const canManage = can(workspace.role, "ADMIN");

  return (
    <div className="flex min-h-[calc(100svh-3rem)] flex-col md:min-h-svh">
      <PageHeader
        title={`${project.key} · ${project.name}`}
        description={project.description ?? undefined}
      >
        <ProjectNav workspaceId={workspaceId} projectId={projectId} active="board" />
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
      </PageHeader>

      <div className="flex flex-1 flex-col p-4 md:p-6">
        <TaskBoard workspaceId={workspaceId} projectId={projectId} />
      </div>
    </div>
  );
}
