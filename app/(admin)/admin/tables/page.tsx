import { requireAdminOrPermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { getTablesWithGroups, getRestaurantSlug } from "@/app/actions/tables-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { TablesClient } from "./_components/tables-client";

export type EmployeeOption = { id: string; display_name: string };

export default async function TablesPage() {
  const { restaurantUser } = await requireAdminOrPermission(PERMISSIONS.MANAGE_TABLES);
  const service = createServiceClient();

  const [{ ungrouped, groups }, restaurantSlug, employeesResult] = await Promise.all([
    getTablesWithGroups(restaurantUser.restaurant_id),
    getRestaurantSlug(restaurantUser.restaurant_id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any)
      .from("restaurant_users")
      .select("id, display_name")
      .eq("restaurant_id", restaurantUser.restaurant_id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("display_name"),
  ]);

  const employees: EmployeeOption[] = (employeesResult.data as EmployeeOption[]) ?? [];

  return (
    <div className="p-4 md:p-8">
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
        employees={employees}
      />
    </div>
  );
}
