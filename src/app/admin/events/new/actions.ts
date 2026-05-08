"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MATCH_COUNT = 12;
const OPTION_COUNT = 6;

function collectOptions(formData: FormData, matchNumber: number) {
  return Array.from({ length: OPTION_COUNT })
    .map((_, idx) =>
      String(formData.get(`option_${matchNumber}_${idx + 1}`) || "").trim()
    )
    .filter(Boolean);
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const league_id = String(formData.get("league_id") || "");
  const name = String(formData.get("name") || "").trim();
  const event_date = String(formData.get("event_date") || "");
  const perfect_bonus = Number(formData.get("perfect_bonus") || 5);

  if (!league_id || !name || !event_date) {
    redirect("/admin/events/new?error=Missing required fields");
  }

  const { data: league } = await supabase
    .from("leagues")
    .select("id, scoring_type, fixed_points, perfect_bonus")
    .eq("id", league_id)
    .single();

  if (!league) {
    redirect("/admin/events/new?error=League not found");
  }

  const { data: membership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", league_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["LM", "ALM"])
    .maybeSingle();

  if (!membership) {
    redirect("/leagues?error=Only LM or ALM can create events");
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      league_id,
      name,
      event_date,
      status: "open",
      created_by: user.id,

      fixed_points:
        league.scoring_type === "fixed"
          ? league.fixed_points || 1
          : 0,

      perfect_bonus:
        league.scoring_type === "fixed"
          ? perfect_bonus
          : 0,
    })
    .select("id")
    .single();

  if (eventError || !event) {
    redirect(
      `/admin/events/new?error=${encodeURIComponent(
        eventError?.message || "Could not create event"
      )}`
    );
  }

  let createdMatches = 0;

  for (let i = 1; i <= MATCH_COUNT; i++) {
    const matchTitle = String(
      formData.get(`match_title_${i}`) || ""
    ).trim();

    const options = collectOptions(formData, i);

    if (!matchTitle || options.length < 2) continue;

    const { error: matchError } = await supabase
      .from("matches")
      .insert({
        event_id: event.id,
        match_order: i,
        match_title: matchTitle,

        competitor_a: options[0],
        competitor_b: options[1],
        competitor_c: options[2] || null,
        competitor_d: options[3] || null,
        competitor_e: options[4] || null,
        competitor_f: options[5] || null,
      });

    if (!matchError) {
      createdMatches++;
    }
  }

  redirect(
    `/admin/events/${event.id}/edit?message=${encodeURIComponent(
      `Event created with ${createdMatches} matches`
    )}`
  );
}
