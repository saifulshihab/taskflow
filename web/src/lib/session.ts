import "server-only";
import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  cookieOptions,
  type Tokens,
} from "./tokens";

/** Only callable from Server Actions and Route Handlers. */
export async function setSession(tokens: Tokens) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions);
  store.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions);
}

export async function clearSession() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessToken() {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken() {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}

export async function isAuthenticated() {
  return (await getRefreshToken()) !== undefined;
}
