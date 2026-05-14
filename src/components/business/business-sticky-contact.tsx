"use client";

import { MapPin, MessageCircle, Phone } from "lucide-react";

type TrackType = "WHATSAPP" | "CALL" | "DIRECTION";

async function track(businessId: string, type: TrackType, target: string) {
  try {
    await fetch(`/api/businesses/${businessId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, target }),
    });
  } catch {
    /* non bloquant */
  }
}

export function BusinessStickyContactBar({
  businessId,
  phone,
  whatsappLink,
  directionLink,
}: {
  businessId: string;
  phone?: string | null;
  whatsappLink?: string | null;
  directionLink: string;
}) {
  if (!whatsappLink && !phone && !directionLink) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="pointer-events-auto mx-auto max-w-lg px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2 rounded-2xl border border-white/15 bg-[#050816]/92 p-2 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void track(businessId, "WHATSAPP", whatsappLink)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 py-3 text-sm font-bold text-black"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              onClick={() => void track(businessId, "CALL", `tel:${phone}`)}
              className="flex flex-none items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-3"
            >
              <Phone className="h-4 w-4 text-cyan-200" />
            </a>
          )}
          <a
            href={directionLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void track(businessId, "DIRECTION", directionLink)}
            className="flex flex-none items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-3"
          >
            <MapPin className="h-4 w-4 text-violet-200" />
          </a>
        </div>
      </div>
    </div>
  );
}
