import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { ActionDialog } from "@/components/dialog-form";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkspaceAction } from "@/lib/actions/workspaces";
import { listWorkspaces } from "@/lib/data";

export const instant = false;
export const metadata = { title: "Workspaces | TaskFlow" };

export default async function WorkspacesPage() {
  const workspaces = await listWorkspaces({ pageSize: 100 });

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col">
      <PageHeader
        title="Workspaces"
        description="Switch between teams or spin up a new one."
      >
        <ActionDialog
          trigger={<Button size="sm"><PlusIcon /> New workspace</Button>}
          title="Create workspace"
          description="You will be the owner."
          action={createWorkspaceAction}
          submitLabel="Create"
          pendingLabel="Creating..."
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input id="slug" name="slug" placeholder="acme-rockets" />
          </div>
        </ActionDialog>
      </PageHeader>

      <div className="flex-1 space-y-3 p-4 md:p-6">
        {workspaces.data.length === 0 ? (
          <EmptyState
            title="No workspaces yet"
            description="Create your first workspace to start tracking projects."
          />
        ) : (
          <ul className="divide-y rounded-xl border">
            {workspaces.data.map((workspace) => (
              <li key={workspace.id}>
                <Link
                  href={`/w/${workspace.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{workspace.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {workspace.slug} · {workspace.role.toLowerCase()}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {workspace._count?.projects ?? 0} projects
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
