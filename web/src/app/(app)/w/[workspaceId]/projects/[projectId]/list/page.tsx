"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function LegacyProjectListRedirect() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = String(params.workspaceId);
  const projectId = String(params.projectId);

  useEffect(() => {
    const query = searchParams.toString();
    const path = `/w/${workspaceId}/board/${projectId}/list`;
    router.replace(query ? `${path}?${query}` : path);
  }, [projectId, router, searchParams, workspaceId]);

  return null;
}
