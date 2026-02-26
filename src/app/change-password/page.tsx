import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("must_change_password, role")
    .eq("id", user.id)
    .single();

  const forced = profile?.must_change_password ?? false;
  const isAdmin = profile?.role === "admin";

  return (
    <Suspense>
      <ChangePasswordForm forced={forced} isAdmin={isAdmin} />
    </Suspense>
  );
}
