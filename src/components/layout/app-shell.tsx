"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import type { Role } from "@prisma/client";

export interface ShellUser {
  name: string;
  email: string;
  role: Role;
}

export function AppShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar lg:flex">
        <div className="flex h-14 items-center border-b border-white/10 px-4">
          <Logo />
        </div>
        <ScrollArea className="flex-1">
          <SidebarNav role={user.role} />
        </ScrollArea>
        <div className="border-t border-white/10 px-4 py-3 text-[11px] text-slate-500">
          VerdantIQ · ESG Platform
        </div>
      </aside>

      {/* Topbar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-header px-3 sm:px-4 lg:pl-[17rem]">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-14 items-center border-b border-white/10 px-4">
              <Logo />
            </div>
            <ScrollArea className="h-[calc(100dvh-3.5rem)]">
              <SidebarNav role={user.role} onNavigate={() => setMobileOpen(false)} />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <div className="lg:hidden">
          <Logo />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <NotificationBell />
          <div className="mx-1 h-6 w-px bg-white/10" />
          <UserMenu name={user.name} email={user.email} role={user.role} />
        </div>
      </header>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
