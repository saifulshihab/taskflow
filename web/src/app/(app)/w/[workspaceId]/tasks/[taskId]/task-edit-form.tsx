"use client";

import { useActionState, useEffect } from "react";
import { FieldError, FormError, SubmitButton } from "@/components/form-feedback";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteTaskAction, updateTaskAction } from "@/lib/actions/tasks";
import {
  PRIORITIES,
  TASK_STATUSES,
  type Member,
  type Task,
} from "@/lib/api-types";
import type { FormState } from "@/lib/form-state";
import {
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  toDateInput,
} from "@/lib/format";

export function TaskEditForm({
  task,
  workspaceId,
  members,
  onSaved,
  deleteMode = "redirect",
  onDeleted,
}: {
  task: Task;
  workspaceId: string;
  members: Member[];
  onSaved?: () => void;
  deleteMode?: "redirect" | "close";
  onDeleted?: () => void;
}) {
  const [state, action] = useActionState<FormState, FormData>(
    updateTaskAction,
    {},
  );

  useEffect(() => {
    if (state.ok) onSaved?.();
  }, [state.ok, onSaved]);

  const onDelete = () => {
    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("projectId", task.projectId);
    formData.set("taskId", task.id);
    if (deleteMode === "close") {
      formData.set("skipRedirect", "true");
    }
    void deleteTaskAction(formData).then((result) => {
      if (result.ok && deleteMode === "close") onDeleted?.();
    });
  };

  return (
    <form action={action} className="space-y-4 rounded-xl border p-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="projectId" value={task.projectId} />
      <input type="hidden" name="taskId" value={task.id} />

      <FormError message={state.error} />

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={task.title} required />
        <FieldError message={state.fieldErrors?.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={task.description ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <NativeSelect id="status" name="status" defaultValue={task.status}>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TASK_STATUS_LABELS[status]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <NativeSelect
            id="priority"
            name="priority"
            defaultValue={task.priority}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="assigneeId">Assignee</Label>
          <NativeSelect
            id="assigneeId"
            name="assigneeId"
            defaultValue={task.assigneeId ?? ""}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={toDateInput(task.dueDate)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingText="Saving...">Save</SubmitButton>
        <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
          Delete task
        </Button>
      </div>
      {state.ok && <p className="text-muted-foreground text-sm">Saved.</p>}
    </form>
  );
}
