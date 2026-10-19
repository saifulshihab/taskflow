"use client";

import { useParams } from "next/navigation";
import { ActionDialog } from "@/components/dialog-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { addMemberAction } from "@/lib/actions/workspaces";
import { ROLES } from "@/lib/api-types";
import { ROLE_LABELS } from "@/lib/format";
import { useMe, useMembers, useWorkspace } from "@/lib/queries";
import { can } from "@/lib/rbac";
import { MemberRowActions } from "./member-row";

export default function MembersPage() {
  const params = useParams();
  const workspaceId = String(params.workspaceId);

  const workspaceQuery = useWorkspace(workspaceId);
  const membersQuery = useMembers(workspaceId);
  const meQuery = useMe();

  if (workspaceQuery.isPending || membersQuery.isPending || meQuery.isPending) {
    return <Skeleton className="m-6 h-64 w-full" />;
  }

  if (
    workspaceQuery.isError ||
    membersQuery.isError ||
    meQuery.isError ||
    !workspaceQuery.data ||
    !membersQuery.data ||
    !meQuery.data
  ) {
    return (
      <p className="text-destructive p-6 text-sm">Could not load members.</p>
    );
  }

  const workspace = workspaceQuery.data;
  const members = membersQuery.data;
  const me = meQuery.data;
  const canManage = can(workspace.role, "ADMIN");

  return (
    <>
      <PageHeader title="Members" description="Who has access to this workspace.">
        {canManage && (
          <ActionDialog
            trigger={<Button size="sm">Add member</Button>}
            title="Add member"
            description="The user must already have a TaskFlow account."
            action={addMemberAction}
            submitLabel="Add"
          >
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <NativeSelect id="role" name="role" defaultValue="MEMBER">
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </ActionDialog>
        )}
      </PageHeader>

      <div className="p-4 md:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.data.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.user.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {member.user.email}
                </TableCell>
                <TableCell>
                  {canManage && member.user.id !== me.id ? (
                    <MemberRowActions
                      workspaceId={workspaceId}
                      member={member}
                      actorRole={workspace.role}
                    />
                  ) : (
                    ROLE_LABELS[member.role]
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
