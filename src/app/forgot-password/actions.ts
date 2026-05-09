"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendResetPasswordEmail(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") || "").trim();

  if (!email) {
    redirect("/forgot-password?error=Email is required");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Password reset email sent. Check your email.");
}
