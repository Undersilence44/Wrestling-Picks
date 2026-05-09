import PageHero from "@/components/PageHero";
import { updatePassword } from "./actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="page max-w-3xl">
      <PageHero
        title="Reset Password"
        subtitle="Enter your new password below."
      />

      {params.message && (
        <p className="mb-4 rounded-xl border border-blue-700 bg-blue-950 p-4 text-blue-100">
          {params.message}
        </p>
      )}

      {params.error && (
        <p className="mb-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
          {params.error}
        </p>
      )}

      <form action={updatePassword} className="card space-y-4">
        <label>
          New Password
          <input name="password" type="password" minLength={6} required />
        </label>

        <label>
          Confirm New Password
          <input name="confirm_password" type="password" minLength={6} required />
        </label>

        <button className="btn-primary w-full" type="submit">
          Update Password
        </button>
      </form>
    </main>
  );
}
