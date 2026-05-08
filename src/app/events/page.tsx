import PageHero from "@/components/PageHero";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
    .select("league_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const leagueIds = memberships?.map((m: any) => m.league_id) || [];

  const { data: events } =
    leagueIds.length > 0
      ? await supabase
          .from("events")
          .select(`
            *,
            leagues(name)
          `)
          .in("league_id", leagueIds)
          .order("event_date", { ascending: true })
      : { data: [] };

  return (
    <main className="page">
      <RealtimeRefresh table="events" />
      <RealtimeRefresh table="matches" />
      <RealtimeRefresh table="picks" />
      <RealtimeRefresh table="event_results" />

      <PageHero
        title="Events"
        subtitle="Submit picks and track wrestling event results live."
      />

      {!events || events.length === 0 ? (
        <section className="card">
          <h2 className="text-2xl font-black">No events found</h2>
          <p className="mt-2 text-slate-300">
            No league events are currently available.
          </p>
        </section>
      ) : (
        <section className="grid gap-6">
          {events.map((event: any) => (
            <article
              key={event.id}
              className="card border border-slate-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">
                    {event.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {event.leagues?.name}
                  </p>

                  <p className="mt-2 text-slate-300">
                    {new Date(event.event_date).toLocaleString()}
                  </p>

                  <p className="mt-2">
                    Status:{" "}
                    <span
                      className={`font-black ${
                        event.status === "final"
                          ? "text-green-400"
                          : event.status === "open"
                            ? "text-blue-400"
                            : "text-red-400"
                      }`}
                    >
                      {event.status}
                    </span>
                  </p>
                </div>

                <Link
                  href={`/events/${event.id}`}
                  className="btn-primary"
                >
                  View Event
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
