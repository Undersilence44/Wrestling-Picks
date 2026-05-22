import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { resetPassword, updateProfile } from "./actions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,full_name,email")
    .eq("id", user.id)
    .single();

  return (
    <main className="page max-w-3xl">
      <PageHero
        title="Account"
        subtitle="Edit your profile and manage password resets."
      />

      {params.message && (
        <p className="mb-4 rounded-xl border border-blue-700 bg-blue-950 p-4 text-blue-100">
          {params.message}
        </p>
      )}

      <form action={updateProfile} className="card space-y-4">
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

      <form action={resetPassword} className="mt-4">
        <button className="btn-danger w-full" type="submit">
          Send Password Reset Email
        </button>
      </form>
    </main>
  );
}
