import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
import { deleteEvent, updateEvent, updateInterferenceBetPoints } from "./actions";
import { redirect } from "next/navigation";

const OPTION_KEYS = ["competitor_a", "competitor_b", "competitor_c", "competitor_d", "competitor_e", "competitor_f"] as const;

function optionValues(match: any) {
  return OPTION_KEYS.map((key) => match[key]).filter(Boolean);
}

function displayName(row: any) {
  return row.display_name || row.full_name || row.email || row.user_id;
}

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select("id,league_id,name,event_date,status,perfect_bonus,matches(id,match_order,match_title,competitor_a,competitor_b,competitor_c,competitor_d,competitor_e,competitor_f,winner)")
    .eq("id", eventId)
    .single();

  if (!event) redirect("/admin?error=Event not found");

  const { data: membership } = await supabase
    .from("league_members")
    .select("id, role")
    .eq("league_id", event.league_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["LM", "ALM"])
    .maybeSingle();

  if (!membership) redirect("/leagues?error=Only LM or ALM users can edit that event");
  const normalizedRole = String(membership.role || "").toUpperCase();
  const canDeleteEvent = normalizedRole === "LM";

  const sortedMatches = [...(event.matches || [])].sort((a: any, b: any) => a.match_order - b.match_order);

  const { data: interferenceSubmissions, error: interferenceError } = await supabase.rpc(
    "admin_get_interference_submissions",
    { target_event_id: event.id }
  );

  return (
    <main className="page max-w-6xl">
      <PageHero title="Edit Event" subtitle="Update event details, match titles, options, winners, status, perfect bonus, and interference scoring." />
      {sp.message && <p className="mb-4 rounded-xl border border-blue-700 bg-blue-950 p-4 text-blue-100">{sp.message}</p>}
      {sp.error && <p className="mb-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">{sp.error}</p>}
      {interferenceError && (
        <p className="mb-4 rounded-xl border border-red-700 bg-red-950 p-4 text-red-100">
          Could not load interference submissions: {interferenceError.message}. Run the v12 migration if you have not already.
        </p>
      )}

      <section className="card mb-6 border border-slate-800 bg-slate-950/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Your event admin role</p>
            <h2 className="text-xl font-black">{normalizedRole}</h2>
            <p className="text-sm text-slate-300">Only League Managers can delete events. ALMs can edit events, matches, winners, and interference scoring, but cannot delete events.</p>
          </div>
          {canDeleteEvent ? (
            <a href="#delete-event" className="rounded-xl border border-red-700 bg-red-700 px-4 py-3 text-center font-black text-white hover:bg-red-800">
              Jump to Delete Event
            </a>
          ) : (
            <span className="rounded-xl border border-slate-700 px-4 py-3 text-center text-sm font-bold text-slate-300">Delete hidden: LM only</span>
          )}
        </div>
      </section>

      <form action={updateEvent} className="card space-y-5">
        <input type="hidden" name="event_id" value={event.id} />
        <input type="hidden" name="match_ids" value={sortedMatches.map((m: any) => m.id).join(",")} />
        <div className="grid gap-4 md:grid-cols-2">
          <label>Name<input name="name" defaultValue={event.name} /></label>
          <label>Date<input name="event_date" type="datetime-local" defaultValue={event.event_date?.slice(0, 16)} /></label>
          <label>Status<select name="status" defaultValue={event.status}><option value="open">Open</option><option value="locked">Locked</option><option value="final">Final</option></select></label>
          <label>Perfect Bonus<input name="perfect_bonus" type="number" min="0" defaultValue={event.perfect_bonus} /></label>
        </div>

        <h2 className="text-xl font-black">Matches</h2>
        {sortedMatches.length === 0 && (
          <p className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-100">
            No matches exist for this event yet. Create a new event with match rows, or add match creation to this edit page later.
          </p>
        )}

        {sortedMatches.map((match: any, index: number) => {
          const options = optionValues(match);
          return (
            <div key={match.id} className="rounded-2xl border border-slate-800 bg-black/30 p-4">
              <h3 className="mb-3 font-black">Match {index + 1}</h3>
              <label>Match Title / Description<input name={`match_title_${match.id}`} defaultValue={match.match_title || `${match.competitor_a} vs ${match.competitor_b}`} /></label>
              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {OPTION_KEYS.map((key, optionIndex) => (
                  <label key={key}>Option {optionIndex + 1}<input name={`${key}_${match.id}`} defaultValue={match[key] || ""} placeholder={optionIndex < 2 ? "Required" : "Optional"} /></label>
                ))}
              </div>
              <label className="mt-3 block">Winner<select name={`winner_${match.id}`} defaultValue={match.winner || ""}><option value="">No winner</option>{options.map((option: string) => <option key={option} value={option}>{option}</option>)}</select></label>
            </div>
          );
        })}
        <button className="btn-primary w-full" type="submit">Save Event</button>
      </form>

      <section className="card mt-6 space-y-4">
        <div>
          <h2 className="text-2xl font-black">Interference Bet Scoring</h2>
          <p className="text-sm text-slate-300">
            Review each member&apos;s interference description and grant or subtract points for this event. Negative points are allowed here.
          </p>
        </div>

        {(interferenceSubmissions || []).length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-black/30 p-4 text-slate-300">
            No interference predictions have been submitted for this event yet.
          </p>
        ) : (
          <div className="space-y-3">
            {(interferenceSubmissions || []).map((submission: any) => (
              <form key={submission.bet_id} action={updateInterferenceBetPoints} className="rounded-2xl border border-slate-800 bg-black/30 p-4">
                <input type="hidden" name="event_id" value={event.id} />
                <input type="hidden" name="bet_id" value={submission.bet_id} />

                <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-black">{displayName(submission)}</h3>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Wager: {submission.wager}</p>
                  </div>
                  <p className="rounded-full border border-blue-900 bg-blue-950/40 px-3 py-1 text-xs font-bold text-blue-100">
                    Current: {submission.admin_points ?? submission.points_awarded ?? 0} pts
                  </p>
                </div>

                <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Member&apos;s interference call</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-100">{submission.prediction || "No description entered."}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-[160px_1fr_auto] md:items-end">
                  <label>
                    Points
                    <input name="admin_points" type="number" defaultValue={submission.admin_points ?? submission.points_awarded ?? 0} />
                  </label>
                  <label>
                    Admin Note
                    <input name="admin_note" defaultValue={submission.admin_note || ""} placeholder="Why points were granted or removed" />
                  </label>
                  <button className="btn-primary py-2" type="submit">Save Points</button>
                </div>
              </form>
            ))}
          </div>
        )}
      </section>

      {canDeleteEvent && (
        <section id="delete-event" className="card mt-6 border-2 border-red-700 bg-red-950/30 shadow-xl shadow-red-950/30">
          <h2 className="text-3xl font-black text-red-100">Danger Zone: Delete Event</h2>
          <p className="mt-2 text-sm text-red-100/80">
            LM-only. This permanently deletes this event and removes all matches, member picks, interference bets, and leaderboard points tied to this event.
          </p>
          <form action={deleteEvent} className="mt-4 space-y-3">
            <input type="hidden" name="event_id" value={event.id} />
            <label>
              Type DELETE to confirm
              <input name="confirm_delete" placeholder="DELETE" required />
            </label>
            <button className="w-full rounded-xl bg-red-700 px-5 py-4 text-lg font-black text-white hover:bg-red-800" type="submit">
              Delete Event Permanently
            </button>
          </form>
        </section>
      )}

      {!canDeleteEvent && (
        <section className="card mt-6 border border-slate-800 bg-black/30">
          <h2 className="text-2xl font-black">Delete Event</h2>
          <p className="mt-2 text-sm text-slate-300">You are signed in as {normalizedRole}. Event deletion is hidden because only the League Manager can delete events.</p>
        </section>
      )}

    </main>
  );
}
