import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { getMenuCategories, getMenuItemsByCategory } from "@/app/actions/menu";
import type { MenuItemRow } from "@/app/actions/menu";
import { CustomerMenu } from "./_components/customer-menu";

export default async function CustomerMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const { slug } = await params;
  const { table: tableQrToken } = await searchParams;

  const service = createServiceClient();

  // Fetch restaurant by slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: restaurant } = await (service as any)
    .from("restaurants")
    .select("id, name, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant || !restaurant.is_active) notFound();

  // Resolve table if QR token provided
  let tableId: string | null = null;
  if (tableQrToken) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: table } = await (service as any)
      .from("restaurant_tables")
      .select("id")
      .eq("restaurant_id", restaurant.id)
      .eq("qr_token", tableQrToken)
      .eq("is_active", true)
      .maybeSingle();
    tableId = table?.id ?? null;
  }

  const categories = await getMenuCategories(restaurant.id);
  const activeCategories = categories.filter((c) => c.is_active);

  const itemsByCategory = await Promise.all(
    activeCategories.map((c) => getMenuItemsByCategory(restaurant.id, c.id))
  );
  const allItems: MenuItemRow[] = itemsByCategory.flat();

  return (
    <CustomerMenu
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      tableId={tableId}
      categories={activeCategories}
      items={allItems}
    />
  );
}
