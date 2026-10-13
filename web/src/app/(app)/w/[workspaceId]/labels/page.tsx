import { ActionDialog } from "@/components/dialog-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createLabelAction } from "@/lib/actions/labels";
import { getWorkspace, listLabels } from "@/lib/data";
import { can } from "@/lib/rbac";
import { LabelRow } from "./label-row";

export default async function LabelsPage({
  params,
}: PageProps<"/w/[workspaceId]/labels">) {
  const { workspaceId } = await params;
  const [workspace, labels] = await Promise.all([
    getWorkspace(workspaceId),
    listLabels(workspaceId),
  ]);

  const canEdit = can(workspace.role, "MEMBER");

  return (
    <>
      <PageHeader title="Labels" description="Tags for filtering and organizing tasks.">
        {canEdit && (
          <ActionDialog
            trigger={<Button size="sm">New label</Button>}
            title="Create label"
            action={createLabelAction}
            submitLabel="Create"
          >
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required maxLength={40} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" name="color" type="color" defaultValue="#6b7280" />
            </div>
          </ActionDialog>
        )}
      </PageHeader>

      <div className="p-4 md:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Tasks</TableHead>
              {canEdit && <TableHead className="w-40" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {labels.map((label) => (
              <TableRow key={label.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {label._count?.tasks ?? 0}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <LabelRow workspaceId={workspaceId} label={label} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
