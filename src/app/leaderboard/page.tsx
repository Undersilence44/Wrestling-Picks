import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
import RealtimeRefresh from "@/components/RealtimeRefresh";

function displayName(member: any, profileMap: Map<string, any>) {
  const profile = profileMap.get(member.user_id);

  return (
    profile?.display_name ||
    profile?.full_name ||
    profile?.email ||
    "Unknown Player"
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="page">
        <PageHero
          title="Leaderboard"
          subtitle="Login to view your league standings."
        />
      </main>
    );
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("league_members")
    .select("league_id, role, leagues(id, name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (membershipsError) {
    return (
      <main className="page">
        <PageHero
          title="Leaderboard"
          subtitle="League-scoped standings and player stats."
        />

        <p className="rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
          Could not load your leagues: {membershipsError.message}
        </p>
      </main>
    );
  }

  const leagues =
    memberships
      ?.map((membership: any) => membership.leagues)
      .filter(Boolean) || [];

  const selectedLeagueId = params.league || leagues[0]?.id || "";
  const selectedLeague = leagues.find(
    (league: any) => league.id === selectedLeagueId
  );

  const { data: activeMembers, error: activeMembersError } = selectedLeagueId
    ? await supabase
        .from("league_members")
        .select("id, league_id, user_id, role, status, created_at")
        .eq("league_id", selectedLeagueId)
        .eq("status", "active")
        .order("created_at", { ascending: true })
    : { data: [] as any[], error: null };

  const memberUserIds = Array.from(
    new Set(
      (activeMembers || [])
        .map((member: any) => member.user_id)
        .filter(Boolean)
    )
  );

  const { data: profiles } = memberUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, full_name, email")
        .in("id", memberUserIds)
    : { data: [] as any[] };

  const profileMap = new Map<string, any>();

  for (const profile of profiles || []) {
    profileMap.set(profile.id, profile);
  }

  const { data: scoredRows, error: rowsError } = selectedLeagueId
    ? await supabase
        .from("leaderboard_view")
        .select(
          "league_id, league_name, user_id, display_name, total_points, correct_picks, wrong_picks, perfect_events, interference_total"
        )
        .eq("league_id", selectedLeagueId)
    : { data: [] as any[], error: null };

  const scoredMap = new Map<string, any>();

  for (const row of scoredRows || []) {
    scoredMap.set(row.user_id, row);
  }

  const rows = (activeMembers || [])
    .map((member: any) => {
      const scored = scoredMap.get(member.user_id);

      return {
        league_id: selectedLeagueId,
        user_id: member.user_id,
        display_name:
          scored?.display_name || displayName(member, profileMap),
        role: member.role,
        total_points: Number(scored?.total_points || 0),
        correct_picks: Number(scored?.correct_picks || 0),
        wrong_picks: Number(scored?.wrong_picks || 0),
        perfect_events: Number(scored?.perfect_events || 0),
        interference_total: Number(scored?.interference_total || 0),
      };
    })
    .sort((a: any, b: any) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }

      if (b.correct_picks !== a.correct_picks) {
        return b.correct_picks - a.correct_picks;
      }

      return a.display_name.localeCompare(b.display_name);
    });

  return (
    <main className="page">
      <RealtimeRefresh table="event_results" />
      <RealtimeRefresh table="events" />
      <RealtimeRefresh table="picks" />
      <RealtimeRefresh table="league_members" />

      <PageHero
        title="Leaderboard"
        subtitle="View every active member in your league standings."
      />

      {params.message && (
        <p className="mb-4 rounded-xl border border-blue-700 bg-blue-950 p-4 text-blue-100">
          {params.message}
        </p>
      )}

      {params.error && (
        <p className="mb-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
          {params.error}
        </p>
      )}

      {leagues.length === 0 ? (
        <section className="card">
          <h2 className="text-2xl font-black">No leagues yet</h2>

          <p className="mt-2 text-slate-300">
            Join or create a league first. Leaderboards are only available for
            leagues you belong to.
          </p>
        </section>
      ) : (
        <>
          <section className="card mb-6">
            <form
              className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end"
              action="/leaderboard"
              method="get"
            >
              <label>
                Select League Leaderboard
                <select name="league" defaultValue={selectedLeagueId}>
                  {leagues.map((league: any) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </label>

              <button className="btn-primary" type="submit">
                View Leaderboard
              </button>
            </form>

            <p className="mt-4 text-sm text-slate-300">
              Showing standings for:{" "}
              <span className="font-black text-white">
                {selectedLeague?.name || "Selected league"}
              </span>{" "}
              · {rows.length} active member{rows.length === 1 ? "" : "s"}
            </p>
          </section>

          {activeMembersError && (
            <p className="mb-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
              Could not load league members: {activeMembersError.message}
            </p>
          )}

          {rowsError && (
            <p className="mb-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
              Could not load scored leaderboard rows: {rowsError.message}
            </p>
          )}

          <section className="card overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-blue-300">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Player</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Total Points</th>
                  <th className="p-3">Correct</th>
                  <th className="p-3">Wrong</th>
                  <th className="p-3">Perfect Events</th>
                  <th className="p-3">Interference +/-</th>
                </tr>
              </thead>

              <tbody>
                {rows.length > 0 ? (
                  rows.map((row: any, index: number) => (
                    <tr
                      key={`${row.league_id}-${row.user_id}`}
                      className="border-b border-slate-900"
                    >
                      <td className="p-3 font-black text-blue-200">
                        #{index + 1}
                      </td>

                      <td className="p-3 font-bold">
                        {row.display_name}
                      </td>

                      <td className="p-3">
                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-200">
                          {row.role}
                        </span>
                      </td>

                      <td className="p-3 font-black text-red-300">
                        {row.total_points}
                      </td>

                      <td className="p-3">{row.correct_picks}</td>

                      <td className="p-3">{row.wrong_picks}</td>

                      <td className="p-3">{row.perfect_events}</td>

                      <td
                        className={`p-3 font-bold ${
                          Number(row.interference_total || 0) < 0
                            ? "text-red-300"
                            : Number(row.interference_total || 0) > 0
                              ? "text-green-300"
                              : "text-slate-300"
                        }`}
                      >
                        {row.interference_total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-4 text-slate-300" colSpan={8}>
                      No active members found for this league.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
