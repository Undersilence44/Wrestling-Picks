import { ReactNode } from "react";

export default function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-red-500">
              {icon}
            </div>
          )}

          <h2 className="text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
            {title}
          </h2>
        </div>

        {subtitle && (
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
