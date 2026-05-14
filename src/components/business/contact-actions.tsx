"use client";

import { useState } from "react";
import { MessageCircle, Share2 } from "lucide-react";

type TrackType = "WHATSAPP" | "CALL" | "DIRECTION" | "SHARE" | "TELECOM" | "MESSAGE";

async function trackContact(businessId: string, type: TrackType, target: string) {
  try {
    await fetch(`/api/businesses/${businessId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, target }),
    });
  } catch {
    /* analytics best-effort */
  }
}

async function trackAndOpen(
  businessId: string,
  type: TrackType,
  target: string,
  behavior: "redirect" | "copy" = "redirect",
) {
  await trackContact(businessId, type, target);

  if (behavior === "copy") {
    await navigator.clipboard.writeText(target);
    return;
  }
  window.open(target, "_blank", "noopener,noreferrer");
}

export function ContactActions({
  businessId,
  businessName,
  pageUrl,
  phone,
  whatsappLink,
  directionLink,
  email,
  bizaflowTelecomNumber,
}: {
  businessId: string;
  businessName: string;
  pageUrl: string;
  phone?: string | null;
  whatsappLink?: string | null;
  directionLink: string;
  email?: string | null;
  bizaflowTelecomNumber?: string | null;
}) {
  const [shareHint, setShareHint] = useState<string | null>(null);

  async function onShare() {
    await trackContact(businessId, "SHARE", pageUrl);
    const shareData = {
      title: `${businessName} · VIBRA CONNECT`,
      text: `Découvrez ${businessName} sur la marketplace Bizaflow.`,
      url: pageUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(pageUrl);
        setShareHint("Lien copié dans le presse-papiers.");
        window.setTimeout(() => setShareHint(null), 2800);
      }
    } catch {
      await navigator.clipboard.writeText(pageUrl);
      setShareHint("Lien copié.");
      window.setTimeout(() => setShareHint(null), 2800);
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        {phone && (
          <button
            type="button"
            onClick={() => void trackAndOpen(businessId, "CALL", `tel:${phone}`)}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
          >
            Appeler
          </button>
        )}
        {whatsappLink && (
          <button
            type="button"
            onClick={() => void trackAndOpen(businessId, "WHATSAPP", whatsappLink)}
            className="rounded-full bg-gradient-to-r from-emerald-500 to-green-400 px-4 py-2 text-sm font-semibold text-black shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:brightness-110"
          >
            WhatsApp
          </button>
        )}
        <button
          type="button"
          onClick={() => void trackAndOpen(businessId, "DIRECTION", directionLink)}
          className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium hover:border-cyan-400/35"
        >
          Itinéraire Maps
        </button>
        {email && (
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(`Contact via VIBRA CONNECT — ${businessName}`)}`}
            onClick={() => void trackContact(businessId, "MESSAGE", `mailto:${email}`)}
            className="inline-flex items-center justify-center rounded-full border border-violet-400/35 bg-violet-500/15 px-4 py-2 text-sm font-medium text-violet-100 hover:bg-violet-500/25"
          >
            Email
          </a>
        )}
        {bizaflowTelecomNumber && (
          <button
            type="button"
            onClick={() => void trackAndOpen(businessId, "TELECOM", `tel:${bizaflowTelecomNumber}`)}
            className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20"
          >
            Bizaflow Telecom
          </button>
        )}
        <button
          type="button"
          onClick={() => void onShare()}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium hover:border-white/40"
        >
          <Share2 className="h-4 w-4" />
          Partager
        </button>
      </div>
      {shareHint && (
        <p className="mt-2 flex items-center gap-2 text-xs text-emerald-200/90">
          <MessageCircle className="h-3.5 w-3.5" />
          {shareHint}
        </p>
      )}
    </>
  );
}
