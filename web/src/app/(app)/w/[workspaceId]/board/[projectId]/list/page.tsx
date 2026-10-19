"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { projectPath } from "@/lib/project-paths";

export default function LegacyBoardListRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = String(params.workspaceId);
  const projectId = String(params.projectId);

  useEffect(() => {
    router.replace(projectPath(workspaceId, projectId, "board/list"));
  }, [router, workspaceId, projectId]);

  return (
    <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
      Redirecting…
    </div>
  );
}
