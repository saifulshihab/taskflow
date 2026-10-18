"use client";

import { useActionState, useState } from "react";
import { FormError } from "@/components/form-feedback";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteWorkspaceAction } from "@/lib/actions/workspaces";
import type { FormState } from "@/lib/form-state";

export function DeleteWorkspaceDialog({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState<FormState, FormData>(
    deleteWorkspaceAction,
    {},
  );

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive" size="sm" className="mt-4" />}
      >
        Delete workspace
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {workspaceName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the workspace and its projects, tasks,
            labels, comments, members, and activity. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <FormError message={state.error} />
          <div className="space-y-2">
            <Label htmlFor="workspace-delete-confirmation">
              Type <strong>{workspaceName}</strong> to confirm
            </Label>
            <Input
              id="workspace-delete-confirmation"
              name="confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || confirmation !== workspaceName}
            >
              {pending ? "Deleting..." : "Delete workspace"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
