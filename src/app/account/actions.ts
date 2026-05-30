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
  const email = String(formData.get("email") || user.email || "").trim();

  let avatar_url: string | null = null;
  const avatar = formData.get("avatar");

  if (avatar instanceof File && avatar.size > 0) {
    const ext = avatar.name.split(".").pop()?.toLowerCase() || "png";
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-avatars")
      .upload(filePath, avatar, {
        upsert: true,
        contentType: avatar.type || "image/png",
      });

    if (uploadError) {
      redirect(`/account?error=${encodeURIComponent(uploadError.message)}`);
    }

    const { data } = supabase.storage
      .from("profile-avatars")
      .getPublicUrl(filePath);

    avatar_url = `${data.publicUrl}?v=${Date.now()}`;
  }

  const payload: Record<string, any> = {
    id: user.id,
    display_name,
    full_name,
    email,
    updated_at: new Date().toISOString(),
  };

  if (avatar_url) {
    payload.avatar_url = avatar_url;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    redirect(`/account?error=${encodeURIComponent(error.message)}`);
  }

  if (email && email !== user.email) {
    const { error: authError } = await supabase.auth.updateUser({ email });

    if (authError) {
      redirect(`/account?error=${encodeURIComponent(authError.message)}`);
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect(`/account?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/account?message=Password reset email sent. Check your email.");
}
