import Link from "next/link";
import PageHero from "@/components/PageHero";
import { sendResetPasswordEmail } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="page max-w-3xl">
      <PageHero
        title="Forgot Password"
        subtitle="Enter your email and we will send you a reset link."
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

      <form action={sendResetPasswordEmail} className="card space-y-4">
        <label>
          Email
          <input name="email" type="email" required />
        </label>

        <button className="btn-primary w-full" type="submit">
          Send Reset Link
        </button>

        <Link href="/login" className="block text-sm font-bold text-blue-300 hover:text-blue-200">
          Back to login
        </Link>
      </form>
    </main>
  );
}
