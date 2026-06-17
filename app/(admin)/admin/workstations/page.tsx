import { requireRestaurantAdmin } from "@/lib/auth/guards";
import { getWorkstations } from "@/app/actions/workstations";
import { WorkstationsClient } from "./_components/workstations-client";

export default async function WorkstationsPage() {
  const { restaurantUser } = await requireRestaurantAdmin();
  const workstations = await getWorkstations(restaurantUser.restaurant_id);

  return (
    <div className="p-8">
      <h1
        className="text-xl mb-1"
        style={{ color: "var(--color-ink)", fontWeight: 300, letterSpacing: "-0.4px" }}
      >
        Workstations
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-ink-mute)" }}>
        Stations where orders are prepared — Kitchen, Bar, Grill, etc. Menu items route to their
        workstation when ordered.
      </p>

      <WorkstationsClient
        workstations={workstations}
        restaurantId={restaurantUser.restaurant_id}
      />
    </div>
  );
}
