import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";

type ProfileLite = {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
};

type MemberLite = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
};

function memberLabel(member: MemberLite, profile?: ProfileLite, currentUserEmail?: string | null) {
  if (profile?.display_name) return profile.display_name;
  if (profile?.full_name) return profile.full_name;
  if (profile?.email) return profile.email;
  if (currentUserEmail && member.user_id) return currentUserEmail;
  return `User ${member.user_id.slice(0, 8)}`;
}

export default async function LeagueDetailPage({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("league_members")
    .select("role,status")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const { data: league } = await supabase
    .from("leagues")
    .select("id,name,description,visibility,scoring_type,perfect_bonus,fixed_points,created_at")
    .eq("id", leagueId)
    .maybeSingle();

  if (!league) notFound();

  if (league.visibility !== "public" && !membership) {
    redirect("/leagues?error=You must be a member to view that private league");
  }

  // Load members first without a profiles join. This avoids hiding members when a profile row is missing
  // or when profile RLS blocks the relationship join.
  const { data: members, error: membersError } = await supabase
    .from("league_members")
    .select("id,user_id,role,status,created_at")
    .eq("league_id", leagueId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const activeMembers = (members || []) as MemberLite[];
  const memberUserIds = activeMembers.map((member) => member.user_id);

  let profilesById = new Map<string, ProfileLite>();
  if (memberUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,display_name,full_name,email")
      .in("id", memberUserIds);

    profilesById = new Map((profiles || []).map((profile: any) => [profile.id, profile as ProfileLite]));
  }

  const { data: events } = await supabase
    .from("events")
    .select("id,name,event_date,status")
    .eq("league_id", leagueId)
    .order("event_date", { ascending: false })
    .limit(10);

  const memberCount = activeMembers.length;
  const isAdmin = membership?.role === "LM" || membership?.role === "ALM";

  return (
    <main className="page">
      <PageHero title={league.name} subtitle={league.description || "League details, members, and recent events."} />

      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/leagues" className="btn-primary inline-block py-2">Back to Leagues</Link>
        {membership && <Link href="/events" className="btn-primary inline-block py-2">View Events</Link>}
        {isAdmin && <Link href="/admin" className="btn-danger inline-block py-2">Admin Dashboard</Link>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-1">
          <h2 className="mb-4 text-2xl font-black">League Info</h2>
          <div className="space-y-3 text-slate-300">
            <p><span className="font-bold text-white">Visibility:</span> {league.visibility}</p>
            <p><span className="font-bold text-white">Scoring:</span> {league.scoring_type}</p>
            <p><span className="font-bold text-white">Fixed points:</span> {league.fixed_points}</p>
            <p><span className="font-bold text-white">Perfect bonus:</span> {league.perfect_bonus}</p>
            <p><span className="font-bold text-white">Members:</span> {memberCount}/30</p>
            {membership && <p><span className="font-bold text-white">Your role:</span> {membership.role}</p>}
          </div>
        </section>

        <section className="card lg:col-span-2">
          <h2 className="mb-4 text-2xl font-black">Current Members</h2>
          {membersError && (
            <p className="mb-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
              Could not load members: {membersError.message}
            </p>
          )}
          <div className="space-y-3">
            {activeMembers.length ? activeMembers.map((member) => {
              const profile = profilesById.get(member.user_id);
              const label = memberLabel(member, profile, member.user_id === user.id ? user.email : null);
              return (
                <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div>
                    <p className="font-black text-white">{label}</p>
                    <p className="text-sm text-slate-400">Joined {new Date(member.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="rounded-full border border-blue-700 bg-blue-950 px-3 py-1 text-xs font-bold text-blue-100">{member.role}</span>
                </div>
              );
            }) : <p className="text-slate-300">No active members found.</p>}
          </div>
        </section>
      </div>

      <section className="card mt-6">
        <h2 className="mb-4 text-2xl font-black">Recent Events</h2>
        <div className="space-y-3">
          {events?.length ? events.map((event: any) => (
            <Link key={event.id} href={`/events/${event.id}`} className="block rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-blue-500">
              <h3 className="font-black text-white">{event.name}</h3>
              <p className="text-sm text-slate-300">{new Date(event.event_date).toLocaleString()} · {event.status}</p>
            </Link>
          )) : <p className="text-slate-300">No events have been created for this league yet.</p>}
        </div>
      </section>
    </main>
  );
}
