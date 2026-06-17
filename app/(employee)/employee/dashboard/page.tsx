import { requireRestaurantStaff } from "@/lib/auth/guards";
import { getTableStatusOverview, openWalkInSession } from "@/app/actions/pos";
import type { TableStatus } from "@/app/actions/pos";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function TableCard({ table }: { table: TableStatus }) {
  const occupied = !!table.session_id;
  const href = occupied
    ? `/employee/session/${table.session_id}`
    : `/employee/open-table/${table.id}`;

  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center rounded-xl border aspect-square transition-all"
      style={{
        background: occupied ? "var(--color-primary)" : "var(--color-canvas)",
        borderColor: occupied ? "var(--color-primary)" : "var(--color-hairline)",
      }}
    >
      <span
        className="text-2xl font-light"
        style={{
          color: occupied ? "#fff" : "var(--color-ink)",
          letterSpacing: "-0.5px",
        }}
      >
        {table.number}
      </span>
      {occupied && (
        <span className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
          Active
        </span>
      )}
    </Link>
  );
}

export default async function EmployeeDashboardPage() {
  const { restaurantUser } = await requireRestaurantStaff();
  const tables = await getTableStatusOverview(restaurantUser.restaurant_id);
  const activeSessions = tables.filter((t) => t.session_id).length;

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: "var(--color-ink-mute)" }}>
          {activeSessions} active · {tables.length} tables
        </p>
        <form action={openWalkInSession}>
          <Button type="submit" variant="secondary">
            + Walk-in
          </Button>
        </form>
      </div>

      {tables.length === 0 ? (
        <div
          className="rounded-xl border px-8 py-16 text-center"
          style={{ borderStyle: "dashed", borderColor: "var(--color-hairline)", background: "var(--color-canvas)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-ink-mute)" }}>
            No tables set up yet. Ask your admin to add tables.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {tables.map((t) => (
            <TableCard key={t.id} table={t} />
          ))}
        </div>
      )}
    </div>
  );
}
