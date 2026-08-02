"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/explore", label: "Overview" },
  { href: "/explore/browse", label: "Browse Data" },
  { href: "/explore/by-make", label: "By Make" },
  { href: "/explore/by-body-style", label: "By Body Style" },
  { href: "/explore/trends", label: "Trends Over Time" },
];

interface SidebarProps {
  onNavClick?: () => void;
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col gap-6 p-4">
      <Link
        href="/"
        onClick={onNavClick}
        className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
      >
        <BarChart3 className="h-6 w-6 text-primary" />
        <span>HCMU Explorer</span>
      </Link>
      <div className="px-1 text-xs text-muted-foreground leading-relaxed">
        National vehicle insurance rate indexes from the Insurance Bureau of Canada.
        <br />
        <span className="text-[10px]">100 = average claim cost</span>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavClick}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}