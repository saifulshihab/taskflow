"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
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
import type { Workspace } from "@/lib/api-types";

export function WorkspaceSwitcher({
  current,
  workspaces,
}: {
  current: Workspace;
  workspaces: Workspace[];
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-auto w-full justify-between px-2 py-1.5"
          />
        }
      >
        <span className="min-w-0 text-left">
          <span className="block truncate text-sm font-medium">
            {current.name}
          </span>
          <span className="text-muted-foreground block truncate text-xs">
            {current.role.toLowerCase()}
          </span>
        </span>
        <ChevronsUpDownIcon className="text-muted-foreground size-4 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => router.push(`/w/${workspace.id}/board`)}
            >
              <span className="truncate">{workspace.name}</span>
              {workspace.id === current.id && (
                <span className="text-muted-foreground ml-auto text-xs">
                  current
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/workspaces")}>
            <PlusIcon />
            Manage workspaces
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
