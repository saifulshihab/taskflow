"use client";

import Link from "next/link";
import { ActionDialog } from "@/components/dialog-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTaskAction } from "@/lib/actions/tasks";
import type { Task } from "@/lib/api-types";
import { StatusBadge } from "@/components/tasks/task-badges";

export function SubtaskSection({
  workspaceId,
  projectId,
  parentTaskId,
  subtasks,
  canEdit,
  onCreated,
  onSubtaskSelect,
}: {
  workspaceId: string;
  projectId: string;
  parentTaskId: string;
  subtasks: Task[];
  canEdit: boolean;
  onCreated?: () => void;
  onSubtaskSelect?: (taskId: string) => void;
}) {
  return (
    <section className="rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">Subtasks</h2>
        {canEdit && (
          <ActionDialog
            trigger={<Button size="sm" variant="secondary">Add subtask</Button>}
            title="New subtask"
            action={createTaskAction}
            submitLabel="Create"
            onSuccess={onCreated}
          >
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="parentTaskId" value={parentTaskId} />
            <div className="space-y-2">
              <Label htmlFor="subtask-title">Title</Label>
              <Input id="subtask-title" name="title" required />
            </div>
          </ActionDialog>
        )}
      </div>
      {subtasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">No subtasks yet.</p>
      ) : (
        <ul className="space-y-2">
          {subtasks.map((subtask) => (
            <li key={subtask.id} className="flex items-center justify-between gap-2 text-sm">
              {onSubtaskSelect ? (
                <button
                  type="button"
                  className="text-left hover:underline"
                  onClick={() => onSubtaskSelect(subtask.id)}
                >
                  {subtask.title}
                </button>
              ) : (
                <Link
                  href={`/w/${workspaceId}/tasks/${subtask.id}`}
                  className="hover:underline"
                >
                  {subtask.title}
                </Link>
              )}
              <StatusBadge status={subtask.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
