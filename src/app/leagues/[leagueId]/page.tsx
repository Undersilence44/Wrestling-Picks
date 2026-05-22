import Link from "next/link";
import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function memberName(member: any, profileMap: Map<string, any>) {
  const profile = profileMap.get(member.user_id);

  return (
    profile?.display_name ||
    profile?.full_name ||
    profile?.email ||
    member.user_id
  );
}

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/signup?message=Must be a member to view the league page"
    );
  }

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .select(
      "id, name, description, visibility, scoring_type, fixed_points, perfect_bonus, created_at"
    )
    .eq("id", leagueId)
    .maybeSingle();

  if (leagueError || !league) {
    redirect("/leagues?error=League not found");
  }

  const { data: currentMembership } = await supabase
    .from("league_members")
    .select("id, role, status")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!currentMembership) {
    redirect(
      "/signup?message=Must be a member to view the league page"
    );
  }

  const { data: members } = await supabase
    .from("league_members")
    .select("id, league_id, user_id, role, status, created_at")
    .eq("league_id", league.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const memberUserIds = Array.from(
    new Set(
      (members || [])
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

  const { data: events } = await supabase
    .from("events")
    .select("id, name, event_date, status")
    .eq("league_id", league.id)
    .order("event_date", { ascending: false })
    .limit(5);

  const isFixedLeague = league.scoring_type === "fixed";
  const isRankedLeague = league.scoring_type === "ranked";

  return (
    <main className="page">
      <PageHero
        title={league.name}
        subtitle={
          league.description || "Wrestling picks league"
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/leagues" className="btn-primary">
          Back to Leagues
        </Link>

        <Link
          href={`/events?league=${league.id}`}
          className="btn-primary"
        >
          View Events
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="card">
          <h2 className="text-2xl font-black">
            League Info
          </h2>

          <div className="mt-5 space-y-3 text-slate-300">
            <p>
              <span className="font-bold text-white">
                Visibility:
              </span>{" "}
              {league.visibility}
            </p>

            <p>
              <span className="font-bold text-white">
                Scoring:
              </span>{" "}
              {league.scoring_type}
            </p>

            {isFixedLeague && (
              <>
                <p>
                  <span className="font-bold text-white">
                    Fixed points:
                  </span>{" "}
                  {league.fixed_points}
                </p>

                <p>
                  <span className="font-bold text-white">
                    Perfect bonus:
                  </span>{" "}
                  {league.perfect_bonus}
                </p>
              </>
            )}

            {isRankedLeague && (
              <p className="rounded-xl border border-blue-900 bg-blue-950/20 p-3 text-sm text-blue-100">
                Ranked confidence scoring is enabled.
                Fixed points and perfect bonus do not
                apply to this league.
              </p>
            )}

            <p>
              <span className="font-bold text-white">
                Members:
              </span>{" "}
              {members?.length || 0}/30
            </p>

            <p>
              <span className="font-bold text-white">
                Your role:
              </span>{" "}
              {currentMembership.role}
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-black">
            Current Members
          </h2>

          {!members || members.length === 0 ? (
            <p className="mt-4 text-slate-300">
              No members found.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-black/30 p-4"
                >
                  <div>
                    <p className="font-black text-white">
                      {memberName(member, profileMap)}
                    </p>

                    <p className="text-sm text-slate-400">
                      Joined{" "}
                      {member.created_at
                        ? new Date(
                            member.created_at
                          ).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>

                  <span className="rounded-full border border-blue-600 bg-blue-950 px-3 py-1 text-xs font-bold text-blue-100">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="card mt-6">
        <h2 className="text-2xl font-black">
          Recent Events
        </h2>

        {!events || events.length === 0 ? (
          <p className="mt-4 text-slate-300">
            No events have been created for this league
            yet.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {events.map((event: any) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-black/30 p-4"
              >
                <div>
                  <p className="font-black text-white">
                    {event.name}
                  </p>

                  <p className="text-sm text-slate-400">
                    {event.event_date
                      ? new Date(
                          event.event_date
                        ).toLocaleString()
                      : "No date set"}{" "}
                    · {event.status}
                  </p>
                </div>

                <Link
                  href={`/events/${event.id}`}
                  className="btn-dark py-2"
                >
                  View Event
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
