"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionResult = { error: string } | null;

export type CategoryRow = {
  id: string;
  name: string;
  workstation_id: string;
  workstation_name: string | null;
  is_active: boolean;
  sort_order: number;
  item_count: number;
};

export type MenuItemRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  has_variants: boolean;
  category_id: string;
  workstation_id: string;
  sort_order: number;
};

export async function getMenuCategories(restaurantId: string): Promise<CategoryRow[]> {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (service as any)
    .from("menu_categories")
    .select(`
      id, name, is_active, sort_order, workstation_id,
      workstations ( name ),
      menu_items ( id )
    `)
    .eq("restaurant_id", restaurantId)
    .order("sort_order")
    .order("name");

  if (!data) return [];
  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    workstation_id: c.workstation_id,
    workstation_name: c.workstations?.name ?? null,
    is_active: c.is_active,
    sort_order: c.sort_order,
    item_count: c.menu_items?.length ?? 0,
  }));
}

export async function getMenuItemsByCategory(
  restaurantId: string,
  categoryId: string
): Promise<MenuItemRow[]> {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (service as any)
    .from("menu_items")
    .select("id, name, description, price, is_available, has_variants, category_id, workstation_id, sort_order")
    .eq("restaurant_id", restaurantId)
    .eq("category_id", categoryId)
    .order("sort_order")
    .order("name");
  return (data as MenuItemRow[]) ?? [];
}

export async function createCategory(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const restaurantId = formData.get("restaurant_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const workstationId = formData.get("workstation_id") as string;

  if (!name || !workstationId) return { error: "Name and workstation are required." };

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from("menu_categories")
    .insert({ restaurant_id: restaurantId, name, workstation_id: workstationId });

  if (error) return { error: error.message };
  revalidatePath("/admin/menu");
  return null;
}

export async function toggleCategoryStatus(id: string, isActive: boolean) {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any)
    .from("menu_categories")
    .update({ is_active: isActive })
    .eq("id", id);
  revalidatePath("/admin/menu");
}

export async function createMenuItem(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const restaurantId = formData.get("restaurant_id") as string;
  const categoryId = formData.get("category_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const price = parseFloat(formData.get("price") as string);
  const hasVariants = formData.get("has_variants") === "true";

  if (!name || !categoryId) return { error: "Name and category are required." };
  if (isNaN(price) || price < 0) return { error: "Price must be a non-negative number." };

  const service = createServiceClient();

  // Inherit workstation_id from category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cat } = await (service as any)
    .from("menu_categories")
    .select("workstation_id")
    .eq("id", categoryId)
    .single();

  if (!cat) return { error: "Category not found." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from("menu_items")
    .insert({
      restaurant_id: restaurantId,
      category_id: categoryId,
      workstation_id: cat.workstation_id,
      name,
      description,
      price,
      has_variants: hasVariants,
    });

  if (error) return { error: error.message };
  revalidatePath("/admin/menu");
  return null;
}

export async function toggleItemAvailability(id: string, isAvailable: boolean) {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any)
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", id);
  revalidatePath("/admin/menu");
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any).from("menu_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/menu");
  return null;
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any).from("menu_categories").delete().eq("id", id);
  if (error) {
    if (error.code === "23503")
      return { error: "Remove all items in this category first." };
    return { error: error.message };
  }
  revalidatePath("/admin/menu");
  return null;
}
