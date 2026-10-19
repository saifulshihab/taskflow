"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ProjectBoardHeader } from "@/components/projects/project-board-header";
import { TaskListFilters } from "@/components/tasks/task-list-filters";
import { TaskTable } from "@/components/tasks/task-table";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { setStoredBoardProjectId } from "@/lib/board-project-storage";
import { useRawSearchParams } from "@/lib/search-params";
import { useProject, useProjectTasks, useProjects, useWorkspace } from "@/lib/queries";
import { can } from "@/lib/rbac";
import { parseTaskListQuery, taskQueryToApi } from "@/lib/task-query";

export default function BoardProjectListPage() {
  const params = useParams();
  const workspaceId = String(params.workspaceId);
  const projectId = String(params.projectId);
  const rawQuery = useRawSearchParams();
  const parsed = parseTaskListQuery(rawQuery);
  const query = { ...parsed, projectId };

  useEffect(() => {
    setStoredBoardProjectId(workspaceId, projectId);
  }, [workspaceId, projectId]);

  const projectQuery = useProject(projectId);
  const workspaceQuery = useWorkspace(workspaceId);
  const projectsQuery = useProjects(workspaceId, { pageSize: 100 });
  const tasksQuery = useProjectTasks(projectId, taskQueryToApi(query));

  if (
    projectQuery.isPending ||
    workspaceQuery.isPending ||
    projectsQuery.isPending ||
    tasksQuery.isPending
  ) {
    return <Skeleton className="m-6 h-64 w-full" />;
  }

  if (
    projectQuery.isError ||
    workspaceQuery.isError ||
    projectsQuery.isError ||
    tasksQuery.isError ||
    !projectQuery.data ||
    !workspaceQuery.data ||
    !projectsQuery.data ||
    !tasksQuery.data
  ) {
    return (
      <p className="text-destructive p-6 text-sm">Could not load task list.</p>
    );
  }

  const project = projectQuery.data;
  const workspace = workspaceQuery.data;
  const projects = projectsQuery.data;
  const tasks = tasksQuery.data;
  const canManage = can(workspace.role, "ADMIN");

  return (
    <>
      <ProjectBoardHeader
        workspaceId={workspaceId}
        projectId={projectId}
        project={project}
        active="list"
        canEdit={false}
        canManage={canManage}
        listDescription="Filter and sort tasks in this project."
      />

      <div className="space-y-4 p-4 md:p-6">
        <TaskListFilters
          workspaceId={workspaceId}
          query={query}
          projects={projects.data}
          fixedProjectId={projectId}
        />
        <TaskTable tasks={tasks.data} workspaceId={workspaceId} />
        <Pagination
          workspaceId={workspaceId}
          projectId={projectId}
          page={tasks.meta.page}
          totalPages={tasks.meta.totalPages}
          rawQuery={rawQuery}
        />
      </div>
    </>
  );
}

function Pagination({
  workspaceId,
  projectId,
  page,
  totalPages,
  rawQuery,
}: {
  workspaceId: string;
  projectId: string;
  page: number;
  totalPages: number;
  rawQuery: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(rawQuery)) {
      if (key === "page") continue;
      if (Array.isArray(value)) {
        for (const item of value) params.append(key, item);
      } else if (value) params.set(key, value);
    }
    params.set("page", String(nextPage));
    return `/w/${workspaceId}/board/${projectId}/list?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={hrefFor(page - 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={hrefFor(page + 1)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
