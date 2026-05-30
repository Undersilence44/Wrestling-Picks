import Image from "next/image";
import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-10">
      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/50 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <Image
          src="/home/cta-panel-bg.png"
          alt="Login background"
          fill
          priority
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-blue-300">
            Welcome Back
          </p>

          <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
            Login
          </h1>

          <p className="mt-4 max-w-3xl text-slate-300">
            Get your picks in before bell time.
          </p>
        </div>
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

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm">
            <Link href="/forgot-password" className="font-bold text-blue-300">
              Forgot password?
            </Link>

            <Link href="/signup" className="font-bold text-red-300">
              Need an account?
            </Link>
          </div>
        </form>

        <aside className="card">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
            Pro Wrestling Picks
          </p>

          <h2 className="mt-4 text-4xl font-black uppercase text-white">
            Predict. Compete. Dominate.
          </h2>

          <div className="mt-6 grid gap-3">
            {[
              "Join leagues with friends",
              "Submit event picks",
              "Climb season rankings",
              "Track perfect events",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/40 p-4 font-bold text-slate-200"
              >
                ✓ {item}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
