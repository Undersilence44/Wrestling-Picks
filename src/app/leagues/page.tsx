import Link from "next/link";
import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
import { createLeague, joinPublicLeague } from "./actions";

type SearchParams = Promise<{
  error?: string;
  message?: string;
}>;

type PublicLeague = {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  scoring_type: string;
  perfect_bonus: number;
};

export default async function LeaguesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: leagues } = await supabase
    .from("leagues")
    .select(
      "id,name,description,visibility,scoring_type,perfect_bonus"
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  const { data: memberCounts } = await supabase.rpc(
    "get_public_league_member_counts"
  );

  const memberCountMap = new Map<string, number>();

  for (const row of memberCounts || []) {
    memberCountMap.set(row.league_id, row.member_count);
  }

  let joinedLeagueIds = new Set<string>();

  if (user) {
    const { data: memberships } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("user_id", user.id)
      .eq("status", "active");

    joinedLeagueIds = new Set(
      (memberships || []).map(
        (membership) => membership.league_id as string
      )
    );
  }

  return (
    <main className="page">
      <PageHero
        title="Leagues"
        subtitle="Browse public leagues or create your own as League Manager."
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-2xl font-black">
            Public Leagues
          </h2>

          <div className="space-y-4">
            {leagues?.length ? (
              (leagues as PublicLeague[]).map((league) => {
                const alreadyJoined = joinedLeagueIds.has(
                  league.id
                );

                const memberCount =
                  memberCountMap.get(league.id) || 0;

                const isFull = memberCount >= 30;

                return (
                  <div
                    key={league.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link
                          href={`/leagues/${league.id}`}
                          className="text-xl font-black text-white hover:text-blue-300"
                        >
                          {league.name}
                        </Link>

                        <p className="text-slate-300">
                          {league.description ||
                            "No description yet."}
                        </p>

                        <p className="mt-2 text-sm text-blue-300">
                          Scoring: {league.scoring_type} ·
                          Perfect bonus: {league.perfect_bonus} ·
                          Members: {memberCount}/30
                        </p>
                      </div>

                      {alreadyJoined && (
                        <span className="rounded-full border border-blue-700 bg-blue-950 px-3 py-1 text-sm font-bold text-blue-100">
                          Joined
                        </span>
                      )}
                    </div>

                    {user && !alreadyJoined && !isFull && (
                      <form
                        action={joinPublicLeague}
                        className="mt-3"
                      >
                        <input
                          type="hidden"
                          name="league_id"
                          value={league.id}
                        />

                        <button
                          className="btn-primary py-2"
                          type="submit"
                        >
                          Join
                        </button>
                      </form>
                    )}

                    {user && !alreadyJoined && isFull && (
                      <p className="mt-3 rounded-xl border border-red-800 bg-red-950/40 px-3 py-2 text-sm font-bold text-red-100">
                        League full
                      </p>
                    )}

                    <Link
                      href={`/leagues/${league.id}`}
                      className="mt-3 inline-block text-sm font-bold text-blue-300 hover:text-blue-100"
                    >
                      View members
                    </Link>

                    {!user && (
                      <p className="mt-3 text-sm text-slate-400">
                        Login or create an account to join this
                        league.
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-slate-300">
                No public leagues have been created yet.
              </p>
            )}
          </div>
        </section>

        <section className="card">
          <h2 className="mb-4 text-2xl font-black">
            Create League
          </h2>

          {user ? (
            <form
              action={createLeague}
              className="space-y-4"
            >
              <label>
                League Name
                <input name="name" required />
              </label>

              <label>
                Description
                <textarea name="description" />
              </label>

              <label>
                Visibility
                <select
                  name="visibility"
                  defaultValue="public"
                >
                  <option value="public">Public</option>

                  <option value="private">
                    Private Invite Only
                  </option>
                </select>
              </label>

              <label>
                Scoring Type
                <select
                  name="scoring_type"
                  defaultValue="ranked"
                >
                  <option value="ranked">Ranked</option>

                  <option value="fixed">Fixed</option>

                  <option value="fantasy" disabled>
                    Fantasy League Coming Soon
                  </option>
                </select>
              </label>

              <label>
                Fixed Points Per Correct Pick
                <input
                  name="fixed_points"
                  type="number"
                  defaultValue="1"
                  min="1"
                />
              </label>

              <label>
                Perfect Event Bonus
                <input
                  name="perfect_bonus"
                  type="number"
                  defaultValue="5"
                  min="0"
                />
              </label>

              <button
                className="btn-danger w-full"
                type="submit"
              >
                Create League
              </button>
            </form>
          ) : (
            <p className="text-slate-300">
              Login to create a league.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
