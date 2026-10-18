"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MobileNavFallback />}>
      <MobileNavSheet>{children}</MobileNavSheet>
    </Suspense>
  );
}

function MobileNavFallback() {
  return (
    <Button variant="ghost" size="icon" aria-label="Open menu" disabled>
      <MenuIcon />
    </Button>
  );
}

function MobileNavSheet({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState({ pathname, open: false });
  const open = menu.pathname === pathname && menu.open;

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => setMenu({ pathname, open: nextOpen })}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" aria-label="Open menu" />}
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 gap-0 p-0 sm:max-w-64">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}

