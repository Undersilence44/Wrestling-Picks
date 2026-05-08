import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { addMatchToEvent } from "./actions";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { eventId } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, name, event_date, status, league_id, scoring_type, fixed_points, perfect_bonus, leagues(name)")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    redirect("/admin?error=Event not found");
  }

  const { data: membership } = await supabase
    .from("league_members")
    .select("role")
    .eq("league_id", event.league_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["LM", "ALM"])
    .maybeSingle();

  if (!membership) {
    redirect("/admin?error=You do not have permission to edit this event");
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });

  return (
    <main className="page">
      <PageHero
        title="Edit Event"
        subtitle={`Manage matches, winners, and late match additions for ${event.name}.`}
      />

      {query.message && (
        <p className="mb-4 rounded-xl border border-blue-700 bg-blue-950 p-4 text-blue-100">
          {query.message}
        </p>
      )}

      {query.error && (
        <p className="mb-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
          {query.error}
        </p>
      )}

      <section className="card mb-8">
        <h2 className="text-2xl font-black">{event.name}</h2>

        <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
          <p>
            League:{" "}
            <span className="font-bold text-white">
              {(event.leagues as any)?.name || "League"}
            </span>
          </p>

          <p>
            Status:{" "}
            <span
              className={`font-black ${
                event.status === "final"
                  ? "text-green-300"
                  : event.status === "open"
                    ? "text-blue-300"
                    : "text-yellow-300"
              }`}
            >
              {event.status}
            </span>
          </p>

          <p>
            Event Date:{" "}
            <span className="font-bold text-white">
              {event.event_date ? new Date(event.event_date).toLocaleString() : "Not set"}
            </span>
          </p>

          <p>
            Scoring:{" "}
            <span className="font-bold text-white">
              {event.scoring_type || "ranked"}
            </span>
          </p>
        </div>
      </section>

      <section className="card">
        <h2 className="text-2xl font-black">Current Matches</h2>

        {matchesError && (
          <p className="mt-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
            Could not load matches: {matchesError.message}
          </p>
        )}

        {!matches || matches.length === 0 ? (
          <p className="mt-4 text-slate-300">No matches have been added yet.</p>
        ) : (
          <div className="mt-6 grid gap-4">
            {matches.map((match: any, index: number) => {
              const options = [
                match.option_1,
                match.option_2,
                match.option_3,
                match.option_4,
                match.option_5,
                match.option_6,
              ].filter(Boolean);

              return (
                <article
                  key={match.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
                >
                  <h3 className="text-xl font-black text-white">
                    Match {index + 1}: {match.match_title || match.title}
                  </h3>

                  {match.description && (
                    <p className="mt-2 text-slate-300">{match.description}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {options.map((option: string) => (
                      <span
                        key={option}
                        className={`rounded-full border px-3 py-1 text-sm font-bold ${
                          match.winner === option
                            ? "border-green-500 bg-green-950 text-green-200"
                            : "border-slate-700 bg-black text-slate-300"
                        }`}
                      >
                        {option}
                        {match.winner === option ? " ★ Winner" : ""}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {event.status === "open" ? (
        <section className="card mt-8">
          <h2 className="text-2xl font-black">Add Another Match</h2>
          <p className="mt-2 text-slate-300">
            Add late-announced matches while this event is still open.
          </p>

          <form action={addMatchToEvent.bind(null, event.id)} className="mt-6 grid gap-4">
            <label>
              Match Title / Description
              <input
                name="match_title"
                placeholder="Roman Reigns vs Cody Rhodes for the WWE Title"
                required
              />
            </label>

            <label>
              Extra Match Notes
              <textarea
                name="description"
                placeholder="Optional match details, stipulation, title match, etc."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Option 1
                <input name="option_1" placeholder="Roman Reigns" required />
              </label>

              <label>
                Option 2
                <input name="option_2" placeholder="Cody Rhodes" required />
              </label>

              <label>
                Option 3
                <input name="option_3" placeholder="Optional" />
              </label>

              <label>
                Option 4
                <input name="option_4" placeholder="Optional" />
              </label>

              <label>
                Option 5
                <input name="option_5" placeholder="Optional" />
              </label>

              <label>
                Option 6
                <input name="option_6" placeholder="Optional" />
              </label>
            </div>

            <button type="submit" className="btn-primary w-fit">
              Add Match
            </button>
          </form>
        </section>
      ) : (
        <section className="card mt-8 border-yellow-700">
          <h2 className="text-2xl font-black text-yellow-300">Match Adding Locked</h2>
          <p className="mt-2 text-slate-300">
            Matches can only be added while the event status is open.
          </p>
        </section>
      )}
    </main>
  );
}
