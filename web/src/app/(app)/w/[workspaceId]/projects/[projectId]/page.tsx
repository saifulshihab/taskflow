"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { projectPath } from "@/lib/project-paths";

export default function LegacyProjectBoardRedirect() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = String(params.workspaceId);
  const projectId = String(params.projectId);

  useEffect(() => {
    router.replace(projectPath(workspaceId, projectId, "board"));
  }, [projectId, router, workspaceId]);

  return null;
}
