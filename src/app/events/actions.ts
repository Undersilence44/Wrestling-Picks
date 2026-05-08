"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function savePicks(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const eventId = String(formData.get("event_id") || "");
  const leagueId = String(formData.get("league_id") || "");
  const matchIds = String(formData.get("match_ids") || "").split(",").filter(Boolean);

  const { data: event } = await supabase
    .from("events")
    .select("id, status, event_date, league_id, leagues(scoring_type)")
    .eq("id", eventId)
    .single();

  if (!event) redirect(`/events?league=${leagueId}&message=Event not found`);

  const eventLocked = event.status !== "open" || new Date(event.event_date) <= new Date();
  if (eventLocked) redirect(`/events/${eventId}?league=${event.league_id}&message=Event is locked`);

  const scoringType = (event as any).leagues?.scoring_type || "ranked";

  for (const matchId of matchIds) {
    const predictedWinner = String(formData.get(`winner_${matchId}`) || "").trim();
    const rawRank = Number(formData.get(`rank_${matchId}`) || 0);
    const confidenceRank = scoringType === "ranked" && rawRank > 0 ? rawRank : null;

    if (predictedWinner) {
      await supabase.from("picks").upsert(
        {
          event_id: eventId,
          match_id: matchId,
          user_id: user.id,
          predicted_winner: predictedWinner,
          confidence_rank: confidenceRank,
        },
        { onConflict: "event_id,match_id,user_id" }
      );
    }
  }

  const wager = Math.max(0, Number(formData.get("interference_wager") || 0));
  const prediction = String(formData.get("interference_prediction") || "").trim();

  await supabase.from("interference_bets").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      wager,
      prediction,
    },
    { onConflict: "event_id,user_id" }
  );

  redirect(`/events/${eventId}?league=${event.league_id}&message=Picks saved`);
}
