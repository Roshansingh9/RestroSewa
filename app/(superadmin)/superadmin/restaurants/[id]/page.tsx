import Link from "next/link";
import { notFound } from "next/navigation";
import { getRestaurantWithStaff } from "@/app/actions/restaurants";
import { AddStaffForm } from "./_components/add-staff-form";
import { StaffSection } from "./_components/staff-section";
import { ChevronLeft, ExternalLink } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  restaurant:        "Restaurant",
  hotel:             "Hotel",
  restaurant_hotel:  "Restaurant + Hotel",
  cafe:              "Café",
  lodge:             "Lodge",
  guesthouse:        "Guesthouse",
  resort:            "Resort",
};

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

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getRestaurantWithStaff(id);

  if (!result) notFound();

  const { restaurant: r, staff } = result;

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

      {/* Restaurant info card */}
      <div
        className="rounded-xl border px-6 py-5 mb-6"
        style={{ background: "var(--color-canvas)", borderColor: "var(--color-hairline)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-xl"
              style={{ color: "var(--color-ink)", fontWeight: 300, letterSpacing: "-0.4px" }}
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
            <Badge>{TYPE_LABELS[r.type] ?? r.type}</Badge>
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
          {r.max_tables != null && (
            <div>
              <p style={{ color: "var(--color-ink-mute)", fontSize: 11 }}>MAX TABLES</p>
              <p className="mt-0.5" style={{ color: "var(--color-ink)" }}>{r.max_tables}</p>
            </div>
          )}
          {r.max_rooms != null && (
            <div>
              <p style={{ color: "var(--color-ink-mute)", fontSize: 11 }}>MAX ROOMS</p>
              <p className="mt-0.5" style={{ color: "var(--color-ink)" }}>{r.max_rooms}</p>
            </div>
          )}
        </div>
      </div>

      {/* Staff section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-base"
            style={{ color: "var(--color-ink)", fontWeight: 400 }}
          >
            Staff members
            <span className="ml-2 text-sm" style={{ color: "var(--color-ink-mute)" }}>
              ({staff.length})
            </span>
          </h2>
        </div>

        <div className="mb-6">
          <StaffSection
            staff={staff}
            restaurantSlug={r.slug}
            restaurantId={r.id}
          />
        </div>

        <AddStaffForm restaurantId={r.id} />
      </div>
    </div>
  );
}
