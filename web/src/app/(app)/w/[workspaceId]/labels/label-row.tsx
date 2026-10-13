"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteLabelAction } from "@/lib/actions/labels";
import type { Label } from "@/lib/api-types";

export function LabelRow({
  workspaceId,
  label,
}: {
  workspaceId: string;
  label: Label;
}) {
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    const formData = new FormData();
    formData.set("workspaceId", workspaceId);
    formData.set("labelId", label.id);
    startTransition(async () => {
      const result = await deleteLabelAction(formData);
      if (result.error) toast.error(result.error);
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={onDelete}
    >
      Delete
    </Button>
  );
}
