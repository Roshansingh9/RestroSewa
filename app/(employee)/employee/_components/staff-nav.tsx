"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { logout } from "@/app/actions/auth";
import { LayoutGrid, ListOrdered, LogOut } from "lucide-react";

const NAV = [
  { label: "Tables", href: "/employee/dashboard", icon: LayoutGrid, exact: true },
  { label: "Queue",  href: "/employee/queue", icon: ListOrdered, exact: false },
];

export function StaffNav({
  restaurantName,
  displayName,
}: {
  restaurantName: string;
  displayName: string;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <header
      className="flex items-center gap-4 px-5 py-3 border-b"
      style={{
        background: "var(--color-brand-dark)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex-1 min-w-0">
        <span
          className="text-sm font-medium truncate block"
          style={{ color: "#fff", letterSpacing: "-0.2px" }}
        >
          {restaurantName}
        </span>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          {displayName}
        </span>
      </div>

      <nav className="flex items-center gap-1">
        {NAV.map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                color: active ? "#fff" : "rgba(255,255,255,0.5)",
                background: active ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              <Icon size={14} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await logout(); })}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        <LogOut size={14} strokeWidth={1.5} />
        {pending ? "…" : "Out"}
      </button>
    </header>
  );
}
