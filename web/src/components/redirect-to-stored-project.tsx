"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getStoredBoardProjectId } from "@/lib/board-project-storage";
import {
  projectPath,
  type ProjectSection,
} from "@/lib/project-paths";

export function RedirectToStoredProject({
  workspaceId,
  section,
}: {
  workspaceId: string;
  section: ProjectSection;
}) {
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredBoardProjectId(workspaceId);
    if (stored) {
      router.replace(projectPath(workspaceId, stored, section));
    } else {
      router.replace(`/w/${workspaceId}/board`);
    }
  }, [router, section, workspaceId]);

  return (
    <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center text-sm">
      Redirecting…
    </div>
  );
}
