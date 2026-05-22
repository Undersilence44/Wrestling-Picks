import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

const links = [
  ["Home", "/"],
  ["Dashboard", "/dashboard"],
  ["Leagues", "/leagues"],
  ["Events", "/events"],
  ["Rankings", "/leaderboard"],
];

function getInitials(email?: string | null) {
  if (!email) return "U";

  return email.slice(0, 1).toUpperCase();
}

export default async function NavBar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canSeeAdmin = false;
  let displayName = user?.email || "Account";

  if (user) {
    const [{ data: adminMemberships }, { data: profile }] =
      await Promise.all([
        supabase
          .from("league_members")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .in("role", ["LM", "ALM"])
          .limit(1),

        supabase
          .from("profiles")
          .select("display_name, full_name, email")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

    canSeeAdmin = Boolean(adminMemberships?.length);

    displayName =
      profile?.display_name ||
      profile?.full_name ||
      profile?.email ||
      user.email ||
      "Account";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/88 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logo.png"
            alt="Pro Wrestling Picks"
            width={340}
            height={120}
            priority
            className="h-12 w-auto object-contain sm:h-14 lg:h-16"
          />
        </Link>

        <div className="hidden items-center justify-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="group relative rounded-lg px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-200 transition hover:text-white"
            >
              {label}

              <span className="absolute inset-x-4 -bottom-1 h-0.5 scale-x-0 bg-red-600 transition group-hover:scale-x-100" />
            </Link>
          ))}

          {canSeeAdmin && (
            <Link
              href="/admin"
              className="group relative rounded-lg px-4 py-3 text-sm font-black uppercase tracking-wide text-blue-200 transition hover:text-white"
            >
              Admin

              <span className="absolute inset-x-4 -bottom-1 h-0.5 scale-x-0 bg-blue-500 transition group-hover:scale-x-100" />
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link
                href="/account"
                className="flex items-center gap-3 rounded-full border border-slate-700 bg-slate-950/80 px-3 py-2 transition hover:border-red-500 hover:bg-slate-900"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full border border-red-700 bg-red-950 text-sm font-black text-white">
                  {getInitials(user.email)}
                </span>

                <span className="max-w-36 truncate text-sm font-bold text-slate-100">
                  {displayName}
                </span>
              </Link>

              <LogoutButton />
            </>
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

        <details className="relative lg:hidden">
          <summary className="list-none rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm font-black uppercase text-white">
            Menu
          </summary>

          <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-slate-800 bg-black/95 p-3 shadow-2xl shadow-black backdrop-blur-xl">
            <div className="grid gap-1">
              {links.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-xl px-4 py-3 text-sm font-black uppercase text-slate-200 hover:bg-slate-900"
                >
                  {label}
                </Link>
              ))}

              {canSeeAdmin && (
                <Link
                  href="/admin"
                  className="rounded-xl px-4 py-3 text-sm font-black uppercase text-blue-200 hover:bg-slate-900"
                >
                  Admin
                </Link>
              )}

              {user ? (
                <>
                  <Link
                    href="/account"
                    className="mt-2 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-red-700 bg-red-950 text-sm font-black text-white">
                      {getInitials(user.email)}
                    </span>

                    <span className="truncate text-sm font-bold text-slate-100">
                      {displayName}
                    </span>
                  </Link>

                  <div className="mt-2">
                    <LogoutButton />
                  </div>
                </>
              ) : (
                <div className="mt-2 grid gap-2">
                  <Link
                    href="/login"
                    className="btn-dark py-2 text-center"
                  >
                    Login
                  </Link>

                  <Link
                    href="/signup"
                    className="btn-primary py-2 text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </details>
      </nav>

      <div className="border-t border-white/5 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-3 py-2">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 rounded-full border border-slate-800 bg-black/50 px-3 py-2 text-xs font-black uppercase text-slate-300"
            >
              {label}
            </Link>
          ))}

          {canSeeAdmin && (
            <Link
              href="/admin"
              className="shrink-0 rounded-full border border-blue-900 bg-blue-950/40 px-3 py-2 text-xs font-black uppercase text-blue-200"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
