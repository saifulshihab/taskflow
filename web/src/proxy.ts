import { NextResponse, type NextRequest } from "next/server";

/** Auth is enforced on the client via localStorage tokens and AuthGuard. */
export async function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
