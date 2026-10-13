import { ActionDialog } from "@/components/dialog-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
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
import { getMe, getWorkspace, listMembers } from "@/lib/data";
import { ROLE_LABELS } from "@/lib/format";
import { can } from "@/lib/rbac";
import { MemberRowActions } from "./member-row";

export default async function MembersPage({
  params,
}: PageProps<"/w/[workspaceId]/members">) {
  const { workspaceId } = await params;
  const [workspace, members, me] = await Promise.all([
    getWorkspace(workspaceId),
    listMembers(workspaceId),
    getMe(),
  ]);

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
