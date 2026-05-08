"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MATCH_COUNT = 12;
const OPTION_COUNT = 6;

function collectOptions(formData: FormData, matchNumber: number) {
  const options = Array.from({ length: OPTION_COUNT })
    .map((_, idx) => String(formData.get(`option_${matchNumber}_${idx + 1}`) || "").trim())
    .filter(Boolean);
  return [...new Set(options)];
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const league_id = String(formData.get("league_id") || "");
  const name = String(formData.get("name") || "").trim();
  const event_date = String(formData.get("event_date") || "");
  const perfect_bonus = Number(formData.get("perfect_bonus") || 5);

  const { data: membership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", league_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["LM", "ALM"])
    .maybeSingle();

  if (!membership) redirect("/leagues?error=Only LM or ALM users can create events for that league");

  const { data: event, error } = await supabase
    .from("events")
    .insert({ league_id, name, event_date, perfect_bonus, status: "open", created_by: user.id })
    .select("id")
    .single();

  if (error || !event) redirect(`/admin/events/new?error=${encodeURIComponent(error?.message || "Could not create event")}`);

  let createdMatches = 0;
  for (let i = 1; i <= MATCH_COUNT; i++) {
    const matchTitle = String(formData.get(`match_title_${i}`) || "").trim();
    const options = collectOptions(formData, i);
    if (matchTitle && options.length >= 2) {
      await supabase.from("matches").insert({
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
      createdMatches++;
    }
  }

  if (createdMatches === 0) redirect(`/admin/events/${event.id}/edit?message=Event created. Add at least one match with a title and 2 options.`);
  redirect("/admin?message=Event created");
}
