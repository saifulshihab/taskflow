import { Suspense } from "react";
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
import { getProject, getWorkspace, listProjectTasks } from "@/lib/data";
import { can } from "@/lib/rbac";

export default async function ProjectBoardPage({
  params,
}: PageProps<"/w/[workspaceId]/projects/[projectId]">) {
  const { workspaceId, projectId } = await params;
  const [project, workspace, tasks] = await Promise.all([
    getProject(projectId),
    getWorkspace(workspaceId),
    listProjectTasks(projectId, {
      pageSize: 100,
      topLevelOnly: true,
      sort: "position",
    }),
  ]);

  const canEdit = can(workspace.role, "MEMBER");
  const canManage = can(workspace.role, "ADMIN");

  return (
    <>
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

      <div className="p-4 md:p-6">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <TaskBoard
            tasks={tasks.data}
            workspaceId={workspaceId}
            projectId={projectId}
          />
        </Suspense>
      </div>
    </>
  );
}
