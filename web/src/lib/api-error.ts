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

  get fieldErrors(): Record<string, string> {
    const entries = (this.details ?? []).map(
      (detail) => [detail.path, detail.message] as const,
    );
    return Object.fromEntries(entries);
  }
}

export function parseApiError(response: Response, payload: unknown): ApiError {
  const envelope = (payload ?? {}) as ApiErrorEnvelope;
  const details = Array.isArray(envelope.error?.details)
    ? envelope.error.details
    : undefined;
  return new ApiError(
    response.status,
    envelope.error?.code ?? "UNKNOWN",
    envelope.error?.message ?? `Request failed with ${response.status}`,
    details,
  );
}
