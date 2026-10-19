"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDownIcon, FolderKanbanIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project } from "@/lib/api-types";
import { setStoredBoardProjectId } from "@/lib/board-project-storage";
import { useProjects } from "@/lib/queries";

export function ProjectSwitcher({
  workspaceId,
  currentProjectId,
}: {
  workspaceId: string;
  currentProjectId?: string;
}) {
  const router = useRouter();
  const { data, isPending } = useProjects(workspaceId, {
    pageSize: 100,
    includeArchived: false,
  });

  const projects = data?.data ?? [];
  const current = projects.find((p) => p.id === currentProjectId);

  const selectProject = (projectId: string) => {
    setStoredBoardProjectId(workspaceId, projectId);
    router.push(`/w/${workspaceId}/board/${projectId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-auto min-w-48 justify-between gap-2 px-3 py-2"
            disabled={isPending}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2 text-left">
          <FolderKanbanIcon className="text-muted-foreground size-4 shrink-0" />
          <span className="min-w-0 truncate text-sm font-medium">
            {current
              ? `${current.key} · ${current.name}`
              : isPending
                ? "Loading…"
                : "Select project"}
          </span>
        </span>
        <ChevronsUpDownIcon className="text-muted-foreground size-4 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Projects</DropdownMenuLabel>
          {projects.length === 0 && (
            <DropdownMenuItem disabled>No active projects</DropdownMenuItem>
          )}
          {projects.map((project: Project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => selectProject(project.id)}
            >
              <span className="truncate">
                {project.key} · {project.name}
              </span>
              {project.id === currentProjectId && (
                <span className="text-muted-foreground ml-auto text-xs">
                  current
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push(`/w/${workspaceId}/projects`)}
          >
            <FolderKanbanIcon />
            Manage projects
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
