import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { ActionDialog } from "@/components/dialog-form";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction } from "@/lib/actions/projects";
import { PROJECT_STATUSES } from "@/lib/api-types";
import { getWorkspace, listProjects } from "@/lib/data";
import { PROJECT_STATUS_LABELS } from "@/lib/format";
import { can } from "@/lib/rbac";

export default async function WorkspaceProjectsPage({
  params,
  searchParams,
}: PageProps<"/w/[workspaceId]">) {
  const { workspaceId } = await params;
  const query = await searchParams;
  const status =
    typeof query.status === "string" ? query.status : undefined;
  const search =
    typeof query.search === "string" ? query.search : undefined;
  const includeArchived = query.includeArchived === "true";

  const [workspace, projects] = await Promise.all([
    getWorkspace(workspaceId),
    listProjects(workspaceId, {
      pageSize: 50,
      status,
      search,
      includeArchived,
    }),
  ]);

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
                href={`/w/${workspaceId}/projects/${project.id}`}
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
