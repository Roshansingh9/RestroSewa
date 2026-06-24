import { requireAdminOrPermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/permissions";
import { getRoomTypesWithRooms } from "@/app/actions/rooms-admin";
import { getRestaurantSlug } from "@/app/actions/tables-admin";
import { RoomsClient } from "./_components/rooms-client";

export default async function RoomsPage() {
  const { restaurantUser } = await requireAdminOrPermission(PERMISSIONS.MANAGE_ROOMS);
  const { restaurant_id } = restaurantUser;

  const [{ types, totalRooms }, restaurantSlug] = await Promise.all([
    getRoomTypesWithRooms(restaurant_id),
    getRestaurantSlug(restaurant_id),
  ]);

  return (
    <div className="p-8">
      <h1
        className="text-xl mb-1"
        style={{ color: "var(--color-ink)", fontWeight: 300, letterSpacing: "-0.4px" }}
      >
        Rooms
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-ink-mute)" }}>
        Manage room types and individual rooms. Each room gets a unique QR code for guest ordering.
      </p>

      <RoomsClient
        types={types}
        totalRooms={totalRooms}
        restaurantId={restaurant_id}
        restaurantSlug={restaurantSlug ?? ""}
      />
    </div>
  );
}
