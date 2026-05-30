import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
      <section className="relative min-h-[460px] overflow-hidden rounded-[38px] border border-white/10 bg-black/20 shadow-2xl backdrop-blur-xl">
        <Image
          src="/home/hero-arena-bg.png"
          alt="Arena Background"
          fill
          priority
          className="object-cover opacity-100"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-black/10" />

        <div className="relative z-10 flex min-h-[460px] flex-col justify-center p-6 sm:p-10 lg:p-14">
          <h1 className="max-w-[720px] text-4xl font-black uppercase leading-[0.92] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Run Your
            <span className="block bg-gradient-to-r from-red-500 via-red-400 to-white bg-clip-text text-transparent">
              Pro Wrestling
            </span>
            Picks League
          </h1>

          <p className="mt-5 max-w-[620px] text-lg font-black uppercase tracking-[0.18em] text-slate-100 sm:text-xl">
            Like A Real Season.
          </p>

          <p className="mt-6 max-w-[580px] text-base leading-relaxed text-slate-200 sm:text-lg">
            Create leagues, lock in event picks, score confidence rankings,
            track interference bets, and crown season champions.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-3">
        <div className="card">
          <h2 className="text-2xl font-black uppercase text-red-400">
            Ranked Picks
          </h2>
          <p className="mt-3 text-slate-300">
            Confidence points are based on match rankings. The higher your
            confidence, the more points you earn.
          </p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-black uppercase text-blue-400">
            Fixed Picks
          </h2>
          <p className="mt-3 text-slate-300">
            Every correct match can use a fixed point value chosen by your
            league.
          </p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-black uppercase text-yellow-400">
            League Control
          </h2>
          <p className="mt-3 text-slate-300">
            League Managers and Assistant League Managers control events,
            members, scoring, and winners.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
            Important Rules
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            Built For League Play
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Play with Friends",
              "Interference Bets",
              "Season Scoring",
              "Confidence Rankings",
              "Multiple Leagues",
              "League Championships",
            ].map((rule) => (
              <div
                key={rule}
                className="rounded-2xl border border-white/10 bg-black/40 p-4"
              >
                <p className="font-bold text-slate-200">✓ {rule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
          <Image
            src="/home/cta-panel-bg.png"
            alt="CTA"
            fill
            className="object-cover opacity-70"
          />

          <div className="absolute inset-0 bg-black/55" />

          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
              Ready To Start?
            </p>

            <h2 className="mt-4 text-4xl font-black uppercase text-white">
              Create Your Season
            </h2>

            <p className="mt-4 text-slate-300">
              Create an account, join a league, and prove who knows pro
              wrestling better than everyone else.
            </p>

            <div className="mt-8 grid gap-4">
              <Link href="/signup" className="btn-danger text-center">
                Create Account
              </Link>

              <Link href="/leagues" className="btn-dark text-center">
                Join League
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[34px] border border-white/10 bg-black/45 p-8 text-center shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.45em] text-red-300">
          Why Pro Wrestling Picks?
        </p>

        <h2 className="mt-4 text-4xl font-black uppercase text-white">
          Predict • Compete • Dominate
        </h2>

        <p className="mx-auto mt-4 max-w-4xl text-slate-300">
          Designed for wrestling fans who want more than casual predictions.
          Build leagues, compete across entire seasons, earn bragging rights,
          climb rankings, and become champion.
        </p>
      </section>
    </main>
  );
}
