import Image from "next/image";
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

  const { data: lmMemberships } = await supabase
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
    .eq("role", "LM");

  if (!lmMemberships?.length) {
    redirect(
      "/admin?error=Only League Managers can create events. Assistant League Managers can edit events but cannot create them."
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10">
      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-12">
        <Image
          src="/home/cta-panel-bg.png"
          alt="Create event background"
          fill
          priority
          className="object-cover opacity-55"
        />

        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.45em] text-red-300">
            League Manager
          </p>

          <h1 className="mt-5 text-5xl font-black uppercase text-white sm:text-7xl">
            Create Event
          </h1>

          <p className="mt-4 max-w-3xl text-slate-300">
            Create a league event and build the match card. Only League
            Managers can create new events.
          </p>
        </div>
      </section>

      <form action={createEvent} className="card mt-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            League
            <select name="league_id" required>
              {lmMemberships.map((membership: any) => (
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
            <input name="event_date" type="datetime-local" required />
          </label>

          <label>
            Perfect Bonus / Fixed Leagues Only
            <input
              name="perfect_bonus"
              type="number"
              defaultValue="5"
              min="0"
            />
          </label>
        </div>

        <section className="rounded-2xl border border-blue-900 bg-blue-950/20 p-4">
          <h2 className="text-xl font-black uppercase text-white">
            Match Card
          </h2>

          <p className="mt-1 text-sm text-slate-300">
            Fill out only the matches you need. Empty matches will be ignored.
            Each match needs a title and at least two options.
          </p>
        </section>

        {Array.from({ length: MATCH_COUNT }).map((_, idx) => {
          const matchNumber = idx + 1;

          return (
            <details
              key={matchNumber}
              className="rounded-2xl border border-white/10 bg-black/35 p-4"
              open={matchNumber <= 3}
            >
              <summary className="cursor-pointer text-lg font-black uppercase text-white">
                Match {matchNumber}
              </summary>

              <div className="mt-4">
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
            </details>
          );
        })}

        <button className="btn-danger w-full" type="submit">
          Create Event
        </button>
      </form>
    </main>
  );
}
