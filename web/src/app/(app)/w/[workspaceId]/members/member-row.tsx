"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import {
  removeMemberAction,
  updateMemberRoleAction,
} from "@/lib/actions/workspaces";
import { ROLES, type Member, type Role } from "@/lib/api-types";
import { ROLE_LABELS } from "@/lib/format";
import { can } from "@/lib/rbac";

export function MemberRowActions({
  workspaceId,
  member,
  actorRole,
}: {
  workspaceId: string;
  member: Member;
  actorRole: Role;
}) {
  const [pending, startTransition] = useTransition();
  const assignableRoles = ROLES.filter(
    (role) => role !== "OWNER" || can(actorRole, "OWNER"),
  );

  const onRoleChange = (role: string) => {
    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("userId", member.user.id);
    formData.set("role", role);
    startTransition(async () => {
      const result = await updateMemberRoleAction(formData);
      if (result.error) toast.error(result.error);
    });
  };

  const onRemove = () => {
    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("userId", member.user.id);
    startTransition(async () => {
      const result = await removeMemberAction(formData);
      if (result.error) toast.error(result.error);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <NativeSelect
        name="role"
        defaultValue={member.role}
        disabled={pending}
        onChange={(event) => onRoleChange(event.target.value)}
        className="w-auto"
      >
        {assignableRoles.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </NativeSelect>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={onRemove}
      >
        Remove
      </Button>
    </div>
  );
}
