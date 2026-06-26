"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export type CustomerCartItem = {
  menu_item_id: string;
  item_name: string;
  item_price: number;
  workstation_id: string;
  workstation_name: string;
  quantity: number;
};

export async function verifyCustomerPin(
  sessionId: string,
  pin: string
): Promise<{ success: boolean }> {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session } = await (service as any)
    .from("sessions")
    .select("customer_pin")
    .eq("id", sessionId)
    .eq("status", "active")
    .maybeSingle();
  if (!session) return { success: false };
  return { success: session.customer_pin === pin };
}

export async function checkSessionActive(
  sessionId: string
): Promise<{ active: boolean }> {
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session } = await (service as any)
    .from("sessions")
    .select("status")
    .eq("id", sessionId)
    .maybeSingle();
  return { active: session?.status === "active" };
}

export async function submitCustomerOrder(
  sessionId: string,
  restaurantId: string,
  items: CustomerCartItem[]
): Promise<{ error?: string }> {
  if (!items.length) return { error: "No items in cart." };

  const service = createServiceClient();

  // Verify session is still active
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session } = await (service as any)
    .from("sessions")
    .select("status, restaurant_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session || session.status !== "active") return { error: "Session is no longer active." };
  if (session.restaurant_id !== restaurantId) return { error: "Invalid session." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error: orderErr } = await (service as any)
    .from("session_orders")
    .insert({ session_id: sessionId, restaurant_id: restaurantId, created_by: null })
    .select("id")
    .single();
  if (orderErr) return { error: "Failed to create order." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsErr } = await (service as any)
    .from("session_order_items")
    .insert(
      items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        variant_id: null,
        workstation_id: item.workstation_id,
        item_name: item.item_name,
        item_price: item.item_price,
        workstation_name: item.workstation_name,
        quantity: item.quantity,
        notes: null,
      }))
    );
  if (itemsErr) return { error: "Failed to add items." };

  revalidatePath("/employee/queue");
  return {};
}

export type NotificationStatus = "new" | "acknowledged" | null;

export type CustomerNotifState = {
  call_waiter: NotificationStatus;
  request_bill: NotificationStatus;
};

export async function getCustomerNotifState(
  restaurantId: string,
  tableId: string | null,
  roomId?: string | null
): Promise<CustomerNotifState> {
  if (!tableId && !roomId) return { call_waiter: null, request_bill: null };
  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (service as any)
    .from("notifications")
    .select("type, status")
    .eq("restaurant_id", restaurantId)
    .in("type", ["call_waiter", "request_bill"])
    .in("status", ["new", "acknowledged"]);

  if (tableId) query = query.eq("table_id", tableId);
  else if (roomId) query = query.eq("room_id", roomId);

  const { data } = await query;
  const rows = (data ?? []) as { type: string; status: string }[];
  const find = (t: string) =>
    (rows.find((r) => r.type === t)?.status as NotificationStatus) ?? null;

  return { call_waiter: find("call_waiter"), request_bill: find("request_bill") };
}

export async function sendNotification(
  restaurantId: string,
  tableId: string | null,
  type: "call_waiter" | "request_bill",
  roomId?: string | null
): Promise<{ error?: string; alreadyPending?: boolean }> {
  const service = createServiceClient();

  const contextId = tableId ?? roomId ?? null;
  if (!contextId) return { error: "No table or room context." };

  // Prevent duplicate active notifications of the same type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dupQuery = (service as any)
    .from("notifications")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("type", type)
    .in("status", ["new", "acknowledged"]);
  if (tableId) dupQuery = dupQuery.eq("table_id", tableId);
  else if (roomId) dupQuery = dupQuery.eq("room_id", roomId);

  const { data: existing } = await dupQuery.maybeSingle();
  if (existing) return { alreadyPending: true };

  // Find active session for this table/room (if any)
  let sessionId: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sessionQuery = (service as any)
    .from("sessions")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("status", "active");
  if (tableId) sessionQuery = sessionQuery.eq("table_id", tableId);
  else if (roomId) sessionQuery = sessionQuery.eq("room_id", roomId);

  const { data: session } = await sessionQuery.maybeSingle();
  sessionId = session?.id ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any).from("notifications").insert({
    restaurant_id: restaurantId,
    table_id: tableId ?? null,
    room_id: roomId ?? null,
    session_id: sessionId,
    type,
    status: "new",
  });

  if (error) return { error: error.message };
  revalidatePath("/employee/notifications");
  return {};
}
