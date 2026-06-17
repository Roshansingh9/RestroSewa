"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionResult = { error: string } | null;

export type RestaurantRow = {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_active: boolean;
  subscription_tier: string;
  created_at: string;
};

export type RestaurantDetail = RestaurantRow & { settings: Record<string, unknown> };

export type StaffRow = {
  id: string;
  display_name: string;
  title: string;
  role: string;
  is_active: boolean;
  auth_user_id: string | null;
  created_at: string;
};

export async function getAllRestaurants(): Promise<RestaurantRow[]> {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (service as any)
    .from("restaurants")
    .select("id, name, slug, type, is_active, subscription_tier, created_at")
    .order("created_at", { ascending: false });

  return (data as RestaurantRow[]) ?? [];
}

export async function getRestaurantWithStaff(
  id: string
): Promise<{ restaurant: RestaurantDetail; staff: StaffRow[] } | null> {
  const service = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: restaurant } = await (service as any)
    .from("restaurants")
    .select("id, name, slug, type, is_active, subscription_tier, settings, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!restaurant) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staff } = await (service as any)
    .from("restaurant_users")
    .select("id, display_name, title, role, is_active, auth_user_id, created_at")
    .eq("restaurant_id", id)
    .order("role")
    .order("display_name");

  return {
    restaurant: restaurant as RestaurantDetail,
    staff: (staff as StaffRow[]) ?? [],
  };
}

export async function createRestaurant(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim();
  const type = formData.get("type") as string;
  const tier = formData.get("subscription_tier") as string;

  if (!name || !slug) return { error: "Name and slug are required." };
  if (!/^[a-z0-9-]+$/.test(slug))
    return { error: "Slug may only contain lowercase letters, numbers and hyphens." };

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from("restaurants")
    .insert({
      name,
      slug,
      type: type || "restaurant",
      subscription_tier: tier || "free",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505")
      return { error: "That slug is already taken — choose a different one." };
    return { error: error.message };
  }

  redirect(`/superadmin/restaurants/${data.id}`);
}

export async function toggleRestaurantStatus(id: string, makeActive: boolean) {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any)
    .from("restaurants")
    .update({ is_active: makeActive })
    .eq("id", id);

  revalidatePath(`/superadmin/restaurants/${id}`);
  revalidatePath("/superadmin/dashboard");
}
