"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { FieldError, FormError, SubmitButton } from "@/components/form-feedback";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/form-state";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});

  useEffect(() => {
    if (state.redirect) router.replace(state.redirect);
  }, [state.redirect, router]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormError message={state.error} />

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ada@taskflow.dev"
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
          autoComplete="current-password"
          required
        />
        <FieldError message={state.fieldErrors?.password} />
      </div>

      <SubmitButton className="w-full" pendingText="Signing in...">
        Sign in
      </SubmitButton>
    </form>
  );
}
