import Link from "next/link";
import { ProjectNav } from "@/components/projects/project-nav";
import { PageHeader } from "@/components/page-header";
import { TaskListFilters } from "@/components/tasks/task-list-filters";
import { TaskTable } from "@/components/tasks/task-table";
import { buttonVariants } from "@/components/ui/button";
import { getProject, listProjectTasks, listProjects } from "@/lib/data";
import { parseTaskListQuery, taskQueryToApi } from "@/lib/task-query";

export default async function ProjectListPage({
  params,
  searchParams,
}: PageProps<"/w/[workspaceId]/projects/[projectId]/list">) {
  const { workspaceId, projectId } = await params;
  const rawQuery = await searchParams;
  const parsed = parseTaskListQuery(rawQuery);
  const query = { ...parsed, projectId };

  const [project, projects, tasks] = await Promise.all([
    getProject(projectId),
    listProjects(workspaceId, { pageSize: 100 }),
    listProjectTasks(projectId, taskQueryToApi(query)),
  ]);

  return (
    <>
      <PageHeader
        title={`${project.key} · ${project.name}`}
        description="Filter and sort tasks in this project."
      >
        <ProjectNav workspaceId={workspaceId} projectId={projectId} active="list" />
      </PageHeader>

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
    return `/w/${workspaceId}/projects/${projectId}/list?${params.toString()}`;
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
