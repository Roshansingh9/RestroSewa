"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export type ActionResult = { error: string } | null;

export async function createStaffMember(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const restaurantId = formData.get("restaurant_id") as string;
  const displayName = (formData.get("display_name") as string)?.trim();
  const title = (formData.get("title") as string)?.trim() ?? "";
  const role = formData.get("role") as string;
  const pin = formData.get("pin") as string;

  if (!displayName || !restaurantId) return { error: "Name is required." };
  if (pin.length < 4) return { error: "PIN must be at least 4 digits." };
  if (!["restaurant_admin", "restaurant_employee"].includes(role))
    return { error: "Invalid role." };

  const service = createServiceClient();

  // 1. Create restaurant_user record to get the ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newUser, error: insertError } = await (service as any)
    .from("restaurant_users")
    .insert({ restaurant_id: restaurantId, display_name: displayName, title, role })
    .select("id")
    .single();

  if (insertError) return { error: "Failed to create staff record." };

  // 2. Create Supabase Auth user (synthetic email + PIN as password)
  const admin = createAdminClient();
  const syntheticEmail = `emp-${newUser.id}@restrosewa.internal`;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: syntheticEmail,
    password: pin,
    email_confirm: true,
  });

  if (authError) {
    // Rollback the restaurant_users insert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any).from("restaurant_users").delete().eq("id", newUser.id);
    return { error: `Auth account failed: ${authError.message}` };
  }

  // 3. Link auth_user_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any)
    .from("restaurant_users")
    .update({ auth_user_id: authData.user.id })
    .eq("id", newUser.id);

  redirect(`/superadmin/restaurants/${restaurantId}`);
}

export async function resetStaffPin(
  staffId: string,
  authUserId: string,
  newPin: string
): Promise<ActionResult> {
  if (newPin.length < 4) return { error: "PIN must be at least 4 digits." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(authUserId, {
    password: newPin,
  });

  if (error) return { error: "Failed to update PIN." };
  return null;
}

export async function deleteStaffMember(
  staffId: string,
  authUserId: string | null,
  restaurantId: string
) {
  if (authUserId) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(authUserId);
  }

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any).from("restaurant_users").delete().eq("id", staffId);

  redirect(`/superadmin/restaurants/${restaurantId}`);
}
