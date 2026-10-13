"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-sm">{message}</p>;
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
      {message}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingText,
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? (pendingText ?? "Working...") : children}
    </Button>
  );
}
