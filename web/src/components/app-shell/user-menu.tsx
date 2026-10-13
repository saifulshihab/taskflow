"use client";

import { LogOutIcon, MoreHorizontalIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/actions/auth";
import type { CurrentUser } from "@/lib/api-types";
import { initials } from "@/lib/format";

export function UserMenu({ user }: { user: CurrentUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-auto w-full justify-start gap-2 px-2 py-1.5"
          />
        }
      >
        <Avatar className="size-6">
          <AvatarFallback className="text-[10px]">
            {initials(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-left text-sm">
          {user.name}
        </span>
        <MoreHorizontalIcon className="text-muted-foreground size-4 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => void logoutAction()}
          >
            <LogOutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
