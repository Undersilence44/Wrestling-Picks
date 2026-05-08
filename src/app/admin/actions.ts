"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return { supabase, user };
}

export async function assignAlm(formData: FormData) {
  const { supabase, user } = await requireUser();
  const leagueId = String(formData.get("league_id") || "");
  const memberId = String(formData.get("member_id") || "");

  const { data: lm } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .eq("role", "LM")
    .maybeSingle();

  if (!lm) redirect("/admin?error=Only the League Manager can assign an ALM");
  if (!memberId) redirect("/admin?error=Choose a member to assign as ALM");

  const { data: targetMember } = await supabase
    .from("league_members")
    .select("id, role")
    .eq("id", memberId)
    .eq("league_id", leagueId)
    .eq("status", "active")
    .maybeSingle();

  if (!targetMember) redirect("/admin?error=That user is not an active member of this league");
  if (targetMember.role === "LM") redirect("/admin?error=The League Manager cannot also be ALM");

  const { error: demoteError } = await supabase
    .from("league_members")
    .update({ role: "MEMBER" })
    .eq("league_id", leagueId)
    .eq("status", "active")
    .eq("role", "ALM");

  if (demoteError) redirect(`/admin?error=${encodeURIComponent(demoteError.message)}`);

  const { error } = await supabase
    .from("league_members")
    .update({ role: "ALM" })
    .eq("id", memberId)
    .eq("league_id", leagueId)
    .eq("status", "active");

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  redirect("/admin?message=Assistant League Manager assigned");
}

export async function removeAlm(formData: FormData) {
  const { supabase, user } = await requireUser();
  const leagueId = String(formData.get("league_id") || "");
  const memberId = String(formData.get("member_id") || "");

  const { data: lm } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .eq("role", "LM")
    .maybeSingle();

  if (!lm) redirect("/admin?error=Only the League Manager can remove an ALM");

  const { error } = await supabase
    .from("league_members")
    .update({ role: "MEMBER" })
    .eq("id", memberId)
    .eq("league_id", leagueId)
    .eq("role", "ALM");

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  redirect("/admin?message=Assistant League Manager removed");
}

export async function transferLm(formData: FormData) {
  const { supabase } = await requireUser();
  const leagueId = String(formData.get("league_id") || "");
  const memberId = String(formData.get("member_id") || "");
  const confirmation = String(formData.get("confirm_transfer") || "").trim().toUpperCase();

  if (!leagueId) redirect("/admin?error=Missing league id");
  if (!memberId) redirect("/admin?error=Choose the member who should become the new LM");
  if (confirmation !== "TRANSFER") redirect("/admin?error=Type TRANSFER to confirm League Manager transfer");

  const { error } = await supabase.rpc("transfer_league_manager", {
    target_league_id: leagueId,
    target_member_id: memberId,
  });

  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  redirect("/admin?message=League Manager transferred. You may no longer see that league in LM controls if you are not ALM.");
}

export async function deleteLeague(formData: FormData) {
  const { supabase, user } = await requireUser();
  const leagueId = String(formData.get("league_id") || "");
  const confirmation = String(formData.get("confirm_delete") || "").trim().toUpperCase();

  if (confirmation !== "DELETE") redirect("/admin?error=Type DELETE to confirm league deletion");

  const { data: lm } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .eq("role", "LM")
    .maybeSingle();

  if (!lm) redirect("/admin?error=Only the League Manager can delete this league");

  const { error } = await supabase.from("leagues").delete().eq("id", leagueId);
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  redirect("/admin?message=League deleted");
}

export async function deleteEventFromAdminList(formData: FormData) {
  const { supabase, user } = await requireUser();
  const eventId = String(formData.get("event_id") || "");
  const confirmation = String(formData.get("confirm_delete") || "").trim().toUpperCase();

  if (!eventId) redirect("/admin?error=Missing event id");
  if (confirmation !== "DELETE") redirect("/admin?error=Type DELETE to confirm event deletion");

  const { data: event } = await supabase
    .from("events")
    .select("id, league_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) redirect("/admin?error=Event not found");

  const { data: lm } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", event.league_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .eq("role", "LM")
    .maybeSingle();

  if (!lm) redirect("/admin?error=Only the League Manager can delete this event");

  const { error } = await supabase.rpc("delete_event_as_lm", { target_event_id: eventId });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);

  redirect("/admin?message=Event deleted. Picks, interference bets, and leaderboard points for that event were removed.");
}
