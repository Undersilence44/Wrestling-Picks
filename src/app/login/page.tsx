import Link from "next/link";
import PageHero from "@/components/PageHero";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="page max-w-3xl">
      <PageHero
        title="Login"
        subtitle="Enter your account and get your picks in before bell time."
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

      <form action={login} className="card space-y-4">
        <label>
          Email
          <input name="email" type="email" required />
        </label>

        <label>
          Password
          <input name="password" type="password" required />
        </label>

        <button className="btn-primary w-full" type="submit">
          Login
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 text-sm">
          <Link
            href="/forgot-password"
            className="font-bold text-blue-300 hover:text-blue-200"
          >
            Forgot password?
          </Link>

          <Link
            href="/signup"
            className="font-bold text-red-300 hover:text-red-200"
          >
            Need an account?
          </Link>
        </div>
      </form>
    </main>
  );
}
