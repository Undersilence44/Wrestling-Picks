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

function Avatar({
  avatarUrl,
  email,
}: {
  avatarUrl?: string | null;
  email?: string | null;
}) {
  return (
    <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-yellow-500 bg-yellow-950 text-sm font-black text-white">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Profile"
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(email)
      )}
    </span>
  );
}

export default async function NavBar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canSeeAdmin = false;
  let displayName = user?.email || "Account";
  let avatarUrl: string | null = null;

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
          .select("display_name, full_name, email, avatar_url")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

    canSeeAdmin = Boolean(adminMemberships?.length);
    avatarUrl = profile?.avatar_url || null;

    displayName =
      profile?.display_name ||
      profile?.full_name ||
      profile?.email ||
      user.email ||
      "Champion";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/88 backdrop-blur-2xl">
      <nav className="mx-auto flex h-[78px] w-full max-w-[1700px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/logo.png"
              alt="Pro Wrestling Picks"
              width={260}
              height={90}
              priority
              className="h-10 w-auto object-contain lg:h-12"
            />
          </Link>

          <div className="hidden xl:block">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-200">
              PRO-WRESTLINGPICKS.COM
            </p>

            <p className="mt-0.5 text-[11px] font-black uppercase tracking-[0.2em]">
              <span className="text-blue-400">Predict.</span>{" "}
              <span className="text-white">Compete.</span>{" "}
              <span className="text-red-500">Dominate.</span>
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="group relative text-sm font-black uppercase tracking-[0.18em] text-white/85 transition hover:text-white"
            >
              {label}
              <span className="absolute -bottom-[18px] left-0 h-[2px] w-full origin-left scale-x-0 bg-red-500 transition duration-300 group-hover:scale-x-100" />
            </Link>
          ))}

          {canSeeAdmin && (
            <Link
              href="/admin"
              className="group relative text-sm font-black uppercase tracking-[0.18em] text-blue-300 transition hover:text-white"
            >
              Admin
              <span className="absolute -bottom-[18px] left-0 h-[2px] w-full origin-left scale-x-0 bg-blue-500 transition duration-300 group-hover:scale-x-100" />
            </Link>
          )}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          {!user ? (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/10 bg-black px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:border-red-500 hover:bg-red-950/40"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="rounded-full bg-blue-600 px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-500"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/account"
                className="flex items-center gap-3 rounded-full border border-yellow-500/30 bg-black/70 px-3 py-2 transition hover:border-yellow-400"
              >
                <Avatar avatarUrl={avatarUrl} email={user.email} />

                <div className="flex flex-col">
                  <span className="max-w-36 truncate text-sm font-black text-white">
                    {displayName}
                  </span>

                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">
                    Champion
                  </span>
                </div>
              </Link>

              <LogoutButton />
            </>
          )}
        </div>

        <details className="relative lg:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-xl border border-white/10 bg-black/70 text-white">
            ☰
          </summary>

          <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-3xl border border-white/10 bg-black/95 shadow-2xl shadow-black">
            <div className="border-b border-white/5 px-5 py-4">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-white">
                Navigation
              </p>
            </div>

            <div className="grid gap-1 p-3">
              {links.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.15em] text-slate-200 transition hover:bg-white/5"
                >
                  {label}
                </Link>
              ))}

              {canSeeAdmin && (
                <Link
                  href="/admin"
                  className="rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.15em] text-blue-300 transition hover:bg-white/5"
                >
                  Admin
                </Link>
              )}

              {!user ? (
                <div className="mt-3 grid gap-2">
                  <Link
                    href="/login"
                    className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-center text-sm font-black uppercase tracking-[0.18em] text-white"
                  >
                    Login
                  </Link>

                  <Link
                    href="/signup"
                    className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-black uppercase tracking-[0.18em] text-white"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-yellow-500/20 bg-yellow-950/10 p-4">
                  <Link href="/account" className="flex items-center gap-3">
                    <Avatar avatarUrl={avatarUrl} email={user.email} />

                    <div>
                      <p className="max-w-44 truncate text-sm font-black text-white">
                        {displayName}
                      </p>

                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">
                        Champion
                      </p>
                    </div>
                  </Link>

                  <div className="mt-4">
                    <LogoutButton />
                  </div>
                </div>
              )}
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}
