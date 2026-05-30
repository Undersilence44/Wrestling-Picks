import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createLeague, joinPublicLeague } from "./actions";

type SearchParams = Promise<{
  error?: string;
  message?: string;
}>;

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

  if (!user) {
    redirect("/login?message=Please login to view leagues");
  }

  const { data: memberships } = await supabase
    .from("league_members")
    .select(
      "league_id, role, leagues(id, name, description, visibility, scoring_type, fixed_points, perfect_bonus)"
    )
    .eq("user_id", user.id)
    .eq("status", "active");

  const joinedLeagueIds = new Set(
    (memberships || []).map((membership: any) => membership.league_id)
  );

  const { data: publicLeagues } = await supabase
    .from("leagues")
    .select("id,name,description,visibility,scoring_type,perfect_bonus")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  const { data: memberCounts } = await supabase.rpc(
    "get_public_league_member_counts"
  );

  const memberCountMap = new Map<string, number>();

  for (const row of memberCounts || []) {
    memberCountMap.set(row.league_id, Number(row.member_count || 0));
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
        <Image
          src="/home/cta-panel-bg.png"
          alt="Leagues background"
          fill
          priority
          className="object-cover opacity-55"
        />

        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-blue-300">
            Leagues
          </p>

          <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
            Build Your Season
          </h1>

          <p className="mt-4 max-w-3xl text-slate-300">
            Join public leagues, manage your active leagues, or create your own
            fantasy wrestling season.
          </p>
        </div>
      </section>

      {params.message && (
        <p className="mt-6 rounded-2xl border border-blue-700 bg-blue-950/80 p-4 text-blue-100">
          {params.message}
        </p>
      )}

      {params.error && (
        <p className="mt-6 rounded-2xl border border-red-700 bg-red-950/80 p-4 text-red-100">
          {params.error}
        </p>
      )}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="card">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-300">
              My Leagues
            </p>

            <h2 className="mt-3 text-3xl font-black uppercase text-white">
              Your Active Leagues
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {memberships && memberships.length > 0 ? (
                memberships.map((membership: any) => {
                  const league = membership.leagues;
                  const memberCount = memberCountMap.get(membership.league_id);

                  return (
                    <div
                      key={membership.league_id}
                      className="rounded-[26px] border border-white/10 bg-black/45 p-5 transition hover:-translate-y-1 hover:border-yellow-500/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black uppercase text-white">
                            {league?.name || "League"}
                          </h3>

                          <p className="mt-2 text-sm text-slate-300">
                            {league?.description || "No description yet."}
                          </p>
                        </div>

                        <span className="rounded-full border border-yellow-600 bg-yellow-950/60 px-3 py-1 text-xs font-black uppercase text-yellow-200">
                          {membership.role}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Scoring
                          </p>
                          <p className="mt-1 font-black uppercase text-blue-300">
                            {league?.scoring_type || "Ranked"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Members
                          </p>
                          <p className="mt-1 font-black uppercase text-red-300">
                            {memberCount ?? "—"}/30
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <Link
                          href={`/leagues/${membership.league_id}`}
                          className="btn-primary text-center"
                        >
                          View
                        </Link>

                        {["LM", "ALM"].includes(membership.role) && (
                          <Link href="/admin" className="btn-dark text-center">
                            Manage
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-300">
                  You have not joined any leagues yet.
                </p>
              )}
            </div>
          </section>

          <section className="card">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
              Public Leagues
            </p>

            <h2 className="mt-3 text-3xl font-black uppercase text-white">
              Browse Open Leagues
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {publicLeagues && publicLeagues.length > 0 ? (
                publicLeagues.map((league: any) => {
                  const alreadyJoined = joinedLeagueIds.has(league.id);
                  const memberCount = memberCountMap.get(league.id) || 0;
                  const isFull = memberCount >= 30;

                  return (
                    <div
                      key={league.id}
                      className="rounded-[26px] border border-white/10 bg-black/45 p-5 transition hover:-translate-y-1 hover:border-blue-500/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black uppercase text-white">
                            {league.name}
                          </h3>

                          <p className="mt-2 text-sm text-slate-300">
                            {league.description || "No description yet."}
                          </p>
                        </div>

                        {alreadyJoined && (
                          <span className="rounded-full border border-green-700 bg-green-950/70 px-3 py-1 text-xs font-black uppercase text-green-200">
                            Joined
                          </span>
                        )}
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Members
                          </p>
                          <p className="mt-1 font-black text-red-300">
                            {memberCount}/30
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Scoring
                          </p>
                          <p className="mt-1 font-black uppercase text-blue-300">
                            {league.scoring_type}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <Link
                          href={`/leagues/${league.id}`}
                          className="btn-dark text-center"
                        >
                          View
                        </Link>

                        {!alreadyJoined && !isFull && (
                          <form action={joinPublicLeague}>
                            <input
                              type="hidden"
                              name="league_id"
                              value={league.id}
                            />
                            <button
                              className="btn-primary w-full"
                              type="submit"
                            >
                              Join
                            </button>
                          </form>
                        )}

                        {!alreadyJoined && isFull && (
                          <p className="rounded-2xl border border-red-800 bg-red-950/50 px-4 py-3 text-center text-sm font-black text-red-100">
                            Full
                          </p>
                        )}
                      </div>
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
        </div>

        <aside className="card">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
            Create League
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            Start A New Season
          </h2>

          <form action={createLeague} className="mt-6 space-y-4">
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
              <select name="visibility" defaultValue="public">
                <option value="public">Public</option>
                <option value="private">Private Invite Only</option>
              </select>
            </label>

            <label>
              Scoring Type
              <select name="scoring_type" defaultValue="ranked">
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

            <button className="btn-danger w-full" type="submit">
              Create League
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
