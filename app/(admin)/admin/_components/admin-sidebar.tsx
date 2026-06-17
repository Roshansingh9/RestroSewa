"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logout } from "@/app/actions/auth";
import {
  LayoutDashboard,
  BookOpen,
  LayoutGrid,
  Zap,
  Users,
  LogOut,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",    href: "/admin/dashboard",     icon: LayoutDashboard, exact: true },
  { label: "Menu",         href: "/admin/menu",           icon: BookOpen,        exact: false },
  { label: "Tables",       href: "/admin/tables",         icon: LayoutGrid,      exact: false },
  { label: "Workstations", href: "/admin/workstations",   icon: Zap,             exact: false },
  { label: "Staff",        href: "/admin/staff",          icon: Users,           exact: false },
];

export function AdminSidebar({ restaurantName }: { restaurantName: string }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <aside
      className="w-52 shrink-0 flex flex-col min-h-screen"
      style={{ background: "var(--color-brand-dark)" }}
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <Link href="/admin/dashboard" className="block">
          <span
            className="text-base tracking-tight"
            style={{ color: "#fff", fontWeight: 300, letterSpacing: "-0.3px" }}
          >
            Restro<span style={{ color: "var(--color-primary-soft)", fontWeight: 500 }}>Sewa</span>
          </span>
        </Link>
        <p
          className="text-xs mt-1 truncate"
          style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0" }}
        >
          {restaurantName}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV.map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                color: active ? "#fff" : "rgba(255,255,255,0.5)",
                background: active ? "rgba(255,255,255,0.1)" : "transparent",
                fontWeight: active ? 400 : 300,
              }}
            >
              <Icon size={15} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => { await logout(); })}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <LogOut size={15} strokeWidth={1.5} />
          {pending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
