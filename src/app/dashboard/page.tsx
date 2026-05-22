import PageHero from "@/components/PageHero";

export default function DashboardPage() {
  return (
    <main className="page">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-black/60 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-transparent to-blue-950/20" />

        <div className="relative z-10">
          <PageHero
            title="Dashboard"
            subtitle="Your personalized fantasy wrestling control center."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-400">
                Coming Soon
              </p>

              <h2 className="mt-3 text-2xl font-black text-white">
                League Overview
              </h2>

              <p className="mt-3 text-slate-300">
                View all your leagues, rankings, season stats,
                and recent activity in one place.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-blue-400">
                Coming Soon
              </p>

              <h2 className="mt-3 text-2xl font-black text-white">
                Pick Reminders
              </h2>

              <p className="mt-3 text-slate-300">
                Upcoming event reminders, notifications,
                and live countdown timers.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
                Coming Soon
              </p>

              <h2 className="mt-3 text-2xl font-black text-white">
                Fantasy Stats
              </h2>

              <p className="mt-3 text-slate-300">
                Track accuracy, streaks, interference bets,
                and championship records.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-blue-900 bg-blue-950/30 p-6 text-center">
            <h2 className="text-3xl font-black text-white">
              Dashboard Under Development
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              The new Dashboard system is currently being built.
              Future updates will include league analytics,
              live standings, profile customization,
              notifications, faction systems,
              and advanced fantasy tracking.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
