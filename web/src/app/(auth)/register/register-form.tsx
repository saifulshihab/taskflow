"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { FieldError, FormError, SubmitButton } from "@/components/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/form-state";

export function RegisterForm() {
  const router = useRouter();
  const [state, action] = useActionState<FormState, FormData>(
    registerAction,
    {},
  );

  useEffect(() => {
    if (state.redirect) router.replace(state.redirect);
  }, [state.redirect, router]);

  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required />
        <FieldError message={state.fieldErrors?.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <FieldError message={state.fieldErrors?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FieldError message={state.fieldErrors?.password} />
        <p className="text-muted-foreground text-xs">At least 8 characters.</p>
      </div>

      <SubmitButton className="w-full" pendingText="Creating account...">
        Create account
      </SubmitButton>
    </form>
  );
}
