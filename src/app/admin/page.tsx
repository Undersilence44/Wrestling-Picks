import Link from "next/link";
import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  assignAlm,
  deleteEventFromAdminList,
  deleteLeague,
  removeAlm,
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

  const roleByLeagueId = new Map<string, string>();

  for (const membership of adminMemberships || []) {
    roleByLeagueId.set(membership.league_id, membership.role);
  }

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

  return (
    <main className="page">
      <PageHero
        title="Admin Dashboard"
        subtitle="LM/ALM management for events, matches, winners, and league settings."
      />

      {sp.message && (
        <p className="mb-4 rounded-xl border border-blue-700 bg-blue-950 p-4 text-blue-100">
          {sp.message}
        </p>
      )}

      {sp.error && (
        <p className="mb-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
          {sp.error}
        </p>
      )}

      {managedMembersError && (
        <p className="mb-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
          Could not load league members: {managedMembersError.message}
        </p>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/admin/events/new" className="btn-danger inline-block">
          Create Event
        </Link>
      </div>

      <section className="card">
        <h2 className="mb-4 text-2xl font-black">Your Admin Leagues</h2>

        <div className="grid gap-3 md:grid-cols-2">
          {adminMemberships?.map((membership: any) => (
            <div
              key={membership.league_id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <p className="text-lg font-black">{membership.leagues?.name}</p>
              <p className="text-sm text-blue-300">Role: {membership.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 card">
        <h2 className="mb-2 text-2xl font-black">Edit Events By League</h2>

        <p className="mb-5 text-sm text-slate-300">
          Open each league dropdown to edit events for that league. LM users can
          also delete events.
        </p>

        <div className="space-y-4">
          {adminMemberships?.map((membership: any) => {
            const leagueEvents = eventsByLeague.get(membership.league_id) || [];
            const eventRole = roleByLeagueId.get(membership.league_id) || "";
            const canDeleteEvents = eventRole === "LM";

            return (
              <details
                key={membership.league_id}
                className="rounded-2xl border border-slate-800 bg-black/30 p-4"
              >
                <summary className="cursor-pointer text-xl font-black text-white">
                  {membership.leagues?.name}{" "}
                  <span className="text-sm font-bold text-blue-300">
                    ({membership.role}) · {leagueEvents.length} event
                    {leagueEvents.length === 1 ? "" : "s"}
                  </span>
                </summary>

                <div className="mt-4 space-y-3">
                  {leagueEvents.length === 0 ? (
                    <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-slate-300">
                      No events yet for this league.
                    </p>
                  ) : (
                    leagueEvents.map((event: any) => (
                      <div
                        key={event.id}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black">{event.name}</h3>

                            <p className="text-slate-300">
                              {new Date(event.event_date).toLocaleString()} ·{" "}
                              {event.status}
                            </p>

                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                              Your role for this event: {eventRole}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              className="btn-primary py-2"
                              href={`/admin/events/${event.id}/edit`}
                            >
                              Edit
                            </Link>

                            {canDeleteEvents && (
                              <a
                                className="rounded-xl border border-red-700 px-4 py-2 text-sm font-black text-red-100 hover:bg-red-950"
                                href={`/admin/events/${event.id}/edit#delete-event`}
                              >
                                Delete
                              </a>
                            )}
                          </div>
                        </div>

                        {canDeleteEvents ? (
                          <details className="mt-4 rounded-xl border border-red-900 bg-red-950/20 p-3">
                            <summary className="cursor-pointer font-black text-red-100">
                              LM Quick Delete
                            </summary>

                            <p className="mt-2 text-sm text-red-100/80">
                              This removes the event, matches, picks,
                              interference bets, and event leaderboard points.
                              Type DELETE to confirm.
                            </p>

                            <form
                              action={deleteEventFromAdminList}
                              className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end"
                            >
                              <input
                                type="hidden"
                                name="event_id"
                                value={event.id}
                              />

                              <label>
                                Confirm Delete
                                <input
                                  name="confirm_delete"
                                  placeholder="DELETE"
                                  required
                                />
                              </label>

                              <button
                                className="rounded-xl bg-red-700 px-5 py-3 font-black text-white hover:bg-red-800"
                                type="submit"
                              >
                                Delete Event
                              </button>
                            </form>
                          </details>
                        ) : (
                          <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300">
                            Delete hidden: only the LM for this event&apos;s
                            league can delete it.
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {lmLeagueIds.length > 0 && (
        <section className="mt-6 card">
          <h2 className="mb-4 text-2xl font-black">League Manager Controls</h2>

          <div className="space-y-5">
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

              return (
                <div
                  key={membership.league_id}
                  className="rounded-2xl border border-slate-800 bg-black/30 p-4"
                >
                  <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-black">
                        {membership.leagues?.name}
                      </h3>

                      <p className="text-sm text-slate-300">
                        Only the LM can assign/remove ALM or delete the league.
                      </p>
                    </div>

                    <span className="rounded-full border border-red-700 bg-red-950 px-3 py-1 text-xs font-bold text-red-100">
                      LM ONLY
                    </span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-blue-900 bg-blue-950/20 p-4">
                      <h4 className="mb-3 font-black">
                        Assign Assistant League Manager
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
                            <option value="">
                              Choose an active league member
                            </option>

                            {assignableMembers.map((member: any) => (
                              <option key={member.id} value={member.id}>
                                {displayMemberName(member, profileMap)} (
                                {member.role})
                              </option>
                            ))}
                          </select>
                        </label>

                        {assignableMembers.length === 0 && (
                          <p className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                            No eligible members yet. A user must join this
                            league first before they can be assigned as ALM.
                          </p>
                        )}

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
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 p-2"
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
                                className="rounded-lg border border-slate-700 px-3 py-1 text-xs font-bold hover:border-red-500"
                                type="submit"
                              >
                                Remove ALM
                              </button>
                            </form>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-red-900 bg-red-950/20 p-4">
                      <h4 className="mb-3 font-black text-red-100">
                        Transfer League Manager
                      </h4>

                      <p className="mb-3 text-sm text-red-100/80">
                        Assign a new LM if the current creator/manager wants to
                        step down or leave. The selected member becomes LM and
                        the current LM becomes a regular member.
                      </p>

                      <form action={transferLm} className="space-y-3">
                        <input
                          type="hidden"
                          name="league_id"
                          value={membership.league_id}
                        />

                        <label>
                          New League Manager
                          <select name="member_id" required defaultValue="">
                            <option value="">
                              Choose an active league member
                            </option>

                            {transferLmMembers.map((member: any) => (
                              <option key={member.id} value={member.id}>
                                {displayMemberName(member, profileMap)} (
                                {member.role})
                              </option>
                            ))}
                          </select>
                        </label>

                        {transferLmMembers.length === 0 && (
                          <p className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                            No other active members are available to become LM
                            yet.
                          </p>
                        )}

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

                    <div className="rounded-xl border border-red-900 bg-red-950/20 p-4 lg:col-span-2">
                      <h4 className="mb-3 font-black text-red-100">
                        Delete League
                      </h4>

                      <p className="mb-3 text-sm text-red-100/80">
                        This permanently deletes the league and cascades its
                        events, matches, picks, bets, and results.
                      </p>

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

                        <button
                          className="btn-danger w-full py-2"
                          type="submit"
                        >
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
