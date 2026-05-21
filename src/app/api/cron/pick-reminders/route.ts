import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY || "missing");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_SLOTS = new Set([
  "friday-8am",
  "friday-8pm",
  "saturday-5pm",
  "test",
]);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const slot = url.searchParams.get("slot") || "";

  if (!VALID_SLOTS.has(slot)) {
    return NextResponse.json(
      {
        error: "Invalid or missing reminder slot",
        validSlots: Array.from(VALID_SLOTS),
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 1000 * 60 * 60 * 96);

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, name, event_date, league_id, leagues(name)")
    .eq("status", "open")
    .gte("event_date", now.toISOString())
    .lte("event_date", windowEnd.toISOString());

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  let emailsSent = 0;
  let skippedAlreadyPicked = 0;
  let skippedAlreadyReminded = 0;
  let skippedNoEmail = 0;
  let failedEmails = 0;
  const errors: string[] = [];

  for (const event of events || []) {
    const eventDate = new Date(event.event_date);
    const league: any = event.leagues;

    const { data: leagueMembers, error: membersError } = await supabase
      .from("league_members")
      .select("user_id")
      .eq("league_id", event.league_id)
      .eq("status", "active");

    if (membersError) {
      errors.push(`Members error for ${event.name}: ${membersError.message}`);
      continue;
    }

    const userIds = (leagueMembers || []).map((m: any) => m.user_id);

    if (userIds.length === 0) continue;

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .in("id", userIds);

    if (profilesError) {
      errors.push(`Profiles error for ${event.name}: ${profilesError.message}`);
      continue;
    }

    const profileMap = new Map<string, any>();
    for (const profile of profiles || []) {
      profileMap.set(profile.id, profile);
    }

    for (const member of leagueMembers || []) {
      const profile = profileMap.get(member.user_id);

      if (!profile?.email) {
        skippedNoEmail++;
        continue;
      }

      const { data: existingPick } = await supabase
        .from("picks")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", member.user_id)
        .limit(1)
        .maybeSingle();

      if (existingPick) {
        skippedAlreadyPicked++;
        continue;
      }

      const reminderKey = `${event.id}-${member.user_id}-${slot}`;

      const { data: alreadyReminded } = await supabase
        .from("pick_reminder_logs")
        .select("id")
        .eq("reminder_key", reminderKey)
        .maybeSingle();

      if (alreadyReminded) {
        skippedAlreadyReminded++;
        continue;
      }

      const eventUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/events/${event.id}`;

      const sendResult = await resend.emails.send({
        from: "Wrestling Picks <no-reply@pro-wrestlingpicks.com>",
        to: profile.email,
        subject: `Reminder: Submit Picks for ${event.name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
            <h1>⏰ Picks Reminder</h1>
            <p>Hello ${profile.display_name || "member"},</p>
            <p>You still have not submitted your picks for:</p>
            <h2>${event.name}</h2>
            <p>League: <strong>${league?.name || "Wrestling Picks League"}</strong></p>
            <p>Event Date: <strong>${eventDate.toLocaleString("en-US", {
              timeZone: "America/New_York",
            })}</strong></p>
            <p style="margin-top:30px;">
              <a href="${eventUrl}" style="background:#dc2626;color:white;padding:12px 20px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">
                Submit Picks
              </a>
            </p>
            <p style="font-size:12px;color:#666;margin-top:32px;">Reminder slot: ${slot}</p>
          </div>
        `,
      });

      if (sendResult.error) {
        failedEmails++;
        errors.push(
          `Resend failed for ${profile.email}: ${sendResult.error.message}`
        );
        continue;
      }

      const { error: logError } = await supabase
        .from("pick_reminder_logs")
        .insert({
          event_id: event.id,
          user_id: member.user_id,
          reminder_key: reminderKey,
        });

      if (logError) {
        failedEmails++;
        errors.push(`Log insert failed for ${profile.email}: ${logError.message}`);
        continue;
      }

      emailsSent++;
    }
  }

  return NextResponse.json({
    success: true,
    slot,
    eventsChecked: events?.length || 0,
    emailsSent,
    skippedAlreadyPicked,
    skippedAlreadyReminded,
    skippedNoEmail,
    failedEmails,
    errors,
  });
}
