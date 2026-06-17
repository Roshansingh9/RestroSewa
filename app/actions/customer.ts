"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function sendNotification(
  restaurantId: string,
  tableId: string | null,
  type: "call_waiter" | "request_bill"
) {
  const service = createServiceClient();

  // Find active session for this table (if any)
  let sessionId: string | null = null;
  if (tableId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session } = await (service as any)
      .from("sessions")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("table_id", tableId)
      .eq("status", "active")
      .maybeSingle();
    sessionId = session?.id ?? null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any).from("notifications").insert({
    restaurant_id: restaurantId,
    table_id: tableId,
    session_id: sessionId,
    type,
  });

  revalidatePath("/employee/queue");
}
