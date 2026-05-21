"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "vibra-pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const byDisplay = window.matchMedia("(display-mode: standalone)").matches;
  const byIos = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return byDisplay || byIos;
}

export function PwaInstallProvider() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobile, setMobile] = useState(false);
  const [swOk, setSwOk] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => setSwOk(true))
      .catch(() => setSwOk(false));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    const onInstalled = () => setDeferred(null);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    setDeferred(null);
  }, [deferred]);

  const show = mobile && swOk && deferred !== null && !dismissed && !isStandalone();

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Installation application"
      className="fixed inset-x-0 bottom-0 z-[45] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-cyan-500/25 bg-[#0a1024]/95 px-3 py-2.5 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <Image src="/logo.svg" alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-cyan-200/90">Application</p>
          <p className="truncate text-sm font-semibold text-white">Installer VIBRA CONNECT</p>
          <p className="truncate text-[11px] text-white/55">Accès rapide depuis votre écran d&apos;accueil.</p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            type="button"
            onClick={install}
            className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-3 py-1.5 text-xs font-bold text-black"
          >
            Installer
          </button>
          <button type="button" onClick={dismiss} className="text-[11px] font-medium text-white/50 hover:text-white/80">
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
