kimport Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RealtimeRefresh from "@/components/RealtimeRefresh";

function interferenceClass(value: number) {
  if (value < 0) return "text-red-300";
  if (value > 0) return "text-green-300";
  return "text-slate-300";
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
        <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
          <Image
            src="/home/cta-panel-bg.png"
            alt="Rankings background"
            fill
            priority
            className="object-cover opacity-55"
          />

          <div className="absolute inset-0 bg-black/65" />

          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.45em] text-blue-300">
              Rankings
            </p>

            <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
              Login Required
            </h1>

            <p className="mt-4 max-w-3xl text-slate-300">
              Login to view your league standings.
            </p>

            <Link href="/login" className="btn-primary mt-6 inline-block">
              Login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("league_members")
    .select("league_id, role, leagues(id, name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (membershipsError) {
    return (
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
        <section className="card">
          <h1 className="text-3xl font-black text-white">Leaderboard Error</h1>

          <p className="mt-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
            Could not load your leagues: {membershipsError.message}
          </p>
        </section>
      </main>
    );
  }

  const leagues =
    memberships?.map((membership: any) => membership.leagues).filter(Boolean) ||
    [];

  const selectedLeagueId = params.league || leagues[0]?.id || "";
  const selectedLeague = leagues.find(
    (league: any) => league.id === selectedLeagueId
  );

  const { data: rows, error: rowsError } = selectedLeagueId
    ? await supabase
        .from("leaderboard_view")
        .select(
          "league_id, league_name, user_id, display_name, total_points, correct_picks, wrong_picks, perfect_events, interference_total"
        )
        .eq("league_id", selectedLeagueId)
        .order("total_points", { ascending: false })
        .order("correct_picks", { ascending: false })
    : { data: [] as any[], error: null };

  const standings = rows || [];
  const topThree = standings.slice(0, 3);

  const leader = standings[0];
  const perfectLeader = [...standings].sort(
    (a: any, b: any) =>
      Number(b.perfect_events || 0) - Number(a.perfect_events || 0)
  )[0];

  const correctLeader = [...standings].sort(
    (a: any, b: any) =>
      Number(b.correct_picks || 0) - Number(a.correct_picks || 0)
  )[0];

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
      <RealtimeRefresh table="event_results" />
      <RealtimeRefresh table="events" />
      <RealtimeRefresh table="picks" />

      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
        <Image
          src="/home/cta-panel-bg.png"
          alt="Rankings background"
          fill
          priority
          className="object-cover opacity-55"
        />

        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-yellow-300">
            Rankings
          </p>

          <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
            Season Standings
          </h1>

          <p className="mt-4 max-w-3xl text-slate-300">
            Track league leaders, total points, perfect events, interference
            totals, and full standings.
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

      {leagues.length === 0 ? (
        <section className="card mt-6">
          <h2 className="text-3xl font-black uppercase text-white">
            No Leagues Yet
          </h2>

          <p className="mt-3 text-slate-300">
            Join or create a league first. Leaderboards are only available for
            leagues you belong to.
          </p>

          <Link href="/leagues" className="btn-primary mt-6 inline-block">
            Browse Leagues
          </Link>
        </section>
      ) : (
        <>
          <section className="card mt-6">
            <form
              className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end"
              action="/leaderboard"
              method="get"
            >
              <label>
                Select League Rankings
                <select name="league" defaultValue={selectedLeagueId}>
                  {leagues.map((league: any) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </label>

              <button className="btn-primary" type="submit">
                View Rankings
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-300">
              Showing standings for:{" "}
              <span className="font-black text-white">
                {selectedLeague?.name || "Selected league"}
              </span>
            </p>
          </section>

          {rowsError && (
            <p className="mt-6 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
              Could not load leaderboard: {rowsError.message}
            </p>
          )}

          <section className="mt-6 grid gap-5 md:grid-cols-4">
            <div className="card">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">
                Members
              </p>
              <h2 className="mt-3 text-4xl font-black text-white">
                {standings.length}
              </h2>
            </div>

            <div className="card">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-red-300">
                Points Leader
              </p>
              <h2 className="mt-3 truncate text-2xl font-black text-white">
                {leader?.display_name || "None"}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {leader ? `${leader.total_points} pts` : "No points yet"}
              </p>
            </div>

            <div className="card">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">
                Perfect Leader
              </p>
              <h2 className="mt-3 truncate text-2xl font-black text-white">
                {perfectLeader?.display_name || "None"}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {perfectLeader
                  ? `${perfectLeader.perfect_events} perfects`
                  : "No perfects yet"}
              </p>
            </div>

            <div className="card">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-green-300">
                Most Correct
              </p>
              <h2 className="mt-3 truncate text-2xl font-black text-white">
                {correctLeader?.display_name || "None"}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {correctLeader
                  ? `${correctLeader.correct_picks} correct`
                  : "No picks yet"}
              </p>
            </div>
          </section>

          <section className="mt-6 grid gap-5 lg:grid-cols-3">
            {topThree.map((row: any, index: number) => {
              const rank = index + 1;
              const medal =
                rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";

              return (
                <div
                  key={`${row.league_id}-${row.user_id}-podium`}
                  className={`rounded-[30px] border bg-black/55 p-6 shadow-2xl backdrop-blur-xl ${
                    rank === 1
                      ? "border-yellow-500/50"
                      : rank === 2
                        ? "border-slate-400/40"
                        : "border-orange-500/40"
                  }`}
                >
                  <p className="text-5xl">{medal}</p>

                  <p className="mt-4 text-xs font-black uppercase tracking-[0.35em] text-slate-400">
                    Rank #{rank}
                  </p>

                  <h3 className="mt-3 truncate text-3xl font-black uppercase text-white">
                    {row.display_name}
                  </h3>

                  <p className="mt-3 text-4xl font-black text-red-300">
                    {row.total_points}
                  </p>

                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                    Points
                  </p>
                </div>
              );
            })}

            {topThree.length === 0 && (
              <section className="card lg:col-span-3">
                <p className="text-slate-300">
                  No finalized results yet. An LM must finalize an event before
                  podium rankings appear.
                </p>
              </section>
            )}
          </section>

          <section className="card mt-6 overflow-x-auto">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
                  Full Standings
                </p>

                <h2 className="mt-3 text-3xl font-black uppercase text-white">
                  League Rankings
                </h2>
              </div>

              <p className="text-sm text-slate-400">
                Every active member is shown.
              </p>
            </div>

            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-blue-300">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Player</th>
                  <th className="p-3">Total Points</th>
                  <th className="p-3">Correct</th>
                  <th className="p-3">Wrong</th>
                  <th className="p-3">Perfects</th>
                  <th className="p-3">Interference +/-</th>
                </tr>
              </thead>

              <tbody>
                {standings.length > 0 ? (
                  standings.map((row: any, index: number) => {
                    const isCurrentUser = row.user_id === user.id;
                    const interference = Number(row.interference_total || 0);

                    return (
                      <tr
                        key={`${row.league_id}-${row.user_id}`}
                        className={`border-b border-white/5 ${
                          isCurrentUser ? "bg-blue-950/35" : ""
                        }`}
                      >
                        <td className="p-3 font-black text-blue-200">
                          #{index + 1}
                        </td>

                        <td className="p-3 font-bold text-white">
                          {row.display_name}
                          {isCurrentUser && (
                            <span className="ml-2 rounded-full border border-blue-700 bg-blue-950 px-2 py-1 text-[10px] font-black uppercase text-blue-200">
                              You
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-black text-red-300">
                          {row.total_points}
                        </td>

                        <td className="p-3">{row.correct_picks}</td>

                        <td className="p-3">{row.wrong_picks}</td>

                        <td className="p-3">{row.perfect_events}</td>

                        <td className={`p-3 font-bold ${interferenceClass(interference)}`}>
                          {row.interference_total}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="p-4 text-slate-300" colSpan={7}>
                      No finalized results yet. An LM must set match winners
                      and save the event as final before points populate here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
