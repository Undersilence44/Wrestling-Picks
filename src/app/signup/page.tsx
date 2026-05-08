import PageHero from "@/components/PageHero";
import { signup } from "./actions";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className="page max-w-3xl"><PageHero title="Sign Up" subtitle="Create your account. Supabase will send the confirmation email." />
    {params.error && <p className="mb-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">{params.error}</p>}
    <form action={signup} className="card space-y-4"><label>Display Name<input name="display_name" required /></label><label>Full Name<input name="full_name" /></label><label>Email<input name="email" type="email" required /></label><label>Password<input name="password" type="password" required minLength={6} /></label><button className="btn-primary w-full">Create Account</button></form>
  </main>;
}
