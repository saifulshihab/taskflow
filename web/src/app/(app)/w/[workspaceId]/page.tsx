"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WorkspaceIndexPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = String(params.workspaceId);

  useEffect(() => {
    router.replace(`/w/${workspaceId}/board`);
  }, [router, workspaceId]);

  return (
    <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center text-sm">
      Loading…
    </div>
  );
}
