"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "◊" },
  { href: "/admin/connectors", label: "Connectors", icon: "⚡" },
  { href: "/admin/users", label: "Users", icon: "●" },
  { href: "/admin/permissions", label: "Permissions", icon: "◈" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "☰" },
  { href: "/admin/setup", label: "Setup Guide", icon: "?" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      <div className="border-b px-4 py-4">
        <h1 className="text-sm font-semibold tracking-tight">
          Einstellen Connect
        </h1>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <span className="w-4 text-center text-xs">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
