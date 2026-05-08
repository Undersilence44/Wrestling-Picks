"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createLeague(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const visibility = String(formData.get("visibility") || "public");
  const scoringType = String(formData.get("scoring_type") || "ranked");
  const fixedPoints = Number(formData.get("fixed_points") || 1);
  const perfectBonus = Number(formData.get("perfect_bonus") || 5);

  if (!name) redirect("/leagues?error=League name required");

  const { data: league, error: leagueError } = await supabase
    .from("leagues")
    .insert({
      name,
      description,
      visibility,
      scoring_type: scoringType,
      fixed_points: fixedPoints,
      perfect_bonus: perfectBonus,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (leagueError || !league) {
    redirect(
      `/leagues?error=${encodeURIComponent(
        leagueError?.message || "Could not create league",
      )}`,
    );
  }

  const { error: memberError } = await supabase.from("league_members").insert({
    league_id: league.id,
    user_id: user.id,
    role: "LM",
    status: "active",
  });

  if (memberError) {
    redirect(
      `/leagues?error=${encodeURIComponent(
        `League was created, but LM membership failed: ${memberError.message}`,
      )}`,
    );
  }

  redirect("/leagues?message=League created. You are the League Manager.");
}

export async function joinPublicLeague(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const leagueId = String(formData.get("league_id") || "");

  const { data: existing } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (existing) redirect("/leagues?message=You are already in that league");

  const { count: activeMemberCount, error: countError } = await supabase
    .from("league_members")
    .select("id", { count: "exact", head: true })
    .eq("league_id", leagueId)
    .eq("status", "active");

  if (countError) redirect(`/leagues?error=${encodeURIComponent(countError.message)}`);
  if ((activeMemberCount || 0) >= 30) redirect("/leagues?error=That league is full. Leagues are capped at 30 active members.");

  const { error } = await supabase.from("league_members").insert({
    league_id: leagueId,
    user_id: user.id,
    role: "MEMBER",
    status: "active",
  });

  if (error) redirect(`/leagues?error=${encodeURIComponent(error.message)}`);

  redirect("/leagues?message=Joined league");
}
