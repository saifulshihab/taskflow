"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { hasSession } from "@/lib/auth-storage";

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    const authed = hasSession();

    if (!authed && !isPublic) {
      const next = `${pathname}${searchParams.size ? `?${searchParams}` : ""}`;
      router.replace(
        next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`,
      );
      return;
    }

    if (authed && isPublic) {
      router.replace("/");
      return;
    }

    setReady(true);
  }, [pathname, router, searchParams]);

  if (!ready) {
    return (
      <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
        Loading…
      </div>
    );
  }

  return children;
}
