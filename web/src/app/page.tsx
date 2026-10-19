"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWorkspaces } from "@/lib/queries";

export default function HomePage() {
  const router = useRouter();
  const { data, isPending, isError } = useWorkspaces({ pageSize: 1 });

  useEffect(() => {
    if (isPending) return;
    if (isError) {
      router.replace("/workspaces");
      return;
    }
    const first = data?.data[0];
    router.replace(first ? `/w/${first.id}` : "/workspaces");
  }, [data, isError, isPending, router]);

  return (
    <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
      Loading…
    </div>
  );
}
