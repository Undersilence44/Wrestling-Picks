"use client";

import { useTransition } from "react";
import { logout } from "@/app/login/actions";

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => logout())}
      className="rounded-xl border border-red-800 bg-red-950/80 px-4 py-2 text-sm font-black text-red-100 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Logging out..." : "Logout"}
    </button>
  );
}
