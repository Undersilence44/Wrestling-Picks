import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { savePicks } from "../actions";

function statusClass(status: string) {
  if (status === "open") return "border-blue-700 bg-blue-950 text-blue-200";
  if (status === "final") return "border-green-700 bg-green-950 text-green-200";
  return "border-red-700 bg-red-950 text-red-200";
}

function optionList(match: any) {
  return [
    match.competitor_a,
    match.competitor_b,
    match.competitor_c,
    match.competitor_d,
    match.competitor_e,
    match.competitor_f,
    match.option_1,
    match.option_2,
    match.option_3,
    match.option_4,
    match.option_5,
    match.option_6,
  ].filter(Boolean);
}

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
      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10">
        <section className="card">
          <h1 className="text-4xl font-black uppercase text-white">
            Login Required
          </h1>
          <p className="mt-3 text-slate-300">Login to submit your picks.</p>
          <Link href="/login" className="btn-primary mt-6 inline-block">
            Login
          </Link>
        </section>
      </main>
    );
  }

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, name, event_date, status, perfect_bonus, league_id, leagues(id, name, scoring_type, fixed_points, perfect_bonus), matches(id, match_order, match_title, description, competitor_a, competitor_b, competitor_c, competitor_d, competitor_e, competitor_f, option_1, option_2, option_3, option_4, option_5, option_6, winner, points_override)"
    )
    .eq("id", eventId)
    .single();

  if (!event) {
    return (
      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10">
        <section className="card">
          <h1 className="text-4xl font-black uppercase text-white">
            Event Not Found
          </h1>
          <p className="mt-3 text-slate-300">
            This event either does not exist or you do not have access to it.
          </p>
          <Link className="btn-primary mt-6 inline-block" href="/events">
            Back To Events
          </Link>
        </section>
      </main>
    );
  }

  const matches = [...((event as any).matches || [])].sort(
    (a: any, b: any) => a.match_order - b.match_order
  );

  const { data: existingPicks } = await supabase
    .from("picks")
    .select("match_id, predicted_winner, confidence_rank, points_awarded")
    .eq("event_id", event.id)
    .eq("user_id", user.id);

  const { data: existingBet } = await supabase
    .from("interference_bets")
    .select("prediction, wager")
    .eq("event_id", event.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const pickByMatch = new Map(
    (existingPicks || []).map((pick: any) => [pick.match_id, pick])
  );

  const league = (event as any).leagues;

  const locked =
    event.status !== "open" || new Date(event.event_date) <= new Date();

  const isFinal = event.status === "final";
  const isFixed = league?.scoring_type === "fixed";

  const completedPicks = matches.filter((match: any) => {
    const pick = pickByMatch.get(match.id) as any;
    return Boolean(pick?.predicted_winner);
  }).length;

  const completionPercent = matches.length
    ? Math.round((completedPicks / matches.length) * 100)
    : 0;

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10">
      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
        <Image
          src="/home/cta-panel-bg.png"
          alt="Event background"
          fill
          priority
          className="object-cover opacity-55"
        />

        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.45em] text-red-300">
              Pick Center
            </p>

            <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
              {event.name}
            </h1>

            <p className="mt-4 max-w-3xl text-slate-300">
              {league?.name || "League event"} ·{" "}
              {event.event_date
                ? new Date(event.event_date).toLocaleString()
                : "No date set"}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <span
                className={`rounded-full border px-4 py-2 text-xs font-black uppercase ${statusClass(
                  locked && event.status === "open" ? "locked" : event.status
                )}`}
              >
                {locked && event.status === "open" ? "locked" : event.status}
              </span>

              <span className="rounded-full border border-blue-700 bg-blue-950/50 px-4 py-2 text-xs font-black uppercase text-blue-200">
                {isFixed
                  ? `${league?.fixed_points || 1} point per correct`
                  : "Ranked confidence"}
              </span>

              {isFixed && (
                <span className="rounded-full border border-yellow-700 bg-yellow-950/50 px-4 py-2 text-xs font-black uppercase text-yellow-200">
                  Perfect Bonus +{event.perfect_bonus ?? league?.perfect_bonus ?? 5}
                </span>
              )}
            </div>
          </div>

          <Link href="/events" className="btn-dark text-center">
            Back To Events
          </Link>
        </div>
      </section>

      {query.message && (
        <p className="mt-6 rounded-2xl border border-blue-700 bg-blue-950/80 p-4 text-blue-100">
          {query.message === "Picks saved"
            ? "✅ Picks saved successfully."
            : query.message}
        </p>
      )}

      <section className="mt-6 grid gap-5 md:grid-cols-3">
        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">
            Matches
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {matches.length}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-300">
            Picks Submitted
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {completedPicks}/{matches.length}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">
            Progress
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {completionPercent}%
          </h2>
        </div>
      </section>

      <section className="card mt-6">
        <div className="h-4 overflow-hidden rounded-full bg-black/60">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-slate-300">
          {locked
            ? "This event is locked. Picks can no longer be changed."
            : "Complete every match and save your picks before bell time."}
        </p>
      </section>

      <form action={savePicks} className="mt-6 space-y-6">
        <input type="hidden" name="event_id" value={event.id} />
        <input type="hidden" name="league_id" value={event.league_id} />
        <input
          type="hidden"
          name="match_ids"
          value={matches.map((match: any) => match.id).join(",")}
        />

        <section className="card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
                Match Card
              </p>

              <h2 className="mt-3 text-3xl font-black uppercase text-white">
                Pick Your Winners
              </h2>

              <p className="mt-2 text-sm text-slate-300">
                {isFixed
                  ? `Fixed scoring: every correct pick is worth ${
                      league?.fixed_points || 1
                    } point(s).`
                  : "Ranked scoring uses confidence points."}
              </p>
            </div>
          </div>

          {matches.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-red-100">
              No matches have been added to this event yet.
            </p>
          ) : (
            <div className="mt-6 grid gap-5">
              {matches.map((match: any, index: number) => {
                const currentPick = pickByMatch.get(match.id) as any;
                const options = optionList(match);

                const officialWinner = match.winner || "";
                const pickedWinner = currentPick?.predicted_winner || "";

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
                    className={`rounded-[28px] border p-5 ${
                      gotItRight
                        ? "border-green-700 bg-green-950/20"
                        : gotItWrong
                          ? "border-red-700 bg-red-950/20"
                          : "border-white/10 bg-black/40"
                    }`}
                  >
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
                          Match {index + 1}
                        </p>

                        <h3 className="mt-2 text-2xl font-black uppercase text-white">
                          {match.match_title ||
                            `${match.competitor_a} vs ${match.competitor_b}`}
                        </h3>

                        {match.description && (
                          <p className="mt-2 text-sm text-slate-300">
                            {match.description}
                          </p>
                        )}
                      </div>

                      {!isFixed && (
                        <label className="w-full sm:w-40">
                          Confidence
                          <input
                            name={`rank_${match.id}`}
                            type="number"
                            min="1"
                            max={matches.length}
                            defaultValue={currentPick?.confidence_rank || ""}
                            disabled={locked}
                            placeholder={`1-${matches.length}`}
                          />
                        </label>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {options.map((option: string) => {
                        const selected = pickedWinner === option;
                        const winner = officialWinner === option;

                        return (
                          <label
                            key={option}
                            className={`cursor-pointer rounded-2xl border p-4 transition ${
                              selected
                                ? "border-blue-500 bg-blue-950/40"
                                : "border-white/10 bg-black/45 hover:border-blue-500/40"
                            } ${winner && isFinal ? "ring-2 ring-green-500/50" : ""}`}
                          >
                            <input
                              type="radio"
                              name={`winner_${match.id}`}
                              value={option}
                              defaultChecked={selected}
                              disabled={locked}
                              required={!locked}
                              className="sr-only"
                            />

                            <div className="flex items-center justify-between gap-3">
                              <span className="font-black text-white">
                                {option}
                              </span>

                              {selected && (
                                <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-black uppercase text-white">
                                  Picked
                                </span>
                              )}

                              {winner && isFinal && (
                                <span className="rounded-full bg-green-600 px-2 py-1 text-xs font-black uppercase text-white">
                                  Winner
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {isFinal && (
                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            Official Winner
                          </p>
                          <p className="mt-1 font-black text-blue-200">
                            {officialWinner || "No winner set"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
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
                            {pickedWinner || "No pick submitted"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
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
                              ? `Correct +${currentPick?.points_awarded || 0}`
                              : gotItWrong
                                ? "Wrong +0"
                                : "Not scored"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-300">
            Special Bet
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            Interference Prediction
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Describe the interference call you are betting on. LM/ALM will
            review it after the event.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-[2fr_1fr]">
            <label>
              Prediction Details
              <textarea
                name="interference_prediction"
                rows={4}
                defaultValue={existingBet?.prediction || ""}
                disabled={locked}
                placeholder="Describe the interference call you are betting on."
              />
            </label>

            <label>
              Wager
              <input
                name="interference_wager"
                type="number"
                min="0"
                defaultValue={existingBet?.wager || 0}
                disabled={locked}
              />

              <span className="mt-2 block text-xs text-slate-400">
                Wagers can be reviewed and scored by league admins.
              </span>
            </label>
          </div>
        </section>

        {locked ? (
          <p className="rounded-2xl border border-red-900 bg-red-950/40 p-4 text-red-100">
            This event is locked. Picks can no longer be changed.
          </p>
        ) : (
          <button className="btn-danger w-full" type="submit">
            Save Picks
          </button>
        )}
      </form>
    </main>
  );
}
