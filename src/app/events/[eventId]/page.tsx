import Link from "next/link";
import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
import { savePicks } from "../actions";

export default async function EventPicksPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ league?: string; message?: string }>;
}) {
  const { eventId } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="page">
        <PageHero
          title="Event Picks"
          subtitle="Login to submit your picks."
        />
      </main>
    );
  }

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, name, event_date, status, perfect_bonus, league_id, leagues(id, name, scoring_type, fixed_points, perfect_bonus), matches(id, match_order, match_title, description, competitor_a, competitor_b, competitor_c, competitor_d, competitor_e, competitor_f, winner, points_override)"
    )
    .eq("id", eventId)
    .single();

  if (!event) {
    return (
      <main className="page">
        <PageHero
          title="Event not found"
          subtitle="This event either does not exist or you do not have access to it."
        />

        <Link className="btn-primary" href="/events">
          Back to Events
        </Link>
      </main>
    );
  }

  const matches = [...((event as any).matches || [])].sort(
    (a: any, b: any) => a.match_order - b.match_order
  );

  const { data: existingPicks } = await supabase
    .from("picks")
    .select(
      "match_id, predicted_winner, confidence_rank, points_awarded"
    )
    .eq("event_id", event.id)
    .eq("user_id", user.id);

  const { data: existingBet } = await supabase
    .from("interference_bets")
    .select("prediction, wager")
    .eq("event_id", event.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const pickByMatch = new Map(
    (existingPicks || []).map((pick: any) => [
      pick.match_id,
      pick,
    ])
  );

  const league = (event as any).leagues;

  const locked =
    event.status !== "open" ||
    new Date(event.event_date) <= new Date();

  const isFinal = event.status === "final";

  return (
    <main className="page max-w-5xl">
      <PageHero
        title={event.name}
        subtitle={`${league?.name || "League event"} · ${new Date(
          event.event_date
        ).toLocaleString()}`}
      />

      {query.message && (
        <p className="mb-4 rounded-xl border border-blue-700 bg-blue-950 p-4 text-blue-100">
          {query.message === "Picks saved"
            ? "✅ Picks saved successfully."
            : query.message}
        </p>
      )}

      <section className="card mb-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Scoring
            </p>

            <p className="text-lg font-black text-white">
              {league?.scoring_type === "fixed"
                ? `Fixed · ${
                    league?.fixed_points || 1
                  } point(s) per correct pick`
                : "Ranked confidence scoring"}
            </p>
          </div>

          {league?.scoring_type === "fixed" ? (
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Perfect Bonus
              </p>

              <p className="text-lg font-black text-white">
                {event.perfect_bonus ??
                  league?.perfect_bonus ??
                  5}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Scoring Mode
              </p>

              <p className="text-lg font-black text-white">
                Ranked Confidence
              </p>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Status
            </p>

            <p className="text-lg font-black text-white">
              {locked ? "locked" : event.status}
            </p>
          </div>
        </div>
      </section>

      <form action={savePicks} className="card space-y-5">
        <input type="hidden" name="event_id" value={event.id} />
        <input type="hidden" name="league_id" value={event.league_id} />
        <input
          type="hidden"
          name="match_ids"
          value={matches.map((match: any) => match.id).join(",")}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">
              Pick Your Winners
            </h2>

            <p className="text-sm text-slate-300">
              {league?.scoring_type === "fixed"
                ? `Fixed scoring: every correct pick is worth ${
                    league?.fixed_points || 1
                  } point(s).`
                : "Ranked scoring uses confidence points only."}
            </p>
          </div>

          <Link
            className="btn-secondary"
            href={`/events?league=${event.league_id}`}
          >
            Back to League Events
          </Link>
        </div>

        {matches.length === 0 ? (
          <p className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-100">
            No matches have been added to this event yet.
          </p>
        ) : (
          matches.map((match: any, index: number) => {
            const currentPick = pickByMatch.get(match.id) as any;

            const options = [
              match.competitor_a,
              match.competitor_b,
              match.competitor_c,
              match.competitor_d,
              match.competitor_e,
              match.competitor_f,
            ].filter(Boolean);

            const officialWinner = match.winner || "";
            const pickedWinner =
              currentPick?.predicted_winner || "";

            const gotItRight =
              isFinal &&
              officialWinner &&
              pickedWinner &&
              officialWinner === pickedWinner;

            const gotItWrong =
              isFinal &&
              officialWinner &&
              pickedWinner &&
              officialWinner !== pickedWinner;

            return (
              <div
                key={match.id}
                className={`rounded-2xl border p-4 ${
                  gotItRight
                    ? "border-green-700 bg-green-950/20"
                    : gotItWrong
                    ? "border-red-700 bg-red-950/20"
                    : "border-slate-800 bg-black/30"
                }`}
              >
                <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-black">
                      Match {index + 1}
                    </h3>

                    <p className="text-sm text-slate-300">
                      {match.match_title ||
                        `${match.competitor_a} vs ${match.competitor_b}`}
                    </p>

                    {match.description && (
                      <p className="mt-1 text-xs text-slate-400">
                        {match.description}
                      </p>
                    )}
                  </div>

                  <span className="text-xs text-slate-400">
                    {options.length} pick options
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label>
                    Winner

                    <select
                      name={`winner_${match.id}`}
                      defaultValue={
                        currentPick?.predicted_winner || ""
                      }
                      disabled={locked}
                      required
                    >
                      <option value="">
                        Choose winner
                      </option>

                      {options.map((option: string) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  {league?.scoring_type === "fixed" ? (
                    <div className="rounded-xl border border-blue-900 bg-blue-950/20 p-3">
                      <p className="text-sm font-bold text-blue-100">
                        Fixed Points
                      </p>

                      <p className="mt-1 text-2xl font-black text-white">
                        {league?.fixed_points || 1}
                      </p>

                      <p className="text-xs text-slate-400">
                        Awarded if this pick is correct.
                      </p>
                    </div>
                  ) : (
                    <label>
                      Confidence Points

                      <input
                        name={`rank_${match.id}`}
                        type="number"
                        min="1"
                        max={matches.length}
                        defaultValue={
                          currentPick?.confidence_rank || ""
                        }
                        disabled={locked}
                        placeholder={`1-${matches.length}`}
                      />
                    </label>
                  )}
                </div>

                {isFinal && (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Official Winner
                      </p>

                      <p className="mt-1 font-black text-blue-200">
                        ⭐ {officialWinner || "No winner set"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Your Pick
                      </p>

                      <p
                        className={`mt-1 font-black ${
                          gotItRight
                            ? "text-green-300"
                            : gotItWrong
                            ? "text-red-300"
                            : "text-slate-300"
                        }`}
                      >
                        {pickedWinner ||
                          "No pick submitted"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        Result
                      </p>

                      <p
                        className={`mt-1 font-black ${
                          gotItRight
                            ? "text-green-300"
                            : gotItWrong
                            ? "text-red-300"
                            : "text-slate-300"
                        }`}
                      >
                        {gotItRight
                          ? `Correct +${
                              currentPick?.points_awarded || 0
                            }`
                          : gotItWrong
                          ? "Wrong +0"
                          : "Not scored"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        <div className="grid gap-3 rounded-2xl border border-blue-900 bg-blue-950/20 p-4 md:grid-cols-[2fr_1fr]">
          <label>
            Interference Prediction Details

            <textarea
              name="interference_prediction"
              rows={4}
              defaultValue={existingBet?.prediction || ""}
              disabled={locked}
              placeholder="Describe the interference call you are betting on."
            />
          </label>

          <label>
            Interference Wager

            <input
              name="interference_wager"
              type="number"
              min="0"
              defaultValue={existingBet?.wager || 0}
              disabled={locked}
            />

            <span className="mt-2 block text-xs text-slate-400">
              LM/ALM will review the description after the
              event and grant or subtract points.
            </span>
          </label>
        </div>

        {locked ? (
          <p className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-100">
            This event is locked. Picks can no longer be
            changed.
          </p>
        ) : (
          <button className="btn-primary w-full" type="submit">
            Save Picks
          </button>
        )}
      </form>
    </main>
  );
}
