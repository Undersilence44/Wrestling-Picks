import PageHero from "@/components/PageHero";
import { createClient } from "@/lib/supabase/server";
import { createEvent } from "./actions";
import { redirect } from "next/navigation";

const MATCH_COUNT = 12;
const OPTION_COUNT = 6;

export default async function NewEventPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: adminMemberships } = await supabase
    .from("league_members")
    .select(`
      league_id,
      role,
      leagues(
        id,
        name,
        scoring_type,
        fixed_points,
        perfect_bonus
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["LM", "ALM"]);

  if (!adminMemberships?.length) {
    redirect(
      "/leagues?error=Only League Managers and Assistant League Managers can create events"
    );
  }

  return (
    <main className="page max-w-6xl">
      <PageHero
        title="Create Event"
        subtitle="Create a league event and build the match card."
      />

      <form action={createEvent} className="card space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            League
            <select name="league_id" required>
              {adminMemberships.map((membership: any) => (
                <option
                  key={membership.league_id}
                  value={membership.league_id}
                >
                  {membership.leagues?.name} (
                  {membership.leagues?.scoring_type})
                </option>
              ))}
            </select>
          </label>

          <label>
            Event Name
            <input
              name="name"
              placeholder="Backlash Tampa 2026"
              required
            />
          </label>

          <label>
            Date & Time
            <input
              name="event_date"
              type="datetime-local"
              required
            />
          </label>

          <label>
            Perfect Bonus (Fixed leagues only)
            <input
              name="perfect_bonus"
              type="number"
              defaultValue="5"
              min="0"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-blue-900 bg-blue-950/20 p-4">
          <h2 className="text-xl font-black">Matches</h2>

          <p className="mt-1 text-sm text-slate-300">
            Ranked leagues use confidence scoring only.
            Fixed leagues use fixed point scoring only.
          </p>
        </div>

        {Array.from({ length: MATCH_COUNT }).map((_, idx) => {
          const matchNumber = idx + 1;

          return (
            <div
              key={matchNumber}
              className="rounded-2xl border border-slate-800 bg-black/30 p-4"
            >
              <h3 className="mb-3 text-lg font-black">
                Match {matchNumber}
              </h3>

              <label>
                Match Title / Description
                <input
                  name={`match_title_${matchNumber}`}
                  placeholder="Roman vs Cody for WWE Title"
                />
              </label>

              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: OPTION_COUNT }).map(
                  (_, optionIdx) => (
                    <label key={optionIdx}>
                      Option {optionIdx + 1}
                      <input
                        name={`option_${matchNumber}_${optionIdx + 1}`}
                        placeholder={
                          optionIdx < 2
                            ? `Required option ${optionIdx + 1}`
                            : `Optional option ${optionIdx + 1}`
                        }
                      />
                    </label>
                  )
                )}
              </div>
            </div>
          );
        })}

        <button className="btn-danger w-full" type="submit">
          Create Event
        </button>
      </form>
    </main>
  );
}
