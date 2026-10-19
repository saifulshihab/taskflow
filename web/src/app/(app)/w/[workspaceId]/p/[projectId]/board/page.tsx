"use client";

import { useParams } from "next/navigation";
import { ProjectBoardHeader } from "@/components/projects/project-board-header";
import { TaskBoard } from "@/components/tasks/task-board";
import { Skeleton } from "@/components/ui/skeleton";
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

  if (projectQuery.data.workspaceId !== workspaceId) {
    return (
      <p className="text-destructive p-6 text-sm">Project not found in this workspace.</p>
    );
  }

  const project = projectQuery.data;
  const workspace = workspaceQuery.data;
  const canEdit = can(workspace.role, "MEMBER");
  const canManage = can(workspace.role, "ADMIN");

  return (
    <div className="flex min-h-[calc(100svh-3rem)] flex-col md:min-h-svh">
      <ProjectBoardHeader
        workspaceId={workspaceId}
        projectId={projectId}
        project={project}
        active="board"
        canEdit={canEdit}
        canManage={canManage}
      />
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <TaskBoard workspaceId={workspaceId} projectId={projectId} />
      </div>
    </div>
  );
}
