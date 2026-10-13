import { Suspense } from "react";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { SidebarContent, SidebarSkeleton } from "@/components/app-shell/sidebar";

export default async function WorkspaceLayout({
  children,
  params,
}: LayoutProps<"/w/[workspaceId]">) {
  const { workspaceId } = await params;

  // The sidebar reads cookies, so it stays behind Suspense to keep the rest of
  // the shell prerenderable.
  const sidebar = (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarContent workspaceId={workspaceId} />
    </Suspense>
  );

  return (
    <div className="flex min-h-svh">
      <aside className="bg-sidebar hidden w-60 shrink-0 border-r md:block">
        <div className="sticky top-0 h-svh">{sidebar}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-40 flex h-12 items-center gap-2 border-b px-2 backdrop-blur md:hidden">
          <MobileNav>{sidebar}</MobileNav>
          <span className="font-heading text-sm font-medium">TaskFlow</span>
        </header>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
