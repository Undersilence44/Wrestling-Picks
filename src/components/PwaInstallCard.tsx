"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as any).standalone === true
  );
}

export default function PwaInstallCard() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [showIosHelp, setShowIosHelp] = useState(false);
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);

  useEffect(() => {
    setAlreadyInstalled(isStandalone());
    setShowIosHelp(isIos() && !isStandalone());

    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) return;

    await installPrompt.prompt();
    await installPrompt.userChoice;

    setInstallPrompt(null);
  }

  if (alreadyInstalled) {
    return null;
  }

  if (!installPrompt && !showIosHelp) {
    return null;
  }

  return (
    <section className="mt-6 rounded-[34px] border border-blue-500/20 bg-blue-950/20 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">
            Mobile App
          </p>

          <h2 className="mt-3 text-3xl font-black uppercase text-white">
            Install Pro Wrestling Picks
          </h2>

          <p className="mt-3 max-w-3xl text-slate-300">
            Add Pro Wrestling Picks to your phone or tablet for a faster
            app-style experience.
          </p>

          {showIosHelp && (
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-slate-200">
              On iPhone or iPad: tap the Share button in Safari, then choose{" "}
              <span className="font-black text-white">Add to Home Screen</span>.
            </p>
          )}
        </div>

        {installPrompt && (
          <button
            type="button"
            onClick={installApp}
            className="btn-primary whitespace-nowrap"
          >
            Install App
          </button>
        )}
      </div>
    </section>
  );
}
