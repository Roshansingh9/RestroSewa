"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import type { StaffRow } from "@/app/actions/restaurants";
import { EditPermissionsForm } from "./edit-permissions-form";

function Badge({
  children,
  color = "var(--color-ink-mute)",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border"
      style={{
        color,
        borderColor: color + "44",
        background: color + "11",
        fontSize: 11,
      }}
    >
      {children}
    </span>
  );
}

function StaffCard({
  s,
  restaurantSlug,
  restaurantId,
  onEdit,
}: {
  s: StaffRow;
  restaurantSlug: string;
  restaurantId: string;
  onEdit: (s: StaffRow) => void;
}) {
  const initials = s.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const safePermissions = Array.isArray(s.permissions) ? s.permissions : [];

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-lg border"
      style={{ background: "var(--color-canvas)", borderColor: "var(--color-hairline)" }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
        style={{ background: "var(--color-canvas-soft)", color: "var(--color-ink-mute)" }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-ink)" }}>
          {s.display_name}
        </p>
        {s.title && (
          <p className="text-xs truncate" style={{ color: "var(--color-ink-mute)" }}>
            {s.title}
          </p>
        )}
      </div>

      <Badge color={s.role === "restaurant_admin" ? "var(--color-primary)" : "var(--color-ink-mute)"}>
        {s.role === "restaurant_admin" ? "Admin" : "Staff"}
      </Badge>

      {/* Permission count badge — employees only */}
      {s.role === "restaurant_employee" && (
        <button
          type="button"
          title={`${safePermissions.length} permissions — click to edit`}
          onClick={() => onEdit(s)}
          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors"
          style={{
            borderColor: safePermissions.length > 0 ? "#1a7a4a44" : "var(--color-hairline)",
            background: safePermissions.length > 0 ? "#f0fdf4" : "var(--color-canvas-soft)",
            color: safePermissions.length > 0 ? "#1a7a4a" : "var(--color-ink-mute)",
          }}
        >
          <ShieldCheck size={11} />
          {safePermissions.length}
        </button>
      )}

      <div
        className="w-2 h-2 rounded-full shrink-0"
        title={s.auth_user_id ? "Has login" : "No auth account"}
        style={{ background: s.auth_user_id ? "#1a7a4a" : "#d1d5db" }}
      />

      {s.auth_user_id && (
        <Link
          href={`/login?mode=staff&slug=${restaurantSlug}`}
          target="_blank"
          className="text-xs shrink-0"
          style={{ color: "var(--color-ink-mute)" }}
        >
          <ExternalLink size={13} />
        </Link>
      )}
    </div>
  );
}

export function StaffSection({
  staff,
  restaurantSlug,
  restaurantId,
}: {
  staff: StaffRow[];
  restaurantSlug: string;
  restaurantId: string;
}) {
  const [editingStaff, setEditingStaff] = useState<StaffRow | null>(null);

  const admins    = staff.filter((s) => s.role === "restaurant_admin");
  const employees = staff.filter((s) => s.role === "restaurant_employee");

  return (
    <>
      {editingStaff && (
        <EditPermissionsForm
          staffId={editingStaff.id}
          staffName={editingStaff.display_name}
          restaurantId={restaurantId}
          initialPermissions={Array.isArray(editingStaff.permissions) ? editingStaff.permissions : []}
          onClose={() => setEditingStaff(null)}
        />
      )}

      <div className="flex flex-col gap-4">
        {admins.length > 0 && (
          <div>
            <p
              className="text-xs uppercase tracking-wide mb-2"
              style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
            >
              Admins
            </p>
            <div className="flex flex-col gap-1.5">
              {admins.map((s) => (
                <StaffCard
                  key={s.id}
                  s={s}
                  restaurantSlug={restaurantSlug}
                  restaurantId={restaurantId}
                  onEdit={setEditingStaff}
                />
              ))}
            </div>
          </div>
        )}

        {employees.length > 0 && (
          <div>
            <p
              className="text-xs uppercase tracking-wide mb-2"
              style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
            >
              Staff
            </p>
            <div className="flex flex-col gap-1.5">
              {employees.map((s) => (
                <StaffCard
                  key={s.id}
                  s={s}
                  restaurantSlug={restaurantSlug}
                  restaurantId={restaurantId}
                  onEdit={setEditingStaff}
                />
              ))}
            </div>
          </div>
        )}

        {staff.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-ink-mute)" }}>
            No staff yet. Add the restaurant admin first.
          </p>
        )}
      </div>
    </>
  );
}
