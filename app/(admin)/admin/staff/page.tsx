import { requireRestaurantAdmin } from "@/lib/auth/guards";
import { createServiceClient } from "@/lib/supabase/service";
type StaffRow = {
  id: string;
  display_name: string;
  title: string | null;
  role: string;
  is_active: boolean;
  auth_user_id: string | null;
};

export default async function AdminStaffPage() {
  const { restaurantUser } = await requireRestaurantAdmin();
  const { restaurant_id } = restaurantUser;

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staff } = await (service as any)
    .from("restaurant_users")
    .select("id, display_name, title, role, is_active, auth_user_id")
    .eq("restaurant_id", restaurant_id)
    .order("role")
    .order("display_name");

  const members = (staff as StaffRow[]) ?? [];
  const admins = members.filter((s) => s.role === "restaurant_admin");
  const employees = members.filter((s) => s.role === "restaurant_employee");

  return (
    <div className="p-8 max-w-xl">
      <h1
        className="text-xl mb-1"
        style={{ color: "var(--color-ink)", fontWeight: 300, letterSpacing: "-0.4px" }}
      >
        Staff
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-ink-mute)" }}>
        {members.length} members. Staff accounts are managed by the platform super admin.
      </p>

      {[
        { label: "Admins", list: admins },
        { label: "Staff", list: employees },
      ].map(({ label, list }) =>
        list.length > 0 ? (
          <div key={label} className="mb-6">
            <p
              className="text-xs uppercase tracking-wide mb-2"
              style={{ color: "var(--color-ink-mute)", letterSpacing: "0.06em" }}
            >
              {label}
            </p>
            <div className="flex flex-col gap-2">
              {list.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border"
                  style={{
                    background: "var(--color-canvas)",
                    borderColor: "var(--color-hairline)",
                    opacity: s.is_active ? 1 : 0.5,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                    style={{ background: "var(--color-canvas-soft)", color: "var(--color-ink-mute)" }}
                  >
                    {s.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: "var(--color-ink)" }}>
                      {s.display_name}
                    </p>
                    {s.title && (
                      <p className="text-xs" style={{ color: "var(--color-ink-mute)" }}>
                        {s.title}
                      </p>
                    )}
                  </div>
                  <div
                    className="w-2 h-2 rounded-full"
                    title={s.auth_user_id ? "Has login" : "No login yet"}
                    style={{ background: s.auth_user_id ? "#1a7a4a" : "#d1d5db" }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}

      {members.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-ink-mute)" }}>
          No staff yet. Ask your platform admin to add team members.
        </p>
      )}
    </div>
  );
}
