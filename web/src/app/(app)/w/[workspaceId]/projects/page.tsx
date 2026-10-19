"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { ActionDialog } from "@/components/dialog-form";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction } from "@/lib/actions/projects";
import { PROJECT_STATUSES } from "@/lib/api-types";
import { PROJECT_STATUS_LABELS } from "@/lib/format";
import { useProjects, useWorkspace } from "@/lib/queries";
import { can } from "@/lib/rbac";

export default function ManageProjectsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = String(params.workspaceId);
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const includeArchived = searchParams.get("includeArchived") === "true";

  const workspaceQuery = useWorkspace(workspaceId);
  const projectsQuery = useProjects(workspaceId, {
    pageSize: 50,
    status,
    search,
    includeArchived,
  });

  if (workspaceQuery.isPending || projectsQuery.isPending) {
    return <Skeleton className="m-6 h-64 w-full" />;
  }

  if (
    workspaceQuery.isError ||
    projectsQuery.isError ||
    !workspaceQuery.data ||
    !projectsQuery.data
  ) {
    return (
      <p className="text-destructive p-6 text-sm">Could not load projects.</p>
    );
  }

  const workspace = workspaceQuery.data;
  const projects = projectsQuery.data;
  const canCreate = can(workspace.role, "MEMBER");

  return (
    <>
      <PageHeader title="Projects" description={workspace.name}>
        {canCreate && (
          <ActionDialog
            trigger={
              <Button size="sm">
                <PlusIcon /> New project
              </Button>
            }
            title="New project"
            action={createProjectAction}
            submitLabel="Create"
          >
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Key (optional)</Label>
              <Input id="key" name="key" placeholder="ALP" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
          </ActionDialog>
        )}
      </PageHeader>

      <div className="space-y-4 p-4 md:p-6">
        <form className="flex flex-wrap gap-2" method="get">
          <Input
            name="search"
            placeholder="Search projects..."
            className="max-w-xs"
            defaultValue={search ?? ""}
          />
          <NativeSelect name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {PROJECT_STATUS_LABELS[value]}
              </option>
            ))}
          </NativeSelect>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="includeArchived"
              value="true"
              defaultChecked={includeArchived}
            />
            Archived
          </label>
          <Button type="submit" variant="secondary" size="sm">
            Filter
          </Button>
        </form>

        {projects.data.length === 0 ? (
          <EmptyState
            title="No projects"
            description="Create a project to organize tasks."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.data.map((project) => (
              <Link
                key={project.id}
                href={`/w/${workspaceId}/p/${project.id}/board`}
                className="rounded-xl border p-4 transition-colors hover:bg-muted/40"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-medium">{project.name}</span>
                  <Badge variant="outline">{project.key}</Badge>
                </div>
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {project.description ?? "No description"}
                </p>
                <p className="text-muted-foreground mt-3 text-xs">
                  {project._count?.tasks ?? 0} tasks ·{" "}
                  {PROJECT_STATUS_LABELS[project.status]}
                  {project.archivedAt ? " · archived" : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
