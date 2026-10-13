"use server";

import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import type { AuthResponse } from "@/lib/api-types";
import { field, toFormState, type FormState } from "@/lib/form-state";
import { clearSession, getRefreshToken, setSession } from "@/lib/session";

export async function loginAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const next = field(formData, "next") || "/";

  try {
    const result = await api<AuthResponse>("/auth/login", {
      method: "POST",
      anonymous: true,
      body: {
        email: field(formData, "email"),
        password: String(formData.get("password") ?? ""),
      },
    });
    await setSession(result.tokens);
  } catch (error) {
    return toFormState(error);
  }

  // Outside the try block: redirect signals by throwing.
  redirect(next);
}

export async function registerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const result = await api<AuthResponse>("/auth/register", {
      method: "POST",
      anonymous: true,
      body: {
        email: field(formData, "email"),
        name: field(formData, "name"),
        password: String(formData.get("password") ?? ""),
      },
    });
    await setSession(result.tokens);
  } catch (error) {
    return toFormState(error);
  }

  redirect("/");
}

export async function logoutAction() {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    // Best effort: the cookies go regardless, so a failure here must not trap
    // the user in a session they asked to end.
    try {
      await api("/auth/logout", {
        method: "POST",
        anonymous: true,
        body: { refreshToken },
      });
    } catch {
      // ignored
    }
  }

  await clearSession();
  redirect("/login");
}
