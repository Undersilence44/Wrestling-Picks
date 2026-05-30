import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeName(value: any) {
  return value || "Champion";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please login to view your dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = safeName(
    profile?.display_name || profile?.full_name || profile?.email || user.email
  );

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, role, leagues(id, name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const leagues =
    memberships?.map((membership: any) => membership.leagues).filter(Boolean) ||
    [];

  const leagueIds = leagues.map((league: any) => league.id);

  const { data: openEvents } = leagueIds.length
    ? await supabase
        .from("events")
        .select("id, name, event_date, status, league_id, leagues(name)")
        .in("league_id", leagueIds)
        .eq("status", "open")
        .order("event_date", { ascending: true })
        .limit(6)
    : { data: [] as any[] };

  const eventIds = (openEvents || []).map((event: any) => event.id);

  const { data: picks } = eventIds.length
    ? await supabase
        .from("picks")
        .select("id, event_id")
        .eq("user_id", user.id)
        .in("event_id", eventIds)
    : { data: [] as any[] };

  const pickedEventIds = new Set(
    (picks || []).map((pick: any) => pick.event_id)
  );

  const { data: allLeagueRows } = leagueIds.length
    ? await supabase
        .from("leaderboard_view")
        .select(
          "league_id, league_name, user_id, display_name, total_points, correct_picks, wrong_picks, perfect_events, interference_total"
        )
        .in("league_id", leagueIds)
    : { data: [] as any[] };

  const userRows = (allLeagueRows || []).filter(
    (row: any) => row.user_id === user.id
  );

  const totalPoints = userRows.reduce(
    (sum: number, row: any) => sum + Number(row.total_points || 0),
    0
  );

  const correctPicks = userRows.reduce(
    (sum: number, row: any) => sum + Number(row.correct_picks || 0),
    0
  );

  const wrongPicks = userRows.reduce(
    (sum: number, row: any) => sum + Number(row.wrong_picks || 0),
    0
  );

  const perfectEvents = userRows.reduce(
    (sum: number, row: any) => sum + Number(row.perfect_events || 0),
    0
  );

  const totalPicks = correctPicks + wrongPicks;
  const accuracy = totalPicks ? Math.round((correctPicks / totalPicks) * 100) : 0;

  const canSeeAdmin = Boolean(
    memberships?.some((membership: any) =>
      ["LM", "ALM"].includes(membership.role)
    )
  );

  const rankMap = new Map<string, number>();

  for (const leagueId of leagueIds) {
    const leagueRows = (allLeagueRows || [])
      .filter((row: any) => row.league_id === leagueId)
      .sort((a: any, b: any) => {
        const pointDiff = Number(b.total_points || 0) - Number(a.total_points || 0);
        if (pointDiff !== 0) return pointDiff;

        return Number(b.correct_picks || 0) - Number(a.correct_picks || 0);
      });

    const userIndex = leagueRows.findIndex((row: any) => row.user_id === user.id);

    if (userIndex >= 0) {
      rankMap.set(leagueId, userIndex + 1);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
        <Image
          src="/home/cta-panel-bg.png"
          alt="Dashboard background"
          fill
          priority
          className="object-cover opacity-60"
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-blue-300">
            Dashboard
          </p>

          <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
            Welcome Back, {displayName}
          </h1>

          <p className="mt-4 max-w-3xl text-slate-300">
            Your fantasy wrestling control center: leagues, open events,
            rankings, perfect events, and quick actions.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-4">
        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">
            Leagues
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {leagues.length}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-300">
            Perfects
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {perfectEvents}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">
            Total Points
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {totalPoints}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-green-300">
            Accuracy
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {accuracy}%
          </h2>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
                Action Needed
              </p>

              <h2 className="mt-3 text-3xl font-black uppercase text-white">
                Open Events
              </h2>
            </div>

            <Link
              href="/events"
              className="text-sm font-black uppercase text-blue-300"
            >
              View All
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {openEvents && openEvents.length > 0 ? (
              openEvents.map((event: any) => {
                const hasPicked = pickedEventIds.has(event.id);
                const league: any = event.leagues;

                return (
                  <div
                    key={event.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/45 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="text-xl font-black uppercase text-white">
                        {event.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {league?.name || "League"} ·{" "}
                        {event.event_date
                          ? new Date(event.event_date).toLocaleString()
                          : "No date set"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                          hasPicked
                            ? "border border-green-700 bg-green-950 text-green-200"
                            : "border border-red-700 bg-red-950 text-red-200"
                        }`}
                      >
                        {hasPicked ? "Submitted" : "Needs Picks"}
                      </span>

                      <Link
                        href={`/events/${event.id}`}
                        className="btn-primary py-2"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-300">No open events right now.</p>
            )}
          </div>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
            Your Leagues
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            League Overview
          </h2>

          <div className="mt-6 space-y-4">
            {memberships && memberships.length > 0 ? (
              memberships.map((membership: any) => {
                const league = membership.leagues;
                const rank = rankMap.get(membership.league_id);

                return (
                  <div
                    key={membership.league_id}
                    className="rounded-2xl border border-white/10 bg-black/45 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-black uppercase text-white">
                          {league?.name || "League"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          Role: {membership.role}
                        </p>

                        <p className="mt-1 text-sm font-black text-yellow-300">
                          Rank: {rank ? `#${rank}` : "Unranked"}
                        </p>
                      </div>

                      <Link
                        href={`/leaderboard?league=${membership.league_id}`}
                        className="text-sm font-black uppercase text-blue-300"
                      >
                        Rankings
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-300">You are not in any leagues yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-300">
            Rankings Snapshot
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            Your Season Stats
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm text-slate-400">Correct Picks</p>
              <p className="mt-2 text-3xl font-black text-green-300">
                {correctPicks}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm text-slate-400">Wrong Picks</p>
              <p className="mt-2 text-3xl font-black text-red-300">
                {wrongPicks}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-black/50 p-8 backdrop-blur-xl">
          <Image
            src="/home/hero-tron-panel.png"
            alt="Quick access"
            fill
            className="object-cover opacity-45"
          />

          <div className="absolute inset-0 bg-black/65" />

          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
              Quick Access
            </p>

            <h2 className="mt-4 text-4xl font-black uppercase text-white">
              Jump Back In
            </h2>

            <div className="mt-8 grid gap-4">
              <Link href="/events" className="btn-danger text-center">
                View Events
              </Link>

              <Link href="/leaderboard" className="btn-primary text-center">
                View Rankings
              </Link>

              <Link href="/leagues" className="btn-dark text-center">
                View Leagues
              </Link>

              {canSeeAdmin && (
                <Link href="/admin" className="btn-dark text-center">
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
