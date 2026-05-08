import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = { title: "Wrestling Picks", description: "Fantasy-style wrestling picks league app" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><NavBar />{children}</body></html>;
}
