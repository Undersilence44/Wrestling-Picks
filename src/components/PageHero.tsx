export default function PageHero({ title, subtitle }: { title: string; subtitle: string }) {
  return <section className="mb-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-red-950/70 via-slate-950 to-blue-950/70 p-8 shadow-2xl shadow-black/40">
    <p className="mb-3 text-sm font-black uppercase tracking-[0.3em] text-blue-300">Wrestling Picks League</p>
    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
    <p className="mt-4 max-w-3xl text-lg text-slate-300">{subtitle}</p>
  </section>;
}
