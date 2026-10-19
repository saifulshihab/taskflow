"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { setStoredBoardProjectId } from "@/lib/board-project-storage";
import { useProject } from "@/lib/queries";

export default function ProjectScopeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const workspaceId = String(params.workspaceId);
  const projectId = String(params.projectId);

  const projectQuery = useProject(projectId);

  useEffect(() => {
    setStoredBoardProjectId(workspaceId, projectId);
  }, [workspaceId, projectId]);

  useEffect(() => {
    if (projectQuery.isError) {
      router.replace(`/w/${workspaceId}/board`);
    }
  }, [projectQuery.isError, router, workspaceId]);

  if (projectQuery.isPending) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
        Loading project…
      </div>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
        Redirecting…
      </div>
    );
  }

  if (projectQuery.data.workspaceId !== workspaceId) {
    notFound();
  }

  return children;
}
