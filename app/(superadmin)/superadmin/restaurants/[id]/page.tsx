import Link from "next/link";
import { notFound } from "next/navigation";
import { getRestaurantWithStaff } from "@/app/actions/restaurants";
import type { StaffRow } from "@/app/actions/restaurants";
import { AddStaffForm } from "./_components/add-staff-form";
import { ChevronLeft, ExternalLink } from "lucide-react";

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

function StaffCard({ s, restaurantSlug }: { s: StaffRow; restaurantSlug: string }) {
  const initials = s.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-lg border"
      style={{
        background: "var(--color-canvas)",
        borderColor: "var(--color-hairline)",
      }}
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

      <Badge
        color={s.role === "restaurant_admin" ? "var(--color-primary)" : "var(--color-ink-mute)"}
      >
        {s.role === "restaurant_admin" ? "Admin" : "Staff"}
      </Badge>

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

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getRestaurantWithStaff(id);

  if (!result) notFound();

  const { restaurant: r, staff } = result;

  const admins = staff.filter((s) => s.role === "restaurant_admin");
  const employees = staff.filter((s) => s.role === "restaurant_employee");

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/superadmin/dashboard"
        className="inline-flex items-center gap-1.5 text-sm mb-6"
        style={{ color: "var(--color-ink-mute)" }}
      >
        <ChevronLeft size={14} />
        Restaurants
      </Link>

      <div
        className="rounded-xl border px-6 py-5 mb-6"
        style={{
          background: "var(--color-canvas)",
          borderColor: "var(--color-hairline)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-xl"
              style={{
                color: "var(--color-ink)",
                fontWeight: 300,
                letterSpacing: "-0.4px",
              }}
            >
              {r.name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-ink-mute)" }}>
              /c/{r.slug}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <Badge color={r.is_active ? "#1a7a4a" : "#d1d5db"}>
              {r.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge>{r.type}</Badge>
            <Badge
              color={
                r.subscription_tier === "pro"
                  ? "var(--color-primary)"
                  : r.subscription_tier === "basic"
                  ? "#1a7a4a"
                  : "var(--color-ink-mute)"
              }
            >
              {r.subscription_tier.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div
          className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm"
          style={{ borderColor: "var(--color-hairline)" }}
        >
          <div>
            <p style={{ color: "var(--color-ink-mute)", fontSize: 11 }}>CUSTOMER URL</p>
            <Link
              href={`/c/${r.slug}`}
              target="_blank"
              className="flex items-center gap-1 mt-0.5"
              style={{ color: "var(--color-primary)" }}
            >
              /c/{r.slug} <ExternalLink size={11} />
            </Link>
          </div>
          <div>
            <p style={{ color: "var(--color-ink-mute)", fontSize: 11 }}>STAFF LOGIN</p>
            <Link
              href={`/login?mode=staff&slug=${r.slug}`}
              target="_blank"
              className="flex items-center gap-1 mt-0.5"
              style={{ color: "var(--color-primary)" }}
            >
              /login?mode=staff&amp;slug={r.slug} <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-base"
            style={{ color: "var(--color-ink)", fontWeight: 400 }}
          >
            Staff members
            <span
              className="ml-2 text-sm"
              style={{ color: "var(--color-ink-mute)" }}
            >
              ({staff.length})
            </span>
          </h2>
        </div>

        <div className="flex flex-col gap-4 mb-6">
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
                  <StaffCard key={s.id} s={s} restaurantSlug={r.slug} />
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
                  <StaffCard key={s.id} s={s} restaurantSlug={r.slug} />
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

        <AddStaffForm restaurantId={r.id} />
      </div>
    </div>
  );
}
