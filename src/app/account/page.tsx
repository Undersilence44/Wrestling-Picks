import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resetPassword, updateProfile } from "./actions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, full_name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const avatarUrl = profile?.avatar_url;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-10">
      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/50 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.45em] text-blue-300">
          Account
        </p>

        <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
          Profile Settings
        </h1>

        <p className="mt-4 max-w-3xl text-slate-300">
          Manage your profile picture, display name, email, and account security.
        </p>
      </section>

      {params.message && (
        <p className="mt-6 rounded-2xl border border-blue-700 bg-blue-950/80 p-4 text-blue-100">
          {params.message}
        </p>
      )}

      {params.error && (
        <p className="mt-6 rounded-2xl border border-red-700 bg-red-950/80 p-4 text-red-100">
          {params.error}
        </p>
      )}

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="card text-center">
          <div className="mx-auto grid h-40 w-40 place-items-center overflow-hidden rounded-full border border-yellow-500/40 bg-black/60">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-6xl font-black uppercase text-yellow-300">
                {(profile?.display_name || user.email || "U").slice(0, 1)}
              </span>
            )}
          </div>

          <h2 className="mt-5 text-2xl font-black uppercase text-white">
            {profile?.display_name || "Champion"}
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {profile?.email || user.email}
          </p>
        </div>

        <form action={updateProfile} className="card space-y-4">
          <label>
            Profile Picture
            <input name="avatar" type="file" accept="image/*" />
          </label>

          <label>
            Display Name
            <input
              name="display_name"
              defaultValue={profile?.display_name || ""}
            />
          </label>

          <label>
            Full Name
            <input name="full_name" defaultValue={profile?.full_name || ""} />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              defaultValue={profile?.email || user.email || ""}
            />
          </label>

          <button className="btn-primary w-full" type="submit">
            Save Profile
          </button>
        </form>
      </section>

      <section className="card mt-6">
        <h2 className="text-3xl font-black uppercase text-white">Security</h2>

        <p className="mt-3 text-slate-300">
          Send yourself a password reset email.
        </p>

        <form action={resetPassword} className="mt-5">
          <button className="btn-danger w-full" type="submit">
            Send Password Reset Email
          </button>
        </form>

        <Link href="/dashboard" className="btn-dark mt-4 block text-center">
          Back To Dashboard
        </Link>
      </section>
    </main>
  );
}
