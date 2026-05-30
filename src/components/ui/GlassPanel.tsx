import { ReactNode } from "react";

export default function GlassPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`
        relative overflow-hidden rounded-[28px]
        border border-white/10
        bg-black/45
        backdrop-blur-xl
        shadow-[0_0_40px_rgba(0,0,0,0.45)]
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] via-transparent to-blue-500/[0.03]" />

      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}
