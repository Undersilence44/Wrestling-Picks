import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  addMatchToEvent,
  updateEvent,
  updateInterferenceBetPoints,
} from "./actions";

const OPTION_KEYS = [
  "competitor_a",
  "competitor_b",
  "competitor_c",
  "competitor_d",
  "competitor_e",
  "competitor_f",
] as const;

function optionValues(match: any) {
  return OPTION_KEYS.map((key) => match[key]).filter(Boolean);
}

function displayName(row: any) {
  return row.display_name || row.full_name || row.email || row.user_id;
}

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
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) redirect(`/admin?error=${encodeURIComponent(eventError.message)}`);
  if (!event) redirect(`/admin?error=${encodeURIComponent(`Event not found for ID: ${eventId}`)}`);

  const { data: membership } = await supabase
    .from("league_members")
    .select("role")
    .eq("league_id", event.league_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["LM", "ALM"])
    .maybeSingle();

  if (!membership) redirect("/admin?error=You do not have permission to edit this event");

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, scoring_type, fixed_points, perfect_bonus")
    .eq("id", event.league_id)
    .maybeSingle();

  const scoringType = league?.scoring_type || "ranked";

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .eq("event_id", event.id)
    .order("match_order", { ascending: true });

  const sortedMatches = matches || [];

  const { data: interferenceSubmissions, error: interferenceError } =
    await supabase.rpc("admin_get_interference_submissions", {
      target_event_id: event.id,
    });

  return (
    <main className="page max-w-6xl">
      <PageHero
        title="Edit Event"
        subtitle={`Manage ${event.name}, match info, winners, late match additions, and interference scoring.`}
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

      {interferenceError && (
        <p className="mb-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
          Could not load interference submissions: {interferenceError.message}
        </p>
      )}

      <form action={updateEvent} className="card space-y-5">
        <input type="hidden" name="event_id" value={event.id} />
        <input
          type="hidden"
          name="match_ids"
          value={sortedMatches.map((m: any) => m.id).join(",")}
        />

        <h2 className="text-2xl font-black">Event Settings</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            Event Name
            <input name="name" defaultValue={event.name || ""} required />
          </label>

          <label>
            Event Date / Time
            <input
              type="datetime-local"
              name="event_date"
              defaultValue={event.event_date ? event.event_date.slice(0, 16) : ""}
            />
          </label>

          <label>
            Status
            <select name="status" defaultValue={event.status || "open"}>
              <option value="open">Open</option>
              <option value="locked">Locked</option>
              <option value="final">Final</option>
            </select>
          </label>

          <div className="rounded-xl border border-slate-800 bg-black p-4 text-sm text-slate-300">
            <p>
              League:{" "}
              <span className="font-bold text-white">
                {league?.name || "Unknown league"}
              </span>
            </p>
            <p>
              Scoring:{" "}
              <span className="font-bold text-white">{scoringType}</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Ranked leagues use confidence points only. Fixed points/perfect bonus are ignored for ranked leagues.
            </p>
          </div>

          {scoringType === "fixed" && (
            <>
              <label>
                Fixed Points
                <input
                  type="number"
                  name="fixed_points"
                  min="1"
                  defaultValue={event.fixed_points ?? league?.fixed_points ?? 1}
                />
              </label>

              <label>
                Perfect Event Bonus
                <input
                  type="number"
                  name="perfect_bonus"
                  min="0"
                  defaultValue={event.perfect_bonus ?? league?.perfect_bonus ?? 5}
                />
              </label>
            </>
          )}
        </div>

        <section className="rounded-2xl border border-slate-800 bg-black/30 p-4">
          <h2 className="text-xl font-black">Current Matches</h2>

          {matchesError && (
            <p className="mt-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
              Could not load matches: {matchesError.message}
            </p>
          )}

          {sortedMatches.length === 0 ? (
            <p className="mt-4 text-slate-300">No matches have been added yet.</p>
          ) : (
            <div className="mt-6 grid gap-4">
              {sortedMatches.map((match: any, index: number) => {
                const options = optionValues(match);

                return (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
                  >
                    <h3 className="mb-3 text-lg font-black">Match {index + 1}</h3>

                    <label>
                      Match Title / Description
                      <input
                        name={`match_title_${match.id}`}
                        defaultValue={
                          match.match_title ||
                          `${match.competitor_a || ""} vs ${match.competitor_b || ""}`
                        }
                      />
                    </label>

                    <label className="mt-3 block">
                      Extra Match Notes
                      <textarea
                        name={`description_${match.id}`}
                        defaultValue={match.description || ""}
                        placeholder="Optional match details, stipulation, title match, etc."
                      />
                    </label>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {OPTION_KEYS.map((key, optionIndex) => (
                        <label key={key}>
                          Option {optionIndex + 1}
                          <input
                            name={`${key}_${match.id}`}
                            defaultValue={match[key] || ""}
                            placeholder={optionIndex < 2 ? "Required" : "Optional"}
                          />
                        </label>
                      ))}
                    </div>

                    <label className="mt-3 block">
                      Winner
                      <select name={`winner_${match.id}`} defaultValue={match.winner || ""}>
                        <option value="">No winner</option>
                        {options.map((option: string) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <button className="btn-primary w-full" type="submit">
          Save Event
        </button>
      </form>

      {event.status === "open" ? (
        <section className="card mt-8">
          <h2 className="text-2xl font-black">Add Another Match</h2>
          <p className="mt-2 text-slate-300">
            Add late-announced matches while this event is still open.
          </p>

          <form action={addMatchToEvent} className="mt-6 grid gap-4">
            <input type="hidden" name="event_id" value={event.id} />

            <label>
              Match Title / Description
              <input
                name="new_match_title"
                placeholder="Roman Reigns vs Cody Rhodes for the WWE Title"
                required
              />
            </label>

            <label>
              Extra Match Notes
              <textarea
                name="new_match_description"
                placeholder="Optional match details, stipulation, title match, etc."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Option 1
                <input name="new_option_1" placeholder="Roman Reigns" required />
              </label>

              <label>
                Option 2
                <input name="new_option_2" placeholder="Cody Rhodes" required />
              </label>

              <label>
                Option 3
                <input name="new_option_3" placeholder="Optional" />
              </label>

              <label>
                Option 4
                <input name="new_option_4" placeholder="Optional" />
              </label>

              <label>
                Option 5
                <input name="new_option_5" placeholder="Optional" />
              </label>

              <label>
                Option 6
                <input name="new_option_6" placeholder="Optional" />
              </label>
            </div>

            <button type="submit" className="btn-primary w-fit">
              Add Match
            </button>
          </form>
        </section>
      ) : (
        <section className="card mt-8 border-yellow-700">
          <h2 className="text-2xl font-black text-yellow-300">
            Match Adding Locked
          </h2>
          <p className="mt-2 text-slate-300">
            Matches can only be added while the event status is open.
          </p>
        </section>
      )}

      <section className="card mt-8 space-y-4">
        <div>
          <h2 className="text-2xl font-black">Interference Bet Scoring</h2>
          <p className="text-sm text-slate-300">
            Review each member&apos;s interference prediction, wager, and assign bonus or penalty points.
          </p>
        </div>

        {(interferenceSubmissions || []).length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-black/30 p-4 text-slate-300">
            No interference predictions have been submitted for this event yet.
          </p>
        ) : (
          <div className="space-y-3">
            {(interferenceSubmissions || []).map((submission: any) => (
              <form
                key={submission.bet_id}
                action={updateInterferenceBetPoints}
                className="rounded-2xl border border-slate-800 bg-black/30 p-4"
              >
                <input type="hidden" name="event_id" value={event.id} />
                <input type="hidden" name="bet_id" value={submission.bet_id} />

                <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-black">{displayName(submission)}</h3>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Wager: {submission.wager}
                    </p>
                  </div>

                  <p className="rounded-full border border-blue-900 bg-blue-950/40 px-3 py-1 text-xs font-bold text-blue-100">
                    Current: {submission.admin_points ?? submission.points_awarded ?? 0} pts
                  </p>
                </div>

                <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Member&apos;s interference call
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-100">
                    {submission.prediction || "No description entered."}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-[160px_1fr_auto] md:items-end">
                  <label>
                    Points +/-
                    <input
                      name="admin_points"
                      type="number"
                      defaultValue={submission.admin_points ?? submission.points_awarded ?? 0}
                    />
                  </label>

                  <label>
                    Admin Note
                    <input
                      name="admin_note"
                      defaultValue={submission.admin_note || ""}
                      placeholder="Why points were granted or removed"
                    />
                  </label>

                  <button className="btn-primary py-2" type="submit">
                    Save Points
                  </button>
                </div>
              </form>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
