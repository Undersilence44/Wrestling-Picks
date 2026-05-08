import PageHero from "@/components/PageHero";

export default function RulesPage() {
  return <main className="page"><PageHero title="Rules & Bylaws" subtitle="Update this page with your final league rules. These defaults match the starter database." />
    <div className="card space-y-5 text-slate-300">
      <h2 className="text-2xl font-black text-white">General Rules</h2>
      <p>Players submit picks before the event starts. Once an event starts, picks should be treated as locked.</p>
      <p>Ranked scoring uses confidence values. Fixed scoring gives the same point value for each correct pick. Fantasy League mode is reserved as coming soon.</p>
      <p>Interference bets can add or subtract points. A player cannot bet below zero and cannot bet more than their current season points.</p>
      <p>A perfect event bonus is awarded when a player correctly picks every match winner. The default is 5 points, but the LM can edit it per event.</p>
      <p>Private leagues are invite-only. Public leagues can be viewed by account holders.</p>
    </div>
  </main>;
}
