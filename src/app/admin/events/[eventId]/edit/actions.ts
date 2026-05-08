"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const OPTION_KEYS = ["competitor_a", "competitor_b", "competitor_c", "competitor_d", "competitor_e", "competitor_f"] as const;

export async function updateEvent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const event_id = String(formData.get("event_id") || "");

  const { data: event } = await supabase.from("events").select("id,league_id").eq("id", event_id).single();
  if (!event) redirect("/admin?error=Event not found");

  const { data: membership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", event.league_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["LM", "ALM"])
    .maybeSingle();
  if (!membership) redirect("/leagues?error=Only LM or ALM users can update that event");

  const newStatus = String(formData.get("status") || "open");

  const { error: eventError } = await supabase.from("events").update({
    name: String(formData.get("name") || "").trim(),
    event_date: String(formData.get("event_date") || ""),
    status: newStatus,
    perfect_bonus: Number(formData.get("perfect_bonus") || 5),
  }).eq("id", event_id);
  if (eventError) redirect(`/admin/events/${event_id}/edit?error=${encodeURIComponent(eventError.message)}`);

  const matchIds = String(formData.get("match_ids") || "").split(",").filter(Boolean);
  for (const id of matchIds) {
    const values = OPTION_KEYS.map((key) => String(formData.get(`${key}_${id}`) || "").trim());
    const winner = String(formData.get(`winner_${id}`) || "").trim();
    await supabase.from("matches").update({
      match_title: String(formData.get(`match_title_${id}`) || "").trim(),
      competitor_a: values[0],
      competitor_b: values[1],
      competitor_c: values[2] || null,
      competitor_d: values[3] || null,
      competitor_e: values[4] || null,
      competitor_f: values[5] || null,
      winner: winner || null,
    }).eq("id", id);
  }

  if (newStatus === "final") {
    const { error: scoringError } = await supabase.rpc("calculate_event_results", { target_event_id: event_id });
    if (scoringError) {
      redirect(`/admin/events/${event_id}/edit?error=${encodeURIComponent(`Event saved, but scoring failed: ${scoringError.message}`)}`);
    }
    redirect(`/admin/events/${event_id}/edit?message=Event updated and leaderboard points calculated`);
  }

  redirect(`/admin/events/${event_id}/edit?message=Event updated`);
}


export async function deleteEvent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const event_id = String(formData.get("event_id") || "");
  const confirm_delete = String(formData.get("confirm_delete") || "").trim();

  if (!event_id) redirect("/admin?error=Missing event id");
  if (confirm_delete !== "DELETE") {
    redirect(`/admin/events/${event_id}/edit?error=${encodeURIComponent("Type DELETE to confirm event deletion")}`);
  }

  const { error } = await supabase.rpc("delete_event_as_lm", { target_event_id: event_id });
  if (error) {
    redirect(`/admin/events/${event_id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin?message=Event deleted. Picks, interference bets, and leaderboard points for that event were removed.");
}


export async function updateInterferenceBetPoints(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const event_id = String(formData.get("event_id") || "");
  const bet_id = String(formData.get("bet_id") || "");
  const admin_points = Number(formData.get("admin_points") || 0);
  const admin_note = String(formData.get("admin_note") || "").trim();

  if (!event_id || !bet_id) {
    redirect(`/admin/events/${event_id}/edit?error=${encodeURIComponent("Missing event or interference submission")}`);
  }

  const { error } = await supabase.rpc("admin_score_interference_submission", {
    target_event_id: event_id,
    target_bet_id: bet_id,
    target_points: admin_points,
    target_note: admin_note,
  });

  if (error) redirect(`/admin/events/${event_id}/edit?error=${encodeURIComponent(error.message)}`);

  const { error: scoringError } = await supabase.rpc("calculate_event_results", { target_event_id: event_id });
  if (scoringError) {
    redirect(`/admin/events/${event_id}/edit?error=${encodeURIComponent(`Interference points saved, but leaderboard recalculation failed: ${scoringError.message}`)}`);
  }

  redirect(`/admin/events/${event_id}/edit?message=Interference points saved and leaderboard updated`);
}
