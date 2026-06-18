import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

export type RestaurantUserContext = {
  id: string;
  restaurant_id: string;
  role: string;
  display_name: string;
  permissions: string[];
};

export async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/superadmin/login");

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sa } = await (service as any)
    .from("super_admins")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!sa) redirect("/superadmin/login");

  return user;
}

export async function requireRestaurantStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ru } = await (service as any)
    .from("restaurant_users")
    .select("id, restaurant_id, role, display_name, permissions")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!ru) redirect("/login");

  const restaurantUser = ru as RestaurantUserContext;
  // Normalise: permissions column may be null if row predates migration
  if (!Array.isArray(restaurantUser.permissions)) restaurantUser.permissions = [];

  return { user, restaurantUser };
}

export async function requireRestaurantAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ru } = await (service as any)
    .from("restaurant_users")
    .select("id, restaurant_id, role, display_name, permissions")
    .eq("auth_user_id", user.id)
    .eq("role", "restaurant_admin")
    .eq("is_active", true)
    .maybeSingle();

  if (!ru) redirect("/login");

  const restaurantUser = ru as RestaurantUserContext;
  if (!Array.isArray(restaurantUser.permissions)) restaurantUser.permissions = [];

  return { user, restaurantUser };
}
