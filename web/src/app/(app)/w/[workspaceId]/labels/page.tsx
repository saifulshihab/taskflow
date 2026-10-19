"use client";

import { useParams } from "next/navigation";
import { ActionDialog } from "@/components/dialog-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createLabelAction } from "@/lib/actions/labels";
import { useLabels, useWorkspace } from "@/lib/queries";
import { can } from "@/lib/rbac";
import { LabelRow } from "./label-row";

export default function LabelsPage() {
  const params = useParams();
  const workspaceId = String(params.workspaceId);

  const workspaceQuery = useWorkspace(workspaceId);
  const labelsQuery = useLabels(workspaceId);

  if (workspaceQuery.isPending || labelsQuery.isPending) {
    return <Skeleton className="m-6 h-64 w-full" />;
  }

  if (
    workspaceQuery.isError ||
    labelsQuery.isError ||
    !workspaceQuery.data ||
    !labelsQuery.data
  ) {
    return (
      <p className="text-destructive p-6 text-sm">Could not load labels.</p>
    );
  }

  const workspace = workspaceQuery.data;
  const labels = labelsQuery.data;
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
