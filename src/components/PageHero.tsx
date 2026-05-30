import GlassPanel from "@/components/ui/GlassPanel";

export default function PageHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <GlassPanel className="mb-8 p-8 sm:p-10 lg:p-14">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-950/20 via-transparent to-red-950/20" />

      <div className="relative z-10">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.45em] text-red-400 sm:text-sm">
          Pro Wrestling Picks
        </p>

        <h1 className="max-w-5xl text-5xl font-black uppercase leading-none tracking-tight text-white sm:text-6xl lg:text-7xl">
          {title}
        </h1>

        <div className="mt-5 h-1 w-32 rounded-full bg-gradient-to-r from-blue-500 via-red-500 to-red-700" />

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg lg:text-xl">
          {subtitle}
        </p>
      </div>
    </GlassPanel>
  );
}
