import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  cookieOptions,
  isExpiringSoon,
  type Tokens,
} from "@/lib/tokens";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";
const PUBLIC_PATHS = ["/login", "/register"];

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

const redirectToLogin = (request: NextRequest, clearCookies: boolean) => {
  const url = new URL("/login", request.url);
  const { pathname, search } = request.nextUrl;
  if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);

  const response = NextResponse.redirect(url);
  if (clearCookies) {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }
  return response;
};

const refreshTokens = async (refreshToken: string): Promise<Tokens | null> => {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { tokens?: Tokens };
    return payload.tokens ?? null;
  } catch {
    return null;
  }
};

/**
 * Access tokens live 15 minutes, so they are refreshed here rather than on a
 * 401: Server Components can read cookies but cannot set them, so a refresh
 * triggered during render could never be persisted.
 */
export async function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const onPublicPath = isPublic(request.nextUrl.pathname);

  if (!refreshToken) {
    return onPublicPath ? NextResponse.next() : redirectToLogin(request, false);
  }

  if (accessToken && !isExpiringSoon(accessToken)) {
    return onPublicPath
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  const tokens = await refreshTokens(refreshToken);
  if (!tokens) return redirectToLogin(request, true);

  // Update the inbound cookies too, so this same render sees the fresh token
  // rather than the expired one it arrived with.
  request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
  request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);

  const response = onPublicPath
    ? NextResponse.redirect(new URL("/", request.url))
    : NextResponse.next({ request: { headers: request.headers } });

  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions);
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions);
  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals, static assets and the favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
