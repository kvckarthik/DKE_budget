"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/dashboard",          label: "Dashboard",   icon: "📊" },
  { href: "/dashboard/budget",   label: "Budget",      icon: "📋" },
  { href: "/dashboard/dues",     label: "Dues",        icon: "💰", treasurerOnly: true },
  { href: "/dashboard/my-dues",  label: "My Dues",     icon: "💳", memberOnly: true },
  { href: "/dashboard/expenses", label: "Expenses",    icon: "🧾" },
  { href: "/dashboard/members",  label: "Members",     icon: "👥", treasurerOnly: true },
  { href: "/dashboard/reports",  label: "Reports",     icon: "📄", treasurerOnly: true },
  { href: "/dashboard/settings", label: "Settings",    icon: "⚙️" },
];

interface SidebarProps {
  role: string;
  chapterName: string;
}

export function Sidebar({ role, chapterName }: SidebarProps) {
  const pathname = usePathname();
  const isTreasurer = ["treasurer", "chapter_admin", "national_admin"].includes(role);

  const links = NAV.filter(n => {
    if (n.treasurerOnly && !isTreasurer) return false;
    if (n.memberOnly && isTreasurer) return false;
    return true;
  });

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen sticky top-0 border-r border-white/8"
      style={{ background: "#080d1a" }}>
      {/* Logo */}
      <div className="p-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "#C9A84C", color: "#0D1B3E", fontFamily: "Georgia, serif" }}>
            ΔΚΕ
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: "#C9A84C" }}>
              {chapterName}
            </div>
            <div className="text-xs text-muted-foreground capitalize">{role.replace("_", " ")}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: active ? "rgba(201,168,76,0.12)" : "transparent",
                color: active ? "#C9A84C" : "#9ca3af",
              }}>
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/8 flex items-center gap-3">
        <UserButton />
        <span className="text-xs text-muted-foreground">Account</span>
      </div>
    </aside>
  );
}
