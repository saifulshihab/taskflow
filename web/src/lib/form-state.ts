import { ApiError } from "./api";

export interface FormState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Server Actions surface failures as state instead of exceptions; anything that
 * is not an API error is a real bug and keeps bubbling to the error boundary.
 */
export function toFormState(error: unknown): FormState {
  if (error instanceof ApiError) {
    return { error: error.message, fieldErrors: error.fieldErrors };
  }
  throw error;
}

export const field = (formData: FormData, name: string) =>
  String(formData.get(name) ?? "").trim();

/** Empty strings from untouched inputs should not clobber values. */
export const optionalField = (formData: FormData, name: string) =>
  field(formData, name) || undefined;

/** Empty strings on nullable fields mean "clear it". */
export const nullableField = (formData: FormData, name: string) =>
  field(formData, name) || null;
