import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  addMatchToEvent,
  removeMatchFromEvent,
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

function statusClass(status: string) {
  if (status === "open") return "border-blue-700 bg-blue-950 text-blue-200";
  if (status === "final") return "border-green-700 bg-green-950 text-green-200";
  return "border-red-700 bg-red-950 text-red-200";
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

  if (eventError) {
    redirect(`/admin?error=${encodeURIComponent(eventError.message)}`);
  }

  if (!event) {
    redirect(`/admin?error=${encodeURIComponent(`Event not found for ID: ${eventId}`)}`);
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

  const isLm = membership.role === "LM";

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
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10">
      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
        <Image
          src="/home/cta-panel-bg.png"
          alt="Edit event background"
          fill
          priority
          className="object-cover opacity-55"
        />

        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-red-300">
            Event Editor
          </p>

          <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
            {event.name}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-4 py-2 text-xs font-black uppercase ${statusClass(
                event.status
              )}`}
            >
              {event.status}
            </span>

            <span className="rounded-full border border-yellow-700 bg-yellow-950/50 px-4 py-2 text-xs font-black uppercase text-yellow-200">
              Your Role: {membership.role}
            </span>

            <span className="rounded-full border border-blue-700 bg-blue-950/50 px-4 py-2 text-xs font-black uppercase text-blue-200">
              {league?.name || "Unknown League"}
            </span>
          </div>

          <p className="mt-4 max-w-3xl text-slate-300">
            ALM users can edit matches and select winners. Only the LM can
            finalize the event and trigger scoring.
          </p>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href="#settings" className="btn-dark py-2">
          Settings
        </a>
        <a href="#matches" className="btn-dark py-2">
          Matches
        </a>
        <a href="#add-match" className="btn-dark py-2">
          Add Match
        </a>
        <a href="#interference" className="btn-dark py-2">
          Interference
        </a>
        <Link href="/admin" className="btn-primary py-2">
          Back To Admin
        </Link>
      </div>

      {query.message && (
        <p className="mt-6 rounded-2xl border border-blue-700 bg-blue-950/80 p-4 text-blue-100">
          {query.message}
        </p>
      )}

      {query.error && (
        <p className="mt-6 rounded-2xl border border-red-700 bg-red-950/80 p-4 text-red-100">
          {query.error}
        </p>
      )}

      {interferenceError && (
        <p className="mt-6 rounded-2xl border border-red-700 bg-red-950/80 p-4 text-red-100">
          Could not load interference submissions: {interferenceError.message}
        </p>
      )}

      <form action={updateEvent} className="mt-6 space-y-6">
        <input type="hidden" name="event_id" value={event.id} />
        <input
          type="hidden"
          name="match_ids"
          value={sortedMatches.map((m: any) => m.id).join(",")}
        />

        <section id="settings" className="card scroll-mt-28">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
            Event Settings
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            Core Details
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                {isLm && <option value="final">Final</option>}
              </select>
            </label>

            <div className="rounded-2xl border border-white/10 bg-black/45 p-4 text-sm text-slate-300">
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
                Ranked leagues use confidence points only. Fixed points and
                perfect bonus are ignored for ranked leagues.
              </p>

              {!isLm && (
                <p className="mt-3 rounded-xl border border-yellow-800 bg-yellow-950/30 p-3 text-yellow-100">
                  ALM users can save edits and winners, but cannot finalize the event.
                </p>
              )}
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
                    disabled={!isLm}
                  />
                </label>

                <label>
                  Perfect Event Bonus
                  <input
                    type="number"
                    name="perfect_bonus"
                    min="0"
                    defaultValue={event.perfect_bonus ?? league?.perfect_bonus ?? 5}
                    disabled={!isLm}
                  />
                </label>
              </>
            )}
          </div>
        </section>

        <section id="matches" className="card scroll-mt-28">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
            Match Card
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            Edit Matches & Winners
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Open the match you want to edit. LM and ALM can remove matches
            unless the event is finalized.
          </p>

          {matchesError && (
            <p className="mt-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
              Could not load matches: {matchesError.message}
            </p>
          )}

          {sortedMatches.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-slate-300">
              No matches have been added yet.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {sortedMatches.map((match: any, index: number) => {
                const options = optionValues(match);

                return (
                  <details
                    key={match.id}
                    className="rounded-2xl border border-white/10 bg-black/45 p-4"
                    open={index === 0}
                  >
                    <summary className="cursor-pointer text-lg font-black uppercase text-white">
                      Match {index + 1}:{" "}
                      <span className="text-blue-300">
                        {match.match_title ||
                          `${match.competitor_a || ""} vs ${match.competitor_b || ""}`}
                      </span>
                    </summary>

                    <div className="mt-5">
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
                        <select
                          name={`winner_${match.id}`}
                          defaultValue={match.winner || ""}
                        >
                          <option value="">No winner</option>
                          {options.map((option: string) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {event.status !== "final" && (
                      <div className="mt-5 rounded-2xl border border-red-900 bg-red-950/20 p-4">
                        <p className="text-sm text-red-100">
                          Removing this match also removes saved picks for this match.
                        </p>

                        <button
                          formAction={removeMatchFromEvent}
                          className="mt-3 rounded-2xl border border-red-700 bg-red-950/60 px-5 py-3 text-sm font-black uppercase text-red-100 hover:bg-red-900"
                          type="submit"
                          name="match_id"
                          value={match.id}
                        >
                          Remove Match
                        </button>
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          )}
        </section>

        <button className="btn-primary w-full" type="submit">
          Save Event Changes
        </button>
      </form>

      <section id="add-match" className="scroll-mt-28">
        {event.status === "open" ? (
          <div className="card mt-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
              Late Match
            </p>

            <h2 className="mt-3 text-3xl font-black uppercase text-white">
              Add Another Match
            </h2>

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
          </div>
        ) : (
          <div className="card mt-8 border-yellow-700">
            <h2 className="text-2xl font-black text-yellow-300">
              Match Adding Locked
            </h2>

            <p className="mt-2 text-slate-300">
              Matches can only be added while the event status is open.
            </p>
          </div>
        )}
      </section>

      <section id="interference" className="card mt-8 scroll-mt-28">
        <details open={false}>
          <summary className="cursor-pointer text-3xl font-black uppercase text-white">
            Interference Bet Scoring
          </summary>

          <p className="mt-3 text-sm text-slate-300">
            Review each member&apos;s interference prediction, wager, and assign
            bonus or penalty points.
          </p>

          {(interferenceSubmissions || []).length === 0 ? (
            <p className="mt-5 rounded-xl border border-white/10 bg-black/40 p-4 text-slate-300">
              No interference predictions have been submitted for this event yet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {(interferenceSubmissions || []).map((submission: any) => (
                <form
                  key={submission.bet_id}
                  action={updateInterferenceBetPoints}
                  className="rounded-2xl border border-white/10 bg-black/40 p-4"
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
                      Current:{" "}
                      {submission.admin_points ?? submission.points_awarded ?? 0} pts
                    </p>
                  </div>

                  <div className="mb-3 rounded-xl border border-white/10 bg-black/50 p-3">
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
                        defaultValue={
                          submission.admin_points ??
                          submission.points_awarded ??
                          0
                        }
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
        </details>
      </section>
    </main>
  );
}
