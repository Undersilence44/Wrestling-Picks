"use client";

import { usePathname } from "next/navigation";

const discordUrl = "https://discord.gg/WXdxrU9jKB";

export default function DiscordNavLink({
  mobile = false,
}: {
  mobile?: boolean;
}) {
  const pathname = usePathname();

  if (pathname === "/") return null;

  if (mobile) {
    return (
      <a
        href={discordUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-950/30 px-4 py-3 text-center text-sm font-black uppercase tracking-[0.18em] text-indigo-100 transition hover:bg-indigo-900/40"
      >
        <img
          src="/icons/Discord.png"
          alt=""
          className="h-5 w-5 shrink-0"
        />
        Join League Discord
      </a>
    );
  }

  return (
    <a
      href={discordUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-950/35 px-4 py-2 transition hover:border-indigo-400 hover:bg-indigo-900/50"
      title="Join League Discord"
    >
      <img
        src="/icons/discord.svg"
        alt=""
        className="h-5 w-5 shrink-0"
      />

      <span className="text-xs font-black uppercase tracking-[0.16em] text-indigo-100">
        Discord
      </span>
    </a>
  );
}
