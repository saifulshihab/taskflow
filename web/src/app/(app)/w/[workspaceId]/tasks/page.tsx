"use client";

import { useParams } from "next/navigation";
import { RedirectToStoredProject } from "@/components/redirect-to-stored-project";

export default function WorkspaceTasksRedirectPage() {
  const params = useParams();
  const workspaceId = String(params.workspaceId);

  return <RedirectToStoredProject workspaceId={workspaceId} section="tasks" />;
}
