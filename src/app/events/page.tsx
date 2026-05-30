import Image from "next/image";
import Link from "next/link";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import { createClient } from "@/lib/supabase/server";

function statusBadge(status: string) {
  if (status === "open") {
    return "border-blue-700 bg-blue-950 text-blue-200";
  }

  if (status === "final") {
    return "border-green-700 bg-green-950 text-green-200";
  }

  return "border-red-700 bg-red-950 text-red-200";
}

function actionText(status: string) {
  return status === "open" ? "Make Picks" : "View Results";
}

function EventCard({ event }: { event: any }) {
  const league: any = event.leagues;

  return (
    <article className="rounded-[26px] border border-white/10 bg-black/45 p-5 transition hover:-translate-y-1 hover:border-blue-500/40">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${statusBadge(
                event.status
              )}`}
            >
              {event.status}
            </span>

            <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-black uppercase text-slate-300">
              {league?.name || "League"}
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black uppercase text-white">
            {event.name}
          </h3>

          <p className="mt-2 text-sm text-slate-300">
            {event.event_date
              ? new Date(event.event_date).toLocaleString()
              : "No date set"}
          </p>
        </div>

        <Link
          href={`/events/${event.id}`}
          className={event.status === "open" ? "btn-danger text-center" : "btn-primary text-center"}
        >
          {actionText(event.status)}
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
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
        <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
          <Image
            src="/home/cta-panel-bg.png"
            alt="Events background"
            fill
            priority
            className="object-cover opacity-55"
          />

          <div className="absolute inset-0 bg-black/65" />

          <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.45em] text-blue-300">
              Events
            </p>

            <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
              Login Required
            </h1>

            <p className="mt-4 max-w-3xl text-slate-300">
              Login to view league events and submit picks.
            </p>

            <Link href="/login" className="btn-primary mt-6 inline-block">
              Login
            </Link>
          </div>
        </section>
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
      : { data: [] as any[] };

  const eventsByLeague = new Map<string, any[]>();

  for (const event of events || []) {
    const list = eventsByLeague.get(event.league_id) || [];
    list.push(event);
    eventsByLeague.set(event.league_id, list);
  }

  const openCount = (events || []).filter((event: any) => event.status === "open").length;
  const closedCount = (events || []).filter((event: any) => event.status !== "open").length;

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
      <RealtimeRefresh table="events" />
      <RealtimeRefresh table="matches" />
      <RealtimeRefresh table="picks" />
      <RealtimeRefresh table="event_results" />

      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
        <Image
          src="/home/cta-panel-bg.png"
          alt="Events background"
          fill
          priority
          className="object-cover opacity-55"
        />

        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-blue-300">
            Events
          </p>

          <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
            Pick Center
          </h1>

          <p className="mt-4 max-w-3xl text-slate-300">
            Submit picks for open events and review locked or final league
            events.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-3">
        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">
            Your Leagues
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {memberships?.length || 0}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-300">
            Open Events
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {openCount}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-green-300">
            Locked / Final
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {closedCount}
          </h2>
        </div>
      </section>

      {!memberships || memberships.length === 0 ? (
        <section className="card mt-6">
          <h2 className="text-3xl font-black uppercase text-white">
            No Leagues Found
          </h2>

          <p className="mt-3 text-slate-300">
            Join or create a league before events will appear here.
          </p>

          <Link href="/leagues" className="btn-primary mt-6 inline-block">
            Browse Leagues
          </Link>
        </section>
      ) : (
        <section className="mt-6 grid gap-6">
          {memberships.map((membership: any) => {
            const leagueEvents = eventsByLeague.get(membership.league_id) || [];

            const openEvents = leagueEvents.filter(
              (event: any) => event.status === "open"
            );

            const closedEvents = leagueEvents.filter(
              (event: any) => event.status !== "open"
            );

            return (
              <section
                key={membership.league_id}
                className="card"
              >
                <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
                      League Events
                    </p>

                    <h2 className="mt-3 text-3xl font-black uppercase text-white">
                      {membership.leagues?.name || "Unnamed League"}
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      {leagueEvents.length} event
                      {leagueEvents.length === 1 ? "" : "s"} total
                    </p>
                  </div>

                  <Link
                    href={`/leaderboard?league=${membership.league_id}`}
                    className="btn-dark text-center"
                  >
                    Rankings
                  </Link>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  <section>
                    <h3 className="text-xl font-black uppercase text-blue-300">
                      Open Events
                    </h3>

                    <div className="mt-4 grid gap-4">
                      {openEvents.length === 0 ? (
                        <p className="rounded-2xl border border-white/10 bg-black/40 p-4 text-slate-300">
                          No open events for this league right now.
                        </p>
                      ) : (
                        openEvents.map((event: any) => (
                          <EventCard key={event.id} event={event} />
                        ))
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-black uppercase text-slate-200">
                      Locked / Final Events
                    </h3>

                    <div className="mt-4 grid gap-4">
                      {closedEvents.length === 0 ? (
                        <p className="rounded-2xl border border-white/10 bg-black/40 p-4 text-slate-300">
                          No closed events for this league yet.
                        </p>
                      ) : (
                        closedEvents.map((event: any) => (
                          <EventCard key={event.id} event={event} />
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </section>
            );
          })}
        </section>
      )}
    </main>
  );
}
