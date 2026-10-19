"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getStoredBoardProjectId,
  setStoredBoardProjectId,
} from "@/lib/board-project-storage";
import { useProjects } from "@/lib/queries";

export default function BoardPickerPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = String(params.workspaceId);

  const { data, isPending, isError } = useProjects(workspaceId, {
    pageSize: 100,
    includeArchived: false,
  });

  useEffect(() => {
    if (isPending || isError || !data) return;

    const projects = data.data;
    if (projects.length === 0) return;

    const stored = getStoredBoardProjectId(workspaceId);
    const match = stored ? projects.find((p) => p.id === stored) : undefined;
    const target = match ?? projects[0];
    setStoredBoardProjectId(workspaceId, target.id);
    router.replace(
      `/w/${workspaceId}/p/${target.id}/board`,
    );
  }, [data, isError, isPending, router, workspaceId]);

  if (isPending) {
    return <Skeleton className="m-6 h-64 w-full" />;
  }

  if (isError) {
    return (
      <p className="text-destructive p-6 text-sm">Could not load projects.</p>
    );
  }

  if (!data || data.data.length > 0) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center text-sm">
        Opening board…
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Board"
        description="Pick a project from the sidebar to view its board."
      />
      <div className="p-4 md:p-6">
        <EmptyState
          title="No projects yet"
          description="Create a project to start using the board."
        >
          <Link
            href={`/w/${workspaceId}/projects`}
            className={buttonVariants({ size: "sm" })}
          >
            Manage projects
          </Link>
        </EmptyState>
      </div>
    </>
  );
}
