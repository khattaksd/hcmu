"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";

const links = [
  { href: "/explore", label: "Overview" },
  { href: "/explore/browse", label: "Browse Data" },
  { href: "/explore/by-make", label: "By Make" },
  { href: "/explore/by-body-style", label: "By Body Style" },
  { href: "/explore/trends", label: "Trends Over Time" },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-muted/30 p-4 flex flex-col gap-6">
      <Link href="/" className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity">
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
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}