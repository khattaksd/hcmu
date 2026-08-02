"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-64 shrink-0 border-r bg-muted/30 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile sidebar — Sheet drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="md:hidden"
          render={
            <Button
              variant="outline"
              size="icon"
              className="fixed top-3 left-3 z-40 shrink-0 shadow-sm"
            />
          }
        >
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar onNavClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 pt-20 md:pt-6">{children}</main>
    </div>
  );
}