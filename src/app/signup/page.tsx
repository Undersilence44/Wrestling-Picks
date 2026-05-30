import Image from "next/image";
import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-10">
      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/50 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <Image
          src="/home/cta-panel-bg.png"
          alt="Signup background"
          fill
          priority
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-red-300">
            Join The League
          </p>

          <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
            Sign Up
          </h1>

          <p className="mt-4 max-w-3xl text-slate-300">
            Create your account and start competing.
          </p>
        </div>
      </section>

      {params.error && (
        <p className="mt-6 rounded-2xl border border-red-700 bg-red-950/80 p-4 text-red-100">
          {params.error}
        </p>
      )}

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1fr]">
        <aside className="card">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
            What You Get
          </p>

          <h2 className="mt-4 text-4xl font-black uppercase text-white">
            Your Season Starts Here
          </h2>

          <div className="mt-6 grid gap-3">
            {[
              "Create or join leagues",
              "Make picks before events lock",
              "Compete for rankings",
              "Become season champion",
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

        <form action={signup} className="card space-y-4">
          <label>
            Display Name
            <input name="display_name" required />
          </label>

          <label>
            Full Name
            <input name="full_name" />
          </label>

          <label>
            Email
            <input name="email" type="email" required />
          </label>

          <label>
            Password
            <input name="password" type="password" required minLength={6} />
          </label>

          <button className="btn-danger w-full" type="submit">
            Create Account
          </button>

          <p className="border-t border-white/10 pt-4 text-sm text-slate-300">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-blue-300">
              Login
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
