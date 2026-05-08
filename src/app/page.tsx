import Link from "next/link";
import PageHero from "@/components/PageHero";

export default function HomePage() {
  return <main className="page">
    <PageHero title="Run your pro wrestling picks league like a real season." subtitle="Create leagues, lock in event picks, score confidence rankings, track interference bets, and crown season champions." />
    <section className="grid gap-5 md:grid-cols-3">
      <div className="card"><h2 className="text-2xl font-black text-red-300">Ranked Picks</h2><p className="mt-3 text-slate-300">Confidence points are based on the number of matches. Highest confidence pick earns the most if correct.</p></div>
      <div className="card"><h2 className="text-2xl font-black text-blue-300">Fixed Picks</h2><p className="mt-3 text-slate-300">Every correct match can use a fixed point value controlled by league settings.</p></div>
      <div className="card"><h2 className="text-2xl font-black text-slate-100">League Control</h2><p className="mt-3 text-slate-300">LM and ALM roles manage event cards, winners, bonus points, private invites, and league members.</p></div>
    </section>
    <section className="mt-8 grid gap-5 lg:grid-cols-2">
      <div className="card"><h2 className="text-2xl font-black">Important rules</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300"><li>Private leagues are invite-only.</li><li>Interference bets cannot be negative or exceed current season points.</li><li>Perfect event bonus defaults to 5 points and can be edited by LM.</li><li>Members only view events and leaderboards for leagues they belong to.</li></ul></div>
      <div className="card"><h2 className="text-2xl font-black">Ready to start?</h2><p className="mt-3 text-slate-300">Create an account, confirm your email, then create or join a league.</p><div className="mt-5 flex gap-3"><Link className="btn-primary" href="/signup">Create Account</Link><Link className="btn-dark" href="/rules">Read Rules</Link></div></div>
    </section>
  </main>;
}
