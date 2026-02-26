"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function changePassword(formData: FormData) {
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const forced = formData.get("forced") === "1";
  const isAdmin = formData.get("isAdmin") === "1";

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated. Please sign in again." };
  }

  // Update password using the user's own session
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) {
    return { error: updateError.message };
  }

  // Clear the flag using admin client (bypasses RLS)
  const admin = createAdminClient();
  const { error: flagError } = await admin
    .from("users")
    .update({ must_change_password: false })
    .eq("id", user.id);

  if (flagError) {
    console.error("Failed to clear must_change_password flag:", flagError);
    return { error: "Password updated but failed to clear flag. Please contact your admin." };
  }

  // Forced change (first login) → setup instructions; voluntary → back where they came from
  if (forced) {
    redirect("/setup-claude");
  } else {
    redirect(isAdmin ? "/admin" : "/setup-claude");
  }
}
