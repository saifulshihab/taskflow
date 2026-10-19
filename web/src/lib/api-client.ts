import { ApiError, parseApiError } from "./api-error";
import { clearTokens, getTokens, setTokens } from "./auth-storage";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Query = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  anonymous?: boolean;
  _retried?: boolean;
}

const buildUrl = (path: string, query?: Query) => {
  const url = new URL(`${API_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, item);
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
};

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const refreshToken = getTokens()?.refreshToken;
  if (!refreshToken) return false;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    return false;
  }

  const payload = (await response.json()) as {
    tokens?: { accessToken: string; refreshToken: string };
  };
  if (!payload.tokens) {
    clearTokens();
    return false;
  }

  setTokens(payload.tokens);
  return true;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = `${window.location.pathname}${window.location.search}`;
  const url = next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;
  window.location.assign(url);
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers();
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (!options.anonymous) {
    const token = getTokens()?.accessToken;
    if (token) headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (
    response.status === 401 &&
    !options.anonymous &&
    !options._retried &&
    getTokens()?.refreshToken
  ) {
    const refreshed =
      refreshInFlight ??
      (refreshInFlight = refreshSession().finally(() => {
        refreshInFlight = null;
      }));
    if (await refreshed) {
      return apiClient<T>(path, { ...options, _retried: true });
    }
    redirectToLogin();
    throw new ApiError(401, "UNAUTHORIZED", "Session expired");
  }

  if (!response.ok) {
    throw parseApiError(response, payload);
  }

  return payload as T;
}
