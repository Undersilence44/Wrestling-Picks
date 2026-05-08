"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const OPTION_KEYS = [
  "competitor_a",
  "competitor_b",
  "competitor_c",
  "competitor_d",
  "competitor_e",
  "competitor_f",
] as const;

export async function updateEvent(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const event_id = String(formData.get("event_id") || "");

  const { data: event } = await supabase
    .from("events")
    .select("id,league_id")
    .eq("id", event_id)
    .single();

  if (!event) redirect("/admin?error=Event not found");

  const { data: membership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", event.league_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["LM", "ALM"])
    .maybeSingle();

  if (!membership) {
    redirect("/leagues?error=Only LM or ALM users can update that event");
  }

  const newStatus = String(formData.get("status") || "open");

  const { data: league } = await supabase
    .from("leagues")
    .select("scoring_type")
    .eq("id", event.league_id)
    .maybeSingle();

  const isFixed = league?.scoring_type === "fixed";

  const { error: eventError } = await supabase
    .from("events")
    .update({
      name: String(formData.get("name") || "").trim(),
      event_date: String(formData.get("event_date") || ""),
      status: newStatus,
      fixed_points: isFixed ? Number(formData.get("fixed_points") || 1) : 0,
      perfect_bonus: isFixed ? Number(formData.get("perfect_bonus") || 0) : 0,
    })
    .eq("id", event_id);

  if (eventError) {
    redirect(
      `/admin/events/${event_id}/edit?error=${encodeURIComponent(
        eventError.message
      )}`
    );
  }

  const matchIds = String(formData.get("match_ids") || "")
    .split(",")
    .filter(Boolean);

  for (const id of matchIds) {
    const values = OPTION_KEYS.map((key) =>
      String(formData.get(`${key}_${id}`) || "").trim()
    );

    const winner = String(formData.get(`winner_${id}`) || "").trim();

    await supabase
      .from("matches")
      .update({
        match_title: String(formData.get(`match_title_${id}`) || "").trim(),
        description: String(formData.get(`description_${id}`) || "").trim(),
        competitor_a: values[0],
        competitor_b: values[1],
        competitor_c: values[2] || null,
        competitor_d: values[3] || null,
        competitor_e: values[4] || null,
        competitor_f: values[5] || null,
        winner: winner || null,
      })
      .eq("id", id);
  }

  if (newStatus === "final") {
    const { error: scoringError } = await supabase.rpc(
      "calculate_event_results",
      {
        target_event_id: event_id,
      }
    );

    if (scoringError) {
      redirect(
        `/admin/events/${event_id}/edit?error=${encodeURIComponent(
          `Event saved, but scoring failed: ${scoringError.message}`
        )}`
      );
    }

    redirect(
      `/admin/events/${event_id}/edit?message=Event updated and leaderboard points calculated`
    );
  }

  redirect(`/admin/events/${event_id}/edit?message=Event updated`);
}

export async function addMatchToEvent(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const event_id = String(formData.get("event_id") || "");

  const { data: event } = await supabase
    .from("events")
    .select("id,league_id,status")
    .eq("id", event_id)
    .single();

  if (!event) redirect("/admin?error=Event not found");

  if (event.status !== "open") {
    redirect(
      `/admin/events/${event_id}/edit?error=Matches can only be added while event is open`
    );
  }

  const { data: membership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", event.league_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["LM", "ALM"])
    .maybeSingle();

  if (!membership) {
    redirect("/leagues?error=Only LM or ALM can add matches");
  }

  const match_title = String(formData.get("new_match_title") || "").trim();
  const description = String(formData.get("new_match_description") || "").trim();

  const options = [
    String(formData.get("new_option_1") || "").trim(),
    String(formData.get("new_option_2") || "").trim(),
    String(formData.get("new_option_3") || "").trim(),
    String(formData.get("new_option_4") || "").trim(),
    String(formData.get("new_option_5") || "").trim(),
    String(formData.get("new_option_6") || "").trim(),
  ];

  const filtered = options.filter(Boolean);

  if (!match_title || filtered.length < 2) {
    redirect(
      `/admin/events/${event_id}/edit?error=Match title and at least 2 options required`
    );
  }

  const { data: lastMatch } = await supabase
    .from("matches")
    .select("match_order")
    .eq("event_id", event_id)
    .order("match_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (lastMatch?.match_order || 0) + 1;

  const { error } = await supabase.from("matches").insert({
    event_id,
    match_order: nextOrder,
    match_title,
    description,
    competitor_a: options[0] || null,
    competitor_b: options[1] || null,
    competitor_c: options[2] || null,
    competitor_d: options[3] || null,
    competitor_e: options[4] || null,
    competitor_f: options[5] || null,
  });

  if (error) {
    redirect(
      `/admin/events/${event_id}/edit?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect(`/admin/events/${event_id}/edit?message=Match added successfully`);
}

export async function updateInterferenceBetPoints(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const event_id = String(formData.get("event_id") || "");
  const bet_id = String(formData.get("bet_id") || "");
  const admin_points = Number(formData.get("admin_points") || 0);
  const admin_note = String(formData.get("admin_note") || "").trim();

  if (!event_id || !bet_id) {
    redirect(
      `/admin/events/${event_id}/edit?error=${encodeURIComponent(
        "Missing event or interference submission"
      )}`
    );
  }

  const { error } = await supabase.rpc("admin_score_interference_submission", {
    target_event_id: event_id,
    target_bet_id: bet_id,
    target_points: admin_points,
    target_note: admin_note,
  });

  if (error) {
    redirect(
      `/admin/events/${event_id}/edit?error=${encodeURIComponent(error.message)}`
    );
  }

  const { error: scoringError } = await supabase.rpc(
    "calculate_event_results",
    {
      target_event_id: event_id,
    }
  );

  if (scoringError) {
    redirect(
      `/admin/events/${event_id}/edit?error=${encodeURIComponent(
        `Interference points saved, but leaderboard recalculation failed: ${scoringError.message}`
      )}`
    );
  }

  redirect(
    `/admin/events/${event_id}/edit?message=Interference points saved and leaderboard updated`
  );
}
