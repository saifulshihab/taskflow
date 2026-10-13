"use client";

import { useActionState } from "react";
import { FormError, SubmitButton } from "@/components/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateWorkspaceAction } from "@/lib/actions/workspaces";
import type { FormState } from "@/lib/form-state";

export function WorkspaceSettingsForm({
  workspaceId,
  name,
}: {
  workspaceId: string;
  name: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(
    updateWorkspaceAction,
    {},
  );

  return (
    <form action={action} className="space-y-4 rounded-xl border p-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <FormError message={state.error} />
      <div className="space-y-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>
      <SubmitButton pendingText="Saving...">Save changes</SubmitButton>
      {state.ok && (
        <p className="text-muted-foreground text-sm">Saved.</p>
      )}
    </form>
  );
}
