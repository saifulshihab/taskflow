"use client";

import { useActionState, useEffect } from "react";
import { FieldError, FormError, SubmitButton } from "@/components/form-feedback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FormState } from "@/lib/form-state";

export function ActionDialog({
  trigger,
  title,
  description,
  action,
  children,
  submitLabel,
  pendingLabel,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    if (state.ok) onOpenChange?.(false);
  }, [state.ok, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <FormError message={state.error} />
          {children}
          <SubmitButton pendingText={pendingLabel}>{submitLabel}</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { FieldError };
