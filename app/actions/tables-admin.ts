"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export type ActionResult = { error: string } | null;

export type TableGroupRow = { id: string; name: string; sort_order: number };
export type TableRow = {
  id: string;
  number: string;
  group_id: string | null;
  qr_token: string;
  is_active: boolean;
};

export type GroupWithTables = TableGroupRow & { tables: TableRow[] };

export async function getTablesWithGroups(
  restaurantId: string
): Promise<{ ungrouped: TableRow[]; groups: GroupWithTables[] }> {
  const service = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: groups } = await (service as any)
    .from("table_groups")
    .select("id, name, sort_order")
    .eq("restaurant_id", restaurantId)
    .order("sort_order")
    .order("name");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tables } = await (service as any)
    .from("restaurant_tables")
    .select("id, number, group_id, qr_token, is_active")
    .eq("restaurant_id", restaurantId)
    .order("number");

  const allTables = (tables as TableRow[]) ?? [];
  const allGroups = (groups as TableGroupRow[]) ?? [];

  const ungrouped = allTables.filter((t) => !t.group_id);
  const grouped: GroupWithTables[] = allGroups.map((g) => ({
    ...g,
    tables: allTables.filter((t) => t.group_id === g.id),
  }));

  return { ungrouped, groups: grouped };
}

export async function createTableGroup(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const restaurantId = formData.get("restaurant_id") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required." };

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from("table_groups")
    .insert({ restaurant_id: restaurantId, name });

  if (error) return { error: error.message };
  revalidatePath("/admin/tables");
  return null;
}

export async function createTable(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const restaurantId = formData.get("restaurant_id") as string;
  const number = (formData.get("number") as string)?.trim();
  const groupId = (formData.get("group_id") as string) || null;

  if (!number) return { error: "Table number/name is required." };

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from("restaurant_tables")
    .insert({ restaurant_id: restaurantId, number, group_id: groupId || null });

  if (error) {
    if (error.code === "23505") return { error: "A table with that number already exists." };
    return { error: error.message };
  }
  revalidatePath("/admin/tables");
  return null;
}

export async function toggleTableStatus(id: string, isActive: boolean) {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any)
    .from("restaurant_tables")
    .update({ is_active: isActive })
    .eq("id", id);
  revalidatePath("/admin/tables");
}

export async function deleteTable(id: string): Promise<ActionResult> {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from("restaurant_tables")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/tables");
  return null;
}

export async function getRestaurantSlug(restaurantId: string): Promise<string | null> {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (service as any)
    .from("restaurants")
    .select("slug")
    .eq("id", restaurantId)
    .maybeSingle();
  return (data as { slug: string } | null)?.slug ?? null;
}
