"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireLmOrAlmForEvent(eventId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, league_id, status")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    redirect("/admin?error=Event not found");
  }

  const { data: membership } = await supabase
    .from("league_members")
    .select("role")
    .eq("league_id", event.league_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["LM", "ALM"])
    .maybeSingle();

  if (!membership) {
    redirect("/admin?error=You do not have permission to edit this event");
  }

  return { supabase, event };
}

export async function addMatchToEvent(eventId: string, formData: FormData) {
  const { supabase, event } = await requireLmOrAlmForEvent(eventId);

  if (event.status !== "open") {
    redirect(`/admin/events/${eventId}/edit?error=Matches can only be added while the event is open`);
  }

  const matchTitle = String(formData.get("match_title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  const option1 = String(formData.get("option_1") || "").trim();
  const option2 = String(formData.get("option_2") || "").trim();
  const option3 = String(formData.get("option_3") || "").trim();
  const option4 = String(formData.get("option_4") || "").trim();
  const option5 = String(formData.get("option_5") || "").trim();
  const option6 = String(formData.get("option_6") || "").trim();

  if (!matchTitle) {
    redirect(`/admin/events/${eventId}/edit?error=Match title is required`);
  }

  if (!option1 || !option2) {
    redirect(`/admin/events/${eventId}/edit?error=At least two match options are required`);
  }

  const { error } = await supabase.from("matches").insert({
    event_id: eventId,
    title: matchTitle,
    match_title: matchTitle,
    description,
    option_1: option1,
    option_2: option2,
    option_3: option3 || null,
    option_4: option4 || null,
    option_5: option5 || null,
    option_6: option6 || null,
  });

  if (error) {
    redirect(`/admin/events/${eventId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/admin/events/${eventId}/edit?message=Match added successfully`);
}
