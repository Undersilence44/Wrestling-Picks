import { ReactNode } from "react";

export default function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/55 p-6 backdrop-blur-xl transition duration-300 hover:border-red-500/40 hover:bg-black/70">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.04] to-blue-500/[0.04] opacity-0 transition duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
            {label}
          </p>

          <h3 className="mt-3 text-4xl font-black text-white">
            {value}
          </h3>
        </div>

        {icon && (
          <div className="text-red-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
