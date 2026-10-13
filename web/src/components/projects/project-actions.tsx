"use client";

import { useActionState } from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { FormError, SubmitButton } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveProjectAction,
  deleteProjectAction,
  unarchiveProjectAction,
  updateProjectAction,
} from "@/lib/actions/projects";
import { PROJECT_STATUSES, type Project } from "@/lib/api-types";
import type { FormState } from "@/lib/form-state";
import { PROJECT_STATUS_LABELS } from "@/lib/format";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ProjectActions({
  workspaceId,
  project,
  canManage,
}: {
  workspaceId: string;
  project: Project;
  canManage: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(
    updateProjectAction,
    {},
  );

  if (!canManage) return null;

  const archive = async () => {
    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("projectId", project.id);
    await archiveProjectAction(formData);
  };

  const unarchive = async () => {
    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("projectId", project.id);
    await unarchiveProjectAction(formData);
  };

  const remove = async () => {
    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("projectId", project.id);
    await deleteProjectAction(formData);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" />}
        >
          <MoreHorizontalIcon />
          Project
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            Edit project
          </DropdownMenuItem>
          {project.archivedAt ? (
            <DropdownMenuItem onClick={() => void unarchive()}>
              Unarchive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => void archive()}>
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onClick={() => void remove()}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>
          <form action={action} className="space-y-4">
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input type="hidden" name="projectId" value={project.id} />
            <FormError message={state.error} />
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={project.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                name="description"
                rows={3}
                defaultValue={project.description ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <NativeSelect
                id="edit-status"
                name="status"
                defaultValue={project.status}
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <SubmitButton pendingText="Saving...">Save</SubmitButton>
            {state.ok && (
              <p className="text-muted-foreground text-sm">Saved.</p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
