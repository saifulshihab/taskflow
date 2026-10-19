"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TaskListFilters } from "@/components/tasks/task-list-filters";
import { TaskTable } from "@/components/tasks/task-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect } from "@/components/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject } from "@/lib/queries";
import { projectPath } from "@/lib/project-paths";
import { useRawSearchParams } from "@/lib/search-params";
import { useLabels, useProjectTasks } from "@/lib/queries";
import { parseTaskListQuery, taskQueryToApi } from "@/lib/task-query";

export default function ProjectTasksPage() {
  const params = useParams();
  const workspaceId = String(params.workspaceId);
  const projectId = String(params.projectId);
  const rawQuery = useRawSearchParams();
  const parsed = parseTaskListQuery(rawQuery);
  const query = { ...parsed, projectId };

  const projectQuery = useProject(projectId);
  const tasksQuery = useProjectTasks(projectId, taskQueryToApi(query));
  const labelsQuery = useLabels(workspaceId);

  if (projectQuery.isPending || tasksQuery.isPending || labelsQuery.isPending) {
    return <Skeleton className="m-6 h-64 w-full" />;
  }

  if (
    projectQuery.isError ||
    tasksQuery.isError ||
    labelsQuery.isError ||
    !projectQuery.data ||
    !tasksQuery.data ||
    !labelsQuery.data
  ) {
    return (
      <p className="text-destructive p-6 text-sm">Could not load tasks.</p>
    );
  }

  if (projectQuery.data.workspaceId !== workspaceId) {
    return (
      <p className="text-destructive p-6 text-sm">Project not found in this workspace.</p>
    );
  }

  const project = projectQuery.data;
  const tasks = tasksQuery.data;
  const labels = labelsQuery.data;

  return (
    <>
      <PageHeader
        title="Tasks"
        description={`${project.key} · ${project.name}`}
      />

      <div className="space-y-4 p-4 md:p-6">
        <TaskListFilters
          workspaceId={workspaceId}
          query={query}
          projects={[project]}
          fixedProjectId={projectId}
          filterSection="tasks"
        />
        {labels.length > 0 && (
          <form method="get" className="flex flex-wrap items-end gap-2">
            {Object.entries(rawQuery).map(([key, value]) => {
              if (key === "labelId" || key === "projectId" || !value) return null;
              const values = Array.isArray(value) ? value : [value];
              return values.map((item) => (
                <input key={`${key}-${item}`} type="hidden" name={key} value={item} />
              ));
            })}
            <input type="hidden" name="projectId" value={projectId} />
            <label className="flex items-center gap-2 text-sm">
              Label
              <NativeSelect
                name="labelId"
                className="w-40"
                defaultValue={query.labelId ?? ""}
              >
                <option value="">Any</option>
                {labels.map((label) => (
                  <option key={label.id} value={label.id}>
                    {label.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <Button type="submit" variant="secondary">
              Apply label
            </Button>
          </form>
        )}
        <TaskTable tasks={tasks.data} workspaceId={workspaceId} />
        <TaskPagination
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

function TaskPagination({
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
    const base = projectPath(workspaceId, projectId, "tasks");
    return `${base}?${params.toString()}`;
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
