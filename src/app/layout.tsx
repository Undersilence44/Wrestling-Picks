import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Wrestling Picks",
  description: "Fantasy-style wrestling picks league app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <NavBar />

        <main className="flex-1">
          {children}
        </main>

        <footer className="mt-10 border-t border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 text-center text-sm text-slate-400 sm:flex-row sm:justify-between sm:text-left">
            <div>
              © {new Date().getFullYear()} Pro Wrestling Picks. All rights reserved.
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/privacy"
                className="transition hover:text-white"
              >
                Privacy Policy
              </Link>

              <Link
                href="/terms"
                className="transition hover:text-white"
              >
                Terms of Use
              </Link>

              <a
                href="mailto:support@pro-wrestlingpicks.com"
                className="transition hover:text-white"
              >
                support@pro-wrestlingpicks.com
              </a>
            </div>
          </div>
        </footer>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
