// Shared by proxy.ts and the server-only session module, so it must not import
// next/headers or anything marked server-only.

export const ACCESS_COOKIE = "tf_access";
export const REFRESH_COOKIE = "tf_refresh";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: THIRTY_DAYS,
} as const;

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Reads `exp` from a JWT without verifying it. Verification is the API's job;
 * this only decides when to refresh ahead of expiry.
 */
export function expiresAt(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isExpiringSoon(token: string, withinMs = 60_000) {
  const expiry = expiresAt(token);
  if (expiry === null) return true;
  return expiry - Date.now() <= withinMs;
}
