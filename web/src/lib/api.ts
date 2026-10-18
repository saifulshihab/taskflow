import "server-only";
import { getAccessToken } from "./session";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface ApiErrorDetail {
  path: string;
  message: string;
}

interface ApiErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[] | Record<string, unknown>;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Maps a 422 response onto `{ fieldName: message }` for form rendering. */
  get fieldErrors(): Record<string, string> {
    const entries = (this.details ?? []).map(
      (detail) => [detail.path, detail.message] as const,
    );
    return Object.fromEntries(entries);
  }
}

type Query = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  /** Skip the Authorization header, for login/register/refresh. */
  anonymous?: boolean;
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

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers();
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (!options.anonymous) {
    const token = await getAccessToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const envelope = (payload ?? {}) as ApiErrorEnvelope;
    const details = Array.isArray(envelope.error?.details)
      ? envelope.error.details
      : undefined;
    throw new ApiError(
      response.status,
      envelope.error?.code ?? "UNKNOWN",
      envelope.error?.message ?? `Request failed with ${response.status}`,
      details,
    );
  }

  return payload as T;
}
