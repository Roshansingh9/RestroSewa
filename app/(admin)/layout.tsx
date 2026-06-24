import { requireRestaurantStaff } from "@/lib/auth/guards";
import { createServiceClient } from "@/lib/supabase/service";
import { AdminSidebar } from "./admin/_components/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Layout allows any active staff member — individual pages guard their own permissions.
  const { restaurantUser } = await requireRestaurantStaff();

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: restaurant } = await (service as any)
    .from("restaurants")
    .select("name")
    .eq("id", restaurantUser.restaurant_id)
    .single();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-canvas-soft)" }}>
      <AdminSidebar restaurantName={restaurant?.name ?? "Restaurant"} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
