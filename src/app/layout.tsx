kimport type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Wrestling Picks",
  description: "Fantasy-style wrestling picks league app",
  manifest: "/manifest.json",
  applicationName: "Pro Wrestling Picks",
  appleWebApp: {
    capable: true,
    title: "Wrestling Picks",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      {
        url: "/icons/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
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

        <main className="flex-1">{children}</main>

        <footer className="mt-10 border-t border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 text-center text-sm text-slate-400 sm:flex-row sm:justify-between sm:text-left">
            <div>
              © {new Date().getFullYear()} Pro Wrestling Picks. All rights
              reserved.
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/privacy" className="transition hover:text-white">
                Privacy Policy
              </Link>

              <Link href="/terms" className="transition hover:text-white">
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

        <ServiceWorkerRegister />

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
