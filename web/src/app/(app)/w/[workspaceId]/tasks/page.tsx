import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { TaskListFilters } from "@/components/tasks/task-list-filters";
import { TaskTable } from "@/components/tasks/task-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect } from "@/components/native-select";
import { listLabels, listProjects, listWorkspaceTasks } from "@/lib/data";
import { parseTaskListQuery, taskQueryToApi } from "@/lib/task-query";

export default async function WorkspaceTasksPage({
  params,
  searchParams,
}: PageProps<"/w/[workspaceId]/tasks">) {
  const { workspaceId } = await params;
  const rawQuery = await searchParams;
  const query = parseTaskListQuery(rawQuery);

  const [projects, tasks, labels] = await Promise.all([
    listProjects(workspaceId, { pageSize: 100 }),
    listWorkspaceTasks(workspaceId, taskQueryToApi(query)),
    listLabels(workspaceId),
  ]);

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Search and filter work across every project."
      />

      <div className="space-y-4 p-4 md:p-6">
        <TaskListFilters
          workspaceId={workspaceId}
          query={query}
          projects={projects.data}
        />
        {labels.length > 0 && (
          <form method="get" className="flex flex-wrap items-end gap-2">
            {Object.entries(rawQuery).map(([key, value]) => {
              if (key === "labelId" || !value) return null;
              const values = Array.isArray(value) ? value : [value];
              return values.map((item) => (
                <input key={`${key}-${item}`} type="hidden" name={key} value={item} />
              ));
            })}
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
            <Button type="submit" variant="secondary">Apply label</Button>
          </form>
        )}
        <TaskTable tasks={tasks.data} workspaceId={workspaceId} />
        <TaskPagination
          workspaceId={workspaceId}
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
  page,
  totalPages,
  rawQuery,
}: {
  workspaceId: string;
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
    return `/w/${workspaceId}/tasks?${params.toString()}`;
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
