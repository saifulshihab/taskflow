import { apiClient } from "@/lib/api-client";
import type { AuthResponse } from "@/lib/api-types";
import { clearTokens, getTokens, setTokens } from "@/lib/auth-storage";
import { getQueryClient } from "@/lib/query-client";
import { field, toFormState, type FormState } from "@/lib/form-state";

export async function loginAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const next = field(formData, "next") || "/";

  try {
    const result = await apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      anonymous: true,
      body: {
        email: field(formData, "email"),
        password: String(formData.get("password") ?? ""),
      },
    });
    setTokens(result.tokens);
    getQueryClient().clear();
  } catch (error) {
    return toFormState(error);
  }

  return { ok: true, redirect: next };
}

export async function registerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const result = await apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      anonymous: true,
      body: {
        email: field(formData, "email"),
        name: field(formData, "name"),
        password: String(formData.get("password") ?? ""),
      },
    });
    setTokens(result.tokens);
    getQueryClient().clear();
  } catch (error) {
    return toFormState(error);
  }

  return { ok: true, redirect: "/" };
}

export async function logoutAction() {
  const refreshToken = getTokens()?.refreshToken;

  if (refreshToken) {
    try {
      await apiClient("/auth/logout", {
        method: "POST",
        anonymous: true,
        body: { refreshToken },
      });
    } catch {
      // ignored
    }
  }

  clearTokens();
  getQueryClient().clear();
  window.location.assign("/login");
}
