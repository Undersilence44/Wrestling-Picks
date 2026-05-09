import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const lowerWindow = new Date(now.getTime() + 1000 * 60 * 60 * 2.75);
  const upperWindow = new Date(now.getTime() + 1000 * 60 * 60 * 3.25);

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select(`
      id,
      name,
      event_date,
      league_id,
      leagues(name)
    `)
    .eq("status", "open")
    .gte("event_date", lowerWindow.toISOString())
    .lte("event_date", upperWindow.toISOString());

  if (eventsError) {
    return NextResponse.json(
      { error: eventsError.message },
      { status: 500 }
    );
  }

  let emailsSent = 0;

  for (const event of events || []) {
    const { data: leagueMembers } = await supabase
      .from("league_members")
      .select(`
        user_id,
        profiles(email, display_name)
      `)
      .eq("league_id", event.league_id)
      .eq("status", "active");

    for (const member of leagueMembers || []) {
      const profile: any = member.profiles;

      if (!profile?.email) continue;

      const { data: existingPick } = await supabase
        .from("picks")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", member.user_id)
        .limit(1)
        .maybeSingle();

      if (existingPick) continue;

      const { data: alreadyReminded } = await supabase
        .from("pick_reminder_logs")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", member.user_id)
        .maybeSingle();

      if (alreadyReminded) continue;

      try {
        await resend.emails.send({
          from: "Wrestling Picks <no-reply@pro-wrestlingpicks.com>",
          to: profile.email,
          subject: `Reminder: Submit Picks for ${event.name}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
              <h1>⏰ Picks Reminder</h1>

              <p>Hello ${profile.display_name || "member"},</p>

              <p>
                You still have not submitted your picks for:
              </p>

              <h2>${event.name}</h2>

              <p>
                Picks lock at:
              </p>

              <p>
                <strong>${new Date(event.event_date).toLocaleString()}</strong>
              </p>

              <p>
                Submit your picks before the event locks.
              </p>

              <p style="margin-top:30px;">
                <a
                  href="${process.env.NEXT_PUBLIC_SITE_URL}/events"
                  style="
                    background:#dc2626;
                    color:white;
                    padding:12px 20px;
                    text-decoration:none;
                    border-radius:8px;
                    display:inline-block;
                    font-weight:bold;
                  "
                >
                  Submit Picks
                </a>
              </p>

              <hr style="margin-top:40px;" />

              <p style="font-size:12px;color:#666;">
                Wrestling Picks Automated Reminder
              </p>
            </div>
          `,
        });

        await supabase.from("pick_reminder_logs").insert({
          event_id: event.id,
          user_id: member.user_id,
        });

        emailsSent++;
      } catch (err) {
        console.error(err);
      }
    }
  }

  return NextResponse.json({
    success: true,
    emailsSent,
  });
}
