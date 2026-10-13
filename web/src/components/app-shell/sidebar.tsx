import {
  ActivityIcon,
  FolderKanbanIcon,
  ListChecksIcon,
  SettingsIcon,
  TagIcon,
  UsersIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getMe, getWorkspace, listWorkspaces } from "@/lib/data";
import { NavLink } from "./nav-link";
import { UserMenu } from "./user-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";

function navItems(workspaceId: string) {
  const base = `/w/${workspaceId}`;
  return [
    { href: base, label: "Projects", icon: FolderKanbanIcon, exact: true },
    { href: `${base}/tasks`, label: "Tasks", icon: ListChecksIcon },
    { href: `${base}/labels`, label: "Labels", icon: TagIcon },
    { href: `${base}/members`, label: "Members", icon: UsersIcon },
    { href: `${base}/activity`, label: "Activity", icon: ActivityIcon },
    { href: `${base}/settings`, label: "Settings", icon: SettingsIcon },
  ];
}

export async function SidebarContent({ workspaceId }: { workspaceId: string }) {
  const [workspace, workspaces, me] = await Promise.all([
    getWorkspace(workspaceId),
    listWorkspaces({ pageSize: 100 }),
    getMe(),
  ]);

  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <WorkspaceSwitcher current={workspace} workspaces={workspaces.data} />

      <nav className="flex flex-1 flex-col gap-0.5">
        {navItems(workspaceId).map((item) => (
          <NavLink key={item.href} href={item.href} exact={item.exact}>
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <UserMenu user={me} />
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-1 flex-col gap-1 pt-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-7 w-full" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
