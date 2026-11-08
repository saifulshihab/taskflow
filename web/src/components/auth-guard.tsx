"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { hasSession } from "@/lib/auth-storage";
const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
};
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    router = useRouter(),
    search = useSearchParams();
  const authed = useSyncExternalStore(subscribe, hasSession, () => false);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isPublic = ["/login", "/register"].some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  useEffect(() => {
    if (!hydrated) return;
    if (!authed && !isPublic) {
      const next = pathname + (search.size ? "?" + search : "");
      router.replace(
        next === "/" ? "/login" : "/login?next=" + encodeURIComponent(next),
      );
    } else if (authed && isPublic) router.replace("/");
  }, [authed, isPublic, hydrated, pathname, search, router]);
  if (!hydrated || (!authed && !isPublic) || (authed && isPublic))
    return (
      <div className="flex min-h-svh items-center justify-center text-sm">
        Loading...
      </div>
    );
  return children;
}
