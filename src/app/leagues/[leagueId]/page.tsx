import Image from "next/image";
import Link from "next/link";
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

function roleClass(role: string) {
  if (role === "LM") return "border-red-700 bg-red-950 text-red-200";
  if (role === "ALM") return "border-blue-700 bg-blue-950 text-blue-200";
  return "border-white/10 bg-black/50 text-slate-200";
}

function statusClass(status: string) {
  if (status === "open") return "border-blue-700 bg-blue-950 text-blue-200";
  if (status === "final") return "border-green-700 bg-green-950 text-green-200";
  return "border-red-700 bg-red-950 text-red-200";
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
    redirect("/signup?message=Must be a member to view the league page");
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
    redirect("/signup?message=Must be a member to view the league page");
  }

  const { data: members } = await supabase
    .from("league_members")
    .select("id, league_id, user_id, role, status, created_at")
    .eq("league_id", league.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const memberUserIds = Array.from(
    new Set((members || []).map((member: any) => member.user_id).filter(Boolean))
  );

  const { data: profiles } = memberUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, full_name, email, avatar_url")
        .in("id", memberUserIds)
    : { data: [] as any[] };

  const profileMap = new Map<string, any>();

  for (const profile of profiles || []) {
    profileMap.set(profile.id, profile);
  }

  const { data: events } = await supabase
    .from("events")
    .select("id, name, event_date, status, thumbnail_url")
    .eq("league_id", league.id)
    .order("event_date", { ascending: false });

  const { data: standings } = await supabase
    .from("leaderboard_view")
    .select(
      "league_id, league_name, user_id, display_name, total_points, correct_picks, wrong_picks, perfect_events, interference_total"
    )
    .eq("league_id", league.id)
    .order("total_points", { ascending: false })
    .order("correct_picks", { ascending: false });

  const leagueEvents = events || [];
  const recentEvents = leagueEvents.slice(0, 6);
  const standingsRows = standings || [];

  const lmMember = (members || []).find((member: any) => member.role === "LM");
  const leagueManagerName = lmMember
    ? memberName(lmMember, profileMap)
    : "Not assigned";

  const leader = standingsRows[0];

  const perfectLeader = [...standingsRows].sort(
    (a: any, b: any) => Number(b.perfect_events || 0) - Number(a.perfect_events || 0)
  )[0];

  const isFixedLeague = league.scoring_type === "fixed";
  const isRankedLeague = league.scoring_type === "ranked";
  const canManage = ["LM", "ALM"].includes(currentMembership.role);

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
        <Image
          src="/home/cta-panel-bg.png"
          alt="League background"
          fill
          priority
          className="object-cover opacity-55"
        />

        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.45em] text-blue-300">
              League Home
            </p>

            <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
              {league.name}
            </h1>

            <p className="mt-4 max-w-3xl text-slate-300">
              {league.description || "Wrestling picks league"}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full border border-yellow-700 bg-yellow-950/50 px-4 py-2 text-xs font-black uppercase text-yellow-200">
                Your Role: {currentMembership.role}
              </span>

              <span className="rounded-full border border-blue-700 bg-blue-950/50 px-4 py-2 text-xs font-black uppercase text-blue-200">
                {league.scoring_type} Scoring
              </span>

              <span className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs font-black uppercase text-slate-200">
                {league.visibility}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/leagues" className="btn-dark text-center">
              Back To Leagues
            </Link>

            <Link href="/events" className="btn-primary text-center">
              View Events
            </Link>

            {canManage && (
              <Link href="/admin" className="btn-danger text-center">
                Manage
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-4">
        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">
            Members
          </p>

          <h2 className="mt-3 text-4xl font-black text-white">
            {members?.length || 0}/30
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-300">
            Events
          </p>

          <h2 className="mt-3 text-4xl font-black text-white">
            {leagueEvents.length}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-green-300">
            Perfect Picks Leader
          </p>

          <h2 className="mt-3 truncate text-2xl font-black text-white">
            {perfectLeader?.display_name || "No leader yet"}
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            {perfectLeader
              ? `${perfectLeader.perfect_events || 0} perfects`
              : "No finalized results"}
          </p>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">
            Season Leader
          </p>

          <h2 className="mt-3 truncate text-2xl font-black text-white">
            {leader?.display_name || "No leader yet"}
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            {leader ? `${leader.total_points} pts` : "No finalized results"}
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="card">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-300">
            League Info
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            Season Settings
          </h2>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                League Manager
              </p>

              <p className="mt-1 text-xl font-black text-white">
                {leagueManagerName}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Visibility
                </p>

                <p className="mt-1 font-black uppercase text-blue-300">
                  {league.visibility}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Scoring
                </p>

                <p className="mt-1 font-black uppercase text-red-300">
                  {league.scoring_type}
                </p>
              </div>
            </div>

            {isFixedLeague && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Fixed Points
                  </p>

                  <p className="mt-1 text-2xl font-black text-white">
                    {league.fixed_points}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Perfect Bonus
                  </p>

                  <p className="mt-1 text-2xl font-black text-white">
                    {league.perfect_bonus}
                  </p>
                </div>
              </div>
            )}

            {isRankedLeague && (
              <p className="rounded-2xl border border-blue-900 bg-blue-950/20 p-4 text-sm text-blue-100">
                Ranked confidence scoring is enabled. Fixed points and perfect
                bonus do not apply to this league.
              </p>
            )}
          </div>
        </section>

        <section className="card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
                Events
              </p>

              <h2 className="mt-3 text-3xl font-black uppercase text-white">
                Recent Events
              </h2>
            </div>

            <Link href="/events" className="btn-dark text-center">
              All Events
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {recentEvents.length > 0 ? (
              recentEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-black uppercase text-white">
                        {event.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {event.event_date
                          ? new Date(event.event_date).toLocaleString()
                          : "No date set"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${statusClass(
                        event.status
                      )}`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <Link
                    href={`/events/${event.id}`}
                    className={
                      event.status === "open"
                        ? "btn-danger mt-4 block text-center"
                        : "btn-primary mt-4 block text-center"
                    }
                  >
                    {event.status === "open" ? "Make Picks" : "View Results"}
                  </Link>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-black/40 p-4 text-slate-300">
                No events have been created for this league yet.
              </p>
            )}
          </div>
        </section>
      </section>

      <section className="card mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
              Members
            </p>

            <h2 className="mt-3 text-3xl font-black uppercase text-white">
              League Roster
            </h2>
          </div>

          <p className="text-sm text-slate-400">
            {members?.length || 0} active members
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {members && members.length > 0 ? (
            members.map((member: any) => {
              const profile = profileMap.get(member.user_id);
              const avatarUrl = profile?.avatar_url;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-yellow-500/40 bg-yellow-950 text-sm font-black text-white">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Member avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        memberName(member, profileMap).slice(0, 1)
                      )}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-black text-white">
                        {memberName(member, profileMap)}
                      </p>

                      <p className="text-xs text-slate-400">
                        Joined{" "}
                        {member.created_at
                          ? new Date(member.created_at).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${roleClass(
                      member.role
                    )}`}
                  >
                    {member.role}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-slate-300">No members found.</p>
          )}
        </div>
      </section>
    </main>
  );
}
