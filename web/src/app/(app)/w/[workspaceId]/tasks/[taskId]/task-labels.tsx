"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/native-select";
import { Button } from "@/components/ui/button";
import {
  attachLabelAction,
  detachLabelAction,
} from "@/lib/actions/tasks";
import type { Label } from "@/lib/api-types";

export function TaskLabels({
  workspaceId,
  projectId,
  taskId,
  labels,
  attached,
  canEdit,
  onMutate,
}: {
  workspaceId: string;
  projectId: string;
  taskId: string;
  labels: Label[];
  attached: Label[];
  canEdit: boolean;
  onMutate?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const attachedIds = new Set(attached.map((label) => label.id));
  const available = labels.filter((label) => !attachedIds.has(label.id));

  const attach = (labelId: string) => {
    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("projectId", projectId);
    formData.set("taskId", taskId);
    formData.set("labelId", labelId);
    startTransition(async () => {
      const result = await attachLabelAction(formData);
      if (result.error) toast.error(result.error);
      else onMutate?.();
    });
  };

  const detach = (labelId: string) => {
    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("projectId", projectId);
    formData.set("taskId", taskId);
    formData.set("labelId", labelId);
    startTransition(async () => {
      const result = await detachLabelAction(formData);
      if (result.error) toast.error(result.error);
      else onMutate?.();
    });
  };

  return (
    <div className="rounded-xl border p-4">
      <h2 className="text-sm font-medium">Labels</h2>
      <ul className="mt-3 space-y-2">
        {attached.map((label) => (
          <li key={label.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="inline-flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              {label.name}
            </span>
            {canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={pending}
                onClick={() => detach(label.id)}
              >
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && available.length > 0 && (
        <div className="mt-3">
          <NativeSelect
            defaultValue=""
            disabled={pending}
            onChange={(event) => {
              const value = event.target.value;
              if (value) attach(value);
            }}
          >
            <option value="">Add label…</option>
            {available.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}
    </div>
  );
}
