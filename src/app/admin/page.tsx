import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  assignAlm,
  deleteLeague,
  removeAlm,
  removeLeagueMember,
  transferLm,
} from "./actions";

function displayMemberName(member: any, profileMap: Map<string, any>) {
  const profile = profileMap.get(member.user_id);

  return (
    profile?.display_name ||
    profile?.full_name ||
    profile?.email ||
    member.user_id
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: adminMemberships, error: adminError } = await supabase
    .from("league_members")
    .select("league_id, role, leagues(id, name, description, visibility)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["LM", "ALM"]);

  if (adminError) {
    redirect(`/leagues?error=${encodeURIComponent(adminError.message)}`);
  }

  const adminLeagueIds = (adminMemberships || []).map(
    (membership: any) => membership.league_id
  );

  if (adminLeagueIds.length === 0) {
    redirect(
      "/leagues?error=Only League Managers and Assistant League Managers can access the admin dashboard"
    );
  }

  const lmMemberships = (adminMemberships || []).filter(
    (membership: any) => membership.role === "LM"
  );

  const lmLeagueIds = lmMemberships.map(
    (membership: any) => membership.league_id
  );

  const canCreateEvents = lmLeagueIds.length > 0;

  const { data: events } = await supabase
    .from("events")
    .select("id,name,event_date,status,league_id,leagues(name)")
    .in("league_id", adminLeagueIds)
    .order("event_date", { ascending: false });

  const eventsByLeague = new Map<string, any[]>();

  for (const event of events || []) {
    const list = eventsByLeague.get(event.league_id) || [];
    list.push(event);
    eventsByLeague.set(event.league_id, list);
  }

  const { data: managedMembers, error: managedMembersError } =
    lmLeagueIds.length
      ? await supabase
          .from("league_members")
          .select("id, league_id, user_id, role, status, created_at")
          .in("league_id", lmLeagueIds)
          .eq("status", "active")
          .order("created_at", { ascending: true })
      : { data: [] as any[], error: null };

  const memberUserIds = Array.from(
    new Set(
      (managedMembers || [])
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

  const membersByLeague = new Map<string, any[]>();

  for (const member of managedMembers || []) {
    const list = membersByLeague.get(member.league_id) || [];
    list.push(member);
    membersByLeague.set(member.league_id, list);
  }

  const openEvents = (events || []).filter(
    (event: any) => event.status === "open"
  );

  const finalEvents = (events || []).filter(
    (event: any) => event.status === "final"
  );

  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 lg:px-10">
      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
        <Image
          src="/home/cta-panel-bg.png"
          alt="Admin background"
          fill
          priority
          className="object-cover opacity-60"
        />

        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.45em] text-red-300">
              Admin Dashboard
            </p>

            <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
              Command Center
            </h1>

            <p className="mt-4 max-w-3xl text-slate-300">
              Manage events, league members, assistant managers, winners,
              scoring, and league controls.
            </p>
          </div>

          {canCreateEvents && (
            <Link href="/admin/events/new" className="btn-danger text-center">
              Create Event
            </Link>
          )}
        </div>
      </section>

      {sp.message && (
        <p className="mt-6 rounded-2xl border border-blue-700 bg-blue-950/80 p-4 text-blue-100">
          {sp.message}
        </p>
      )}

      {sp.error && (
        <p className="mt-6 rounded-2xl border border-red-700 bg-red-950/80 p-4 text-red-100">
          {sp.error}
        </p>
      )}

      {managedMembersError && (
        <p className="mt-6 rounded-2xl border border-red-700 bg-red-950/80 p-4 text-red-100">
          Could not load league members: {managedMembersError.message}
        </p>
      )}

      <section className="mt-6 grid gap-5 md:grid-cols-4">
        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">
            Admin Leagues
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {adminMemberships?.length || 0}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-red-300">
            Open Events
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {openEvents.length}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-green-300">
            Final Events
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {finalEvents.length}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">
            LM Leagues
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">
            {lmMemberships.length}
          </h2>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="card">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-300">
            Your Admin Leagues
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            League Access
          </h2>

          <div className="mt-6 grid gap-4">
            {adminMemberships?.map((membership: any) => {
              const leagueEvents = eventsByLeague.get(membership.league_id) || [];

              return (
                <div
                  key={membership.league_id}
                  className="rounded-[26px] border border-white/10 bg-black/45 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-black uppercase text-white">
                        {membership.leagues?.name}
                      </h3>

                      <p className="mt-2 text-sm text-slate-300">
                        {membership.leagues?.description || "No description yet."}
                      </p>
                    </div>

                    <span className="rounded-full border border-yellow-600 bg-yellow-950/60 px-3 py-1 text-xs font-black uppercase text-yellow-200">
                      {membership.role}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Events
                      </p>
                      <p className="mt-1 text-2xl font-black text-blue-300">
                        {leagueEvents.length}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Visibility
                      </p>
                      <p className="mt-1 font-black uppercase text-red-300">
                        {membership.leagues?.visibility}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Link
                      href={`/leagues/${membership.league_id}`}
                      className="btn-primary text-center"
                    >
                      View League
                    </Link>

                    {membership.role === "LM" && (
                      <Link
                        href="/admin/events/new"
                        className="btn-dark text-center"
                      >
                        New Event
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
            Event Management
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            Edit Events By League
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Select a league, then choose the event you want to edit.
          </p>

          <div className="mt-6 space-y-5">
            {adminMemberships?.map((membership: any) => {
              const leagueEvents = eventsByLeague.get(membership.league_id) || [];

              return (
                <div
                  key={membership.league_id}
                  className="rounded-[26px] border border-white/10 bg-black/45 p-5"
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-black uppercase text-white">
                        {membership.leagues?.name}
                      </h3>

                      <p className="text-sm text-slate-400">
                        {membership.role} · {leagueEvents.length} event
                        {leagueEvents.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  {leagueEvents.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-black/40 p-4 text-slate-300">
                      No events yet for this league.
                    </p>
                  ) : (
                    <form className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                      <label>
                        Select Event
                        <select name="event_id" defaultValue="">
                          <option value="">Choose an event to edit</option>
                          {leagueEvents.map((event: any) => (
                            <option key={event.id} value={event.id}>
                              {event.name} — {event.status} —{" "}
                              {event.event_date
                                ? new Date(event.event_date).toLocaleDateString()
                                : "No date"}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        formAction={async (formData: FormData) => {
                          "use server";

                          const eventId = String(
                            formData.get("event_id") || ""
                          );

                          if (!eventId) {
                            redirect(
                              "/admin?error=Choose an event before editing"
                            );
                          }

                          redirect(`/admin/events/${eventId}/edit`);
                        }}
                        className="btn-primary"
                        type="submit"
                      >
                        Edit Event
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </section>

      {lmLeagueIds.length > 0 && (
        <section className="card mt-6">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-red-300">
            League Manager Controls
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            LM Tools
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Assign ALMs, remove members, transfer LM ownership, or delete a
            league.
          </p>

          <div className="mt-6 space-y-6">
            {lmMemberships.map((membership: any) => {
              const leagueMembers =
                membersByLeague.get(membership.league_id) || [];

              const assignableMembers = leagueMembers.filter(
                (member: any) => member.role !== "LM" && member.role !== "ALM"
              );

              const transferLmMembers = leagueMembers.filter(
                (member: any) => member.role !== "LM"
              );

              const almMembers = leagueMembers.filter(
                (member: any) => member.role === "ALM"
              );

              const removableMembers = leagueMembers.filter(
                (member: any) =>
                  member.role !== "LM" && member.user_id !== user.id
              );

              return (
                <div
                  key={membership.league_id}
                  className="rounded-[28px] border border-white/10 bg-black/40 p-5"
                >
                  <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-2xl font-black uppercase text-white">
                        {membership.leagues?.name}
                      </h3>

                      <p className="text-sm text-slate-300">
                        Only the LM can assign/remove ALM, remove league
                        members, transfer LM, or delete the league.
                      </p>
                    </div>

                    <span className="rounded-full border border-red-700 bg-red-950 px-3 py-1 text-xs font-bold uppercase text-red-100">
                      LM Only
                    </span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-blue-900 bg-blue-950/20 p-4">
                      <h4 className="mb-3 font-black uppercase text-blue-100">
                        Assign ALM
                      </h4>

                      <form action={assignAlm} className="space-y-3">
                        <input
                          type="hidden"
                          name="league_id"
                          value={membership.league_id}
                        />

                        <label>
                          Member
                          <select name="member_id" required defaultValue="">
                            <option value="">Choose an active league member</option>

                            {assignableMembers.map((member: any) => (
                              <option key={member.id} value={member.id}>
                                {displayMemberName(member, profileMap)} (
                                {member.role})
                              </option>
                            ))}
                          </select>
                        </label>

                        <button
                          className="btn-primary w-full py-2"
                          type="submit"
                          disabled={assignableMembers.length === 0}
                        >
                          Assign ALM
                        </button>
                      </form>

                      {almMembers.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-bold text-blue-200">
                            Current ALM
                          </p>

                          {almMembers.map((member: any) => (
                            <form
                              key={member.id}
                              action={removeAlm}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 p-2"
                            >
                              <input
                                type="hidden"
                                name="league_id"
                                value={membership.league_id}
                              />

                              <input
                                type="hidden"
                                name="member_id"
                                value={member.id}
                              />

                              <span className="text-sm text-slate-200">
                                {displayMemberName(member, profileMap)}
                              </span>

                              <button
                                className="rounded-lg border border-white/10 px-3 py-1 text-xs font-bold hover:border-red-500"
                                type="submit"
                              >
                                Remove ALM
                              </button>
                            </form>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-orange-900 bg-orange-950/20 p-4">
                      <h4 className="mb-3 font-black uppercase text-orange-100">
                        Remove Member
                      </h4>

                      <form action={removeLeagueMember} className="space-y-3">
                        <input
                          type="hidden"
                          name="league_id"
                          value={membership.league_id}
                        />

                        <label>
                          Select Member
                          <select name="member_id" required defaultValue="">
                            <option value="">Choose an active member</option>

                            {removableMembers.map((member: any) => (
                              <option key={member.id} value={member.id}>
                                {displayMemberName(member, profileMap)} (
                                {member.role})
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Type REMOVE to confirm
                          <input
                            name="confirm_remove"
                            placeholder="REMOVE"
                            required
                          />
                        </label>

                        <button
                          className="w-full rounded-2xl bg-orange-700 px-4 py-3 font-black uppercase text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
                          type="submit"
                          disabled={removableMembers.length === 0}
                        >
                          Remove Member
                        </button>
                      </form>
                    </div>

                    <div className="rounded-2xl border border-red-900 bg-red-950/20 p-4">
                      <h4 className="mb-3 font-black uppercase text-red-100">
                        Transfer LM
                      </h4>

                      <form action={transferLm} className="space-y-3">
                        <input
                          type="hidden"
                          name="league_id"
                          value={membership.league_id}
                        />

                        <label>
                          New League Manager
                          <select name="member_id" required defaultValue="">
                            <option value="">Choose an active member</option>

                            {transferLmMembers.map((member: any) => (
                              <option key={member.id} value={member.id}>
                                {displayMemberName(member, profileMap)} (
                                {member.role})
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Type TRANSFER to confirm
                          <input
                            name="confirm_transfer"
                            placeholder="TRANSFER"
                            required
                          />
                        </label>

                        <button
                          className="btn-danger w-full py-2"
                          type="submit"
                          disabled={transferLmMembers.length === 0}
                        >
                          Transfer LM Role
                        </button>
                      </form>
                    </div>

                    <div className="rounded-2xl border border-red-900 bg-red-950/20 p-4">
                      <h4 className="mb-3 font-black uppercase text-red-100">
                        Delete League
                      </h4>

                      <form action={deleteLeague} className="space-y-3">
                        <input
                          type="hidden"
                          name="league_id"
                          value={membership.league_id}
                        />

                        <label>
                          Type DELETE to confirm
                          <input
                            name="confirm_delete"
                            placeholder="DELETE"
                            required
                          />
                        </label>

                        <button className="btn-danger w-full py-2" type="submit">
                          Delete League
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
