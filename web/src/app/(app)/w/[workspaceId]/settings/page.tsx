import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { deleteWorkspaceFormAction } from "@/lib/actions/workspaces";
import { getWorkspace } from "@/lib/data";
import { can } from "@/lib/rbac";
import { WorkspaceSettingsForm } from "./settings-form";

export default async function WorkspaceSettingsPage({
  params,
}: PageProps<"/w/[workspaceId]/settings">) {
  const { workspaceId } = await params;
  const workspace = await getWorkspace(workspaceId);
  const canEdit = can(workspace.role, "ADMIN");
  const canDelete = can(workspace.role, "OWNER");

  return (
    <>
      <PageHeader
        title="Settings"
        description={`Manage ${workspace.name}`}
      />

      <div className="mx-auto max-w-lg space-y-8 p-4 md:p-6">
        {canEdit ? (
          <WorkspaceSettingsForm workspaceId={workspaceId} name={workspace.name} />
        ) : (
          <p className="text-muted-foreground text-sm">
            You need admin access to change workspace settings.
          </p>
        )}

        {canDelete && (
          <form
            action={deleteWorkspaceFormAction}
            className="rounded-xl border border-destructive/30 p-4"
          >
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <h2 className="font-medium text-destructive">Danger zone</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Deleting a workspace removes all projects, tasks, and activity.
            </p>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              className="mt-4"
            >
              Delete workspace
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
