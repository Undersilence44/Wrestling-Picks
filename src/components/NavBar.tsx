import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

const links = [
  ["Home", "/"],
  ["Rules", "/rules"],
  ["Leagues", "/leagues"],
  ["Events", "/events"],
  ["Leaderboard", "/leaderboard"],
];

export default async function NavBar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canSeeAdmin = false;

  if (user) {
    const { data: adminMemberships } = await supabase
      .from("league_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("role", ["LM", "ALM"])
      .limit(1);

    canSeeAdmin = Boolean(adminMemberships?.length);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-black/85 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex justify-center lg:justify-start">
          <Image
            src="/logo.png"
            alt="Pro Wrestling Picks"
            width={340}
            height={120}
            priority
            className="h-14 w-auto object-contain sm:h-16"
          />
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-slate-200 lg:justify-end">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 hover:bg-slate-900"
            >
              {label}
            </Link>
          ))}

          {canSeeAdmin && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-blue-300 hover:bg-slate-900"
            >
              Admin
            </Link>
          )}

          {user && (
            <Link
              href="/account"
              className="rounded-lg px-3 py-2 text-red-300 hover:bg-slate-900"
            >
              Account
            </Link>
          )}

          {user ? (
            <LogoutButton />
          ) : (
            <>
              <Link href="/login" className="btn-dark py-2">
                Login
              </Link>

              <Link href="/signup" className="btn-primary py-2">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
