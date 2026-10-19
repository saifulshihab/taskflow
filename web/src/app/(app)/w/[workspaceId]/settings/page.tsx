"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/lib/queries";
import { can } from "@/lib/rbac";
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog";
import { WorkspaceSettingsForm } from "./settings-form";

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = String(params.workspaceId);
  const { data: workspace, isPending, isError } = useWorkspace(workspaceId);

  if (isPending) return <Skeleton className="m-6 h-64 w-full" />;
  if (isError || !workspace) {
    return (
      <p className="text-destructive p-6 text-sm">Could not load settings.</p>
    );
  }

  const canEdit = can(workspace.role, "ADMIN");
  const canDelete = can(workspace.role, "OWNER");

  return (
    <>
      <PageHeader title="Settings" description={`Manage ${workspace.name}`} />

      <div className="mx-auto max-w-lg space-y-8 p-4 md:p-6">
        {canEdit ? (
          <WorkspaceSettingsForm workspaceId={workspaceId} name={workspace.name} />
        ) : (
          <p className="text-muted-foreground text-sm">
            You need admin access to change workspace settings.
          </p>
        )}

        {canDelete && (
          <section className="rounded-xl border border-destructive/30 p-4">
            <h2 className="font-medium text-destructive">Danger zone</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Deleting a workspace removes all projects, tasks, and activity.
            </p>
            <DeleteWorkspaceDialog
              workspaceId={workspaceId}
              workspaceName={workspace.name}
            />
          </section>
        )}
      </div>
    </>
  );
}
