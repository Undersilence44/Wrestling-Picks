import PageHero from "@/components/PageHero";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function eventStatusClass(status: string) {
  if (status === "final") return "text-green-400";
  if (status === "open") return "text-blue-400";
  return "text-red-400";
}

function EventCard({ event }: { event: any }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white">{event.name}</h3>

          <p className="mt-2 text-slate-300">
            {new Date(event.event_date).toLocaleString()}
          </p>

          <p className="mt-2">
            Status:{" "}
            <span className={`font-black ${eventStatusClass(event.status)}`}>
              {event.status}
            </span>
          </p>
        </div>

        <Link href={`/events/${event.id}`} className="btn-primary">
          View Event
        </Link>
      </div>
    </article>
  );
}

export default async function EventsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="page">
        <PageHero
          title="Events"
          subtitle="Login to view league events and submit picks."
        />
      </main>
    );
  }

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const leagueIds = memberships?.map((m: any) => m.league_id) || [];

  const { data: events } =
    leagueIds.length > 0
      ? await supabase
          .from("events")
          .select("id,name,event_date,status,league_id,leagues(name)")
          .in("league_id", leagueIds)
          .order("event_date", { ascending: true })
      : { data: [] };

  const eventsByLeague = new Map<string, any[]>();

  for (const event of events || []) {
    const list = eventsByLeague.get(event.league_id) || [];
    list.push(event);
    eventsByLeague.set(event.league_id, list);
  }

  return (
    <main className="page">
      <RealtimeRefresh table="events" />
      <RealtimeRefresh table="matches" />
      <RealtimeRefresh table="picks" />
      <RealtimeRefresh table="event_results" />

      <PageHero
        title="Events"
        subtitle="Submit picks and review current or past league events."
      />

      {!memberships || memberships.length === 0 ? (
        <section className="card">
          <h2 className="text-2xl font-black">No leagues found</h2>
          <p className="mt-2 text-slate-300">
            Join or create a league before events will appear here.
          </p>
        </section>
      ) : (
        <section className="grid gap-5">
          {memberships.map((membership: any) => {
            const leagueEvents = eventsByLeague.get(membership.league_id) || [];
            const openEvents = leagueEvents.filter(
              (event: any) => event.status === "open"
            );
            const closedEvents = leagueEvents.filter(
              (event: any) => event.status !== "open"
            );

            return (
              <details
                key={membership.league_id}
                open
                className="card border border-slate-800"
              >
                <summary className="cursor-pointer text-2xl font-black">
                  {membership.leagues?.name || "Unnamed League"}{" "}
                  <span className="text-sm font-bold text-blue-300">
                    ({leagueEvents.length} event
                    {leagueEvents.length === 1 ? "" : "s"})
                  </span>
                </summary>

                <div className="mt-5 space-y-6">
                  <section>
                    <h2 className="mb-3 text-xl font-black text-blue-200">
                      Open Events
                    </h2>

                    {openEvents.length === 0 ? (
                      <p className="rounded-xl border border-slate-800 bg-black/30 p-4 text-slate-300">
                        No open events for this league right now.
                      </p>
                    ) : (
                      <div className="grid gap-3">
                        {openEvents.map((event: any) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <h2 className="mb-3 text-xl font-black text-slate-200">
                      Locked / Final / Closed Events
                    </h2>

                    {closedEvents.length === 0 ? (
                      <p className="rounded-xl border border-slate-800 bg-black/30 p-4 text-slate-300">
                        No closed events for this league yet.
                      </p>
                    ) : (
                      <div className="grid gap-3">
                        {closedEvents.map((event: any) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </details>
            );
          })}
        </section>
      )}
    </main>
  );
}
