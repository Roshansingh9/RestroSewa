import { requireAdminOrPermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { getTablesWithGroups, getRestaurantSlug } from "@/app/actions/tables-admin";
import { TablesClient } from "./_components/tables-client";

export default async function TablesPage() {
  const { restaurantUser } = await requireAdminOrPermission(PERMISSIONS.MANAGE_TABLES);
  const [{ ungrouped, groups }, restaurantSlug] = await Promise.all([
    getTablesWithGroups(restaurantUser.restaurant_id),
    getRestaurantSlug(restaurantUser.restaurant_id),
  ]);

  return (
    <div className="p-8">
      <h1
        className="text-xl mb-1"
        style={{ color: "var(--color-ink)", fontWeight: 300, letterSpacing: "-0.4px" }}
      >
        Tables
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-ink-mute)" }}>
        Each table gets a unique QR code. Scan it to open the customer menu or call staff.
      </p>

      <TablesClient
        ungrouped={ungrouped}
        groups={groups}
        restaurantId={restaurantUser.restaurant_id}
        restaurantSlug={restaurantSlug ?? ""}
      />
    </div>
  );
}
