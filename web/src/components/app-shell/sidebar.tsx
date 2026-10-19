"use client";

import {
  ActivityIcon,
  KanbanIcon,
  ListChecksIcon,
  SettingsIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { ProjectSwitcher } from "@/components/projects/project-switcher";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe, useWorkspace, useWorkspaces } from "@/lib/queries";
import {
  parseProjectIdFromPathname,
  projectPath,
} from "@/lib/project-paths";
import { can } from "@/lib/rbac";
import { NavLink } from "./nav-link";
import { UserMenu } from "./user-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";

function navItems(workspaceId: string, projectId: string | undefined) {
  const base = `/w/${workspaceId}`;
  if (projectId) {
    return [
      {
        href: projectPath(workspaceId, projectId, "board"),
        label: "Board",
        icon: KanbanIcon,
        exact: false,
      },
      {
        href: projectPath(workspaceId, projectId, "tasks"),
        label: "Tasks",
        icon: ListChecksIcon,
      },
      {
        href: projectPath(workspaceId, projectId, "labels"),
        label: "Labels",
        icon: TagIcon,
      },
      {
        href: projectPath(workspaceId, projectId, "members"),
        label: "Members",
        icon: UsersIcon,
      },
      { href: `${base}/activity`, label: "Activity", icon: ActivityIcon },
    ];
  }
  return [
    { href: `${base}/board`, label: "Board", icon: KanbanIcon, exact: false },
    { href: `${base}/tasks`, label: "Tasks", icon: ListChecksIcon },
    { href: `${base}/labels`, label: "Labels", icon: TagIcon },
    { href: `${base}/members`, label: "Members", icon: UsersIcon },
    { href: `${base}/activity`, label: "Activity", icon: ActivityIcon },
  ];
}

export function SidebarContent({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const projectId = parseProjectIdFromPathname(pathname ?? "");

  const workspaceQuery = useWorkspace(workspaceId);
  const workspacesQuery = useWorkspaces({ pageSize: 100 });
  const meQuery = useMe();

  if (
    workspaceQuery.isPending ||
    workspacesQuery.isPending ||
    meQuery.isPending
  ) {
    return <SidebarSkeleton />;
  }

  if (
    workspaceQuery.isError ||
    workspacesQuery.isError ||
    meQuery.isError ||
    !workspaceQuery.data ||
    !meQuery.data
  ) {
    return (
      <p className="text-destructive p-2 text-sm">Could not load navigation.</p>
    );
  }

  const workspace = workspaceQuery.data;
  const showSettings = can(workspace.role, "ADMIN");
  const items = navItems(workspaceId, projectId);

  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <WorkspaceSwitcher
        current={workspace}
        workspaces={workspacesQuery.data?.data ?? []}
      />

      <ProjectSwitcher
        workspaceId={workspaceId}
        currentProjectId={projectId}
      />

      <nav className="flex flex-1 flex-col gap-0.5">
        {items.map((item) => (
          <NavLink key={item.href} href={item.href} exact={item.exact}>
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
        {showSettings && (
          <NavLink href={`/w/${workspaceId}/settings`}>
            <SettingsIcon className="size-4" />
            Settings
          </NavLink>
        )}
      </nav>

      <UserMenu user={meQuery.data} />
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-1 flex-col gap-1 pt-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-7 w-full" />
        ))}
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
