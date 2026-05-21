"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const display_name = String(formData.get("display_name") || "").trim();
  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();

  await supabase
    .from("profiles")
    .update({
      display_name,
      full_name,
      email,
    })
    .eq("id", user.id);

  if (email && email !== user.email) {
    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      redirect(`/account?message=${encodeURIComponent(error.message)}`);
    }
  }

  redirect("/account?message=Profile updated");
}

export async function resetPassword() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/login");

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect(`/account?message=${encodeURIComponent(error.message)}`);
  }

  redirect("/account?message=Password reset email sent. Check your email.");
}
