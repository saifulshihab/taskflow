import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import {
  PRIORITIES,
  TASK_STATUSES,
  type Project,
} from "@/lib/api-types";
import type { TaskListQuery } from "@/lib/task-query";
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/format";

export function TaskListFilters({
  workspaceId,
  query,
  projects,
  fixedProjectId,
}: {
  workspaceId: string;
  query: TaskListQuery;
  projects: Project[];
  fixedProjectId?: string;
}) {
  const action = fixedProjectId
    ? `/w/${workspaceId}/projects/${fixedProjectId}/list`
    : `/w/${workspaceId}/tasks`;

  return (
    <form method="get" action={action} className="space-y-5 rounded-xl border p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            name="search"
            defaultValue={query.search ?? ""}
            placeholder="Title or description"
          />
        </div>
        {!fixedProjectId && (
          <div className="space-y-2">
            <Label htmlFor="projectId">Project</Label>
            <NativeSelect
              id="projectId"
              name="projectId"
              defaultValue={query.projectId ?? ""}
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.key} — {project.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="assigneeId">Assignee</Label>
          <NativeSelect
            id="assigneeId"
            name="assigneeId"
            defaultValue={query.assigneeId ?? ""}
          >
            <option value="">Anyone</option>
            <option value="me">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <NativeSelect
            id="status"
            name="status"
            defaultValue={query.status?.[0] ?? ""}
          >
            <option value="">Any status</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TASK_STATUS_LABELS[status]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <NativeSelect
            id="priority"
            name="priority"
            defaultValue={query.priority?.[0] ?? ""}
          >
            <option value="">Any priority</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort">Sort</Label>
          <NativeSelect id="sort" name="sort" defaultValue={query.sort ?? "-createdAt"}>
            <option value="-createdAt">Newest</option>
            <option value="createdAt">Oldest</option>
            <option value="-updatedAt">Recently updated</option>
            <option value="dueDate">Due date (asc)</option>
            <option value="-dueDate">Due date (desc)</option>
            <option value="-priority">Priority (high first)</option>
            <option value="position">Position</option>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueBefore">Due before</Label>
          <Input
            id="dueBefore"
            name="dueBefore"
            type="date"
            defaultValue={query.dueBefore ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueAfter">Due after</Label>
          <Input
            id="dueAfter"
            name="dueAfter"
            type="date"
            defaultValue={query.dueAfter ?? ""}
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-5 accent-foreground"
              name="topLevelOnly"
              value="true"
              defaultChecked={query.topLevelOnly}
            />
            Top-level only
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Apply</Button>
        <Link
          href={action}
          className={buttonVariants({ variant: "outline" })}
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
