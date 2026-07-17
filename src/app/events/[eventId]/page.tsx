import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { savePicks } from "../actions";
import EventPickCard from "@/components/EventPickCard";
import LeaguePicks from "@/components/LeaguePicks";

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

function memberDisplayName(member: any, profileMap: Map<string, any>) {
  const profile = profileMap.get(member.user_id);

  return (
    profile?.display_name ||
    profile?.full_name ||
    profile?.email ||
    member.user_id
  );
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
      "id, name, event_date, status, perfect_bonus, league_id, leagues(id, name, scoring_type, fixed_points, perfect_bonus), matches(id, match_order, match_title, description, competitor_a, competitor_b, competitor_c, competitor_d, competitor_e, competitor_f, option_1, option_2, option_3, option_4, option_5, option_6, winner, points_override)",
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
    (a: any, b: any) => a.match_order - b.match_order,
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
    (existingPicks || []).map((pick: any) => [pick.match_id, pick]),
  );

  const league = (event as any).leagues;

  const locked =
    event.status !== "open" || new Date(event.event_date) <= new Date();

  const isFinal = event.status === "final";
  const isFixed = league?.scoring_type === "fixed";

  const { data: leagueMembers } = await supabase
    .from("league_members")
    .select("user_id, role, status")
    .eq("league_id", event.league_id)
    .eq("status", "active");

  const memberUserIds = Array.from(
    new Set(
      (leagueMembers || [])
        .map((member: any) => member.user_id)
        .filter(Boolean),
    ),
  );

  const { data: memberProfiles } = memberUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, full_name, email, avatar_url")
        .in("id", memberUserIds)
    : { data: [] as any[] };

  const memberProfileMap = new Map<string, any>();
  for (const profile of memberProfiles || []) {
    memberProfileMap.set(profile.id, profile);
  }

  const { data: leagueMemberPicks } = locked
    ? await supabase
        .from("picks")
        .select(
          "user_id, match_id, predicted_winner, confidence_rank, points_awarded",
        )
        .eq("event_id", event.id)
    : { data: [] as any[] };

  const picksByUser = new Map<string, Map<string, any>>();
  for (const pick of leagueMemberPicks || []) {
    if (!picksByUser.has(pick.user_id)) {
      picksByUser.set(pick.user_id, new Map<string, any>());
    }

    picksByUser.get(pick.user_id)?.set(pick.match_id, pick);
  }

  const leaguePickMembers = (leagueMembers || []).map((member: any) => {
    const memberPicks = picksByUser.get(member.user_id);
    const profile = memberProfileMap.get(member.user_id);
    const displayName = memberDisplayName(member, memberProfileMap);

    const submittedCount = matches.filter((match: any) =>
      Boolean(memberPicks?.get(match.id)?.predicted_winner),
    ).length;

    const totalAwarded = matches.reduce(
      (total: number, match: any) =>
        total + Number(memberPicks?.get(match.id)?.points_awarded || 0),
      0,
    );

    return {
      userId: member.user_id,
      displayName,
      avatarUrl: profile?.avatar_url || null,
      role: member.role,
      submittedCount,
      totalAwarded,
      isCurrentUser: member.user_id === user.id,
      picks: matches.map((match: any) => {
        const pick = memberPicks?.get(match.id);
        const predictedWinner =
          pick?.predicted_winner || "No pick submitted";

        return {
          matchId: match.id,
          matchOrder: match.match_order,
          matchTitle: match.match_title,
          predictedWinner,
          confidenceRank: pick?.confidence_rank || null,
          hasPick: Boolean(pick?.predicted_winner),
          isCorrect:
            isFinal &&
            Boolean(match.winner) &&
            predictedWinner === match.winner,
        };
      }),
    };
  });

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
                  locked && event.status === "open" ? "locked" : event.status,
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
                  Perfect Bonus +
                  {event.perfect_bonus ?? league?.perfect_bonus ?? 5}
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

                return (
                  <EventPickCard
                    key={match.id}
                    match={match}
                    index={index}
                    options={options}
                    pickedWinner={pickedWinner}
                    officialWinner={officialWinner}
                    currentPick={currentPick}
                    locked={locked}
                    isFinal={isFinal}
                    isFixed={isFixed}
                    matchCount={matches.length}
                  />
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

      <LeaguePicks
        locked={locked}
        isFinal={isFinal}
        isFixed={isFixed}
        matchCount={matches.length}
        members={leaguePickMembers}
      />
    </main>
  );
}

