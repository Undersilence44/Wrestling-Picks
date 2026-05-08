"use client";

import { useTransition } from "react";
import { logout } from "@/app/login/actions";

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();
  return <button className="btn-danger py-2" onClick={() => startTransition(() => logout())}>{pending ? "Logging out..." : "Logout"}</button>;
}
