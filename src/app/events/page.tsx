import Link from "next/link";
import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="page">
        <PageHero title="Events" subtitle="Login to view events for your leagues." />
      </main>
    );
  }

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, role, leagues(id, name, scoring_type, fixed_points, perfect_bonus)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const leagues =
    memberships
      ?.map((membership: any) => membership.leagues)
      .filter(Boolean) || [];

  const selectedLeagueId = params.league || leagues[0]?.id || "";
  const selectedLeague = leagues.find((league: any) => league.id === selectedLeagueId);

  const { data: events } = selectedLeagueId
    ? await supabase
        .from("events")
        .select("id, name, event_date, status, perfect_bonus, league_id, matches(id)")
        .eq("league_id", selectedLeagueId)
        .order("event_date", { ascending: true })
    : { data: [] as any[] };

  return (
    <main className="page">
      <PageHero
        title="Events"
        subtitle="Choose a league, then open an event to submit or update your picks."
      />

      {params.message && (
        <p className="mb-4 rounded-xl border border-blue-700 bg-blue-950 p-4 text-blue-100">
          {params.message}
        </p>
      )}

      {leagues.length === 0 ? (
        <section className="card">
          <h2 className="text-2xl font-black">No leagues yet</h2>
          <p className="mt-2 text-slate-300">
            Join or create a league first. Events only show for leagues where you are an active member.
          </p>
          <Link className="btn-primary mt-4 inline-flex" href="/leagues">
            Go to Leagues
          </Link>
        </section>
      ) : (
        <>
          <section className="card mb-6">
            <form className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end" action="/events" method="get">
              <label>
                Select League
                <select name="league" defaultValue={selectedLeagueId}>
                  {leagues.map((league: any) => (
                    <option key={league.id} value={league.id}>
                      {league.name} · {league.scoring_type}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn-primary" type="submit">
                View Events
              </button>
            </form>

            {selectedLeague && (
              <p className="mt-4 text-sm text-slate-300">
                Scoring: <span className="font-bold text-white">{selectedLeague.scoring_type}</span>
                {selectedLeague.scoring_type === "fixed" && (
                  <> · {selectedLeague.fixed_points} point(s) per correct pick</>
                )}
                <> · Perfect event bonus: {selectedLeague.perfect_bonus}</>
              </p>
            )}
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            {events && events.length > 0 ? (
              events.map((event: any) => {
                const matchCount = event.matches?.length || 0;
                const locked = event.status !== "open" || new Date(event.event_date) <= new Date();

                return (
                  <article className="card" key={event.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-black">{event.name}</h2>
                        <p className="mt-1 text-slate-300">
                          {new Date(event.event_date).toLocaleString()} · {matchCount} match{matchCount === 1 ? "" : "es"}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${locked ? "bg-red-950 text-red-200" : "bg-blue-950 text-blue-200"}`}>
                        {locked ? "Locked" : event.status}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link className="btn-primary" href={`/events/${event.id}?league=${selectedLeagueId}`}>
                        Make Picks
                      </Link>
                      <Link className="btn-secondary" href={`/leaderboard?league=${selectedLeagueId}`}>
                        View Leaderboard
                      </Link>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className="card lg:col-span-2">
                <h2 className="text-2xl font-black">No events for this league yet</h2>
                <p className="mt-2 text-slate-300">
                  An LM or ALM needs to create an event from the admin dashboard before members can make picks.
                </p>
                <Link className="btn-danger mt-4 inline-flex" href="/admin/events/new">
                  Create Event
                </Link>
              </article>
            )}
          </section>
        </>
      )}
    </main>
  );
}
