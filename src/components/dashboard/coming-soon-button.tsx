"use client";

import { useState } from "react";

export function ComingSoonButton({
  label,
  className,
  title = "Formulaire bientôt disponible",
  description = "Cette fonctionnalité sera disponible très prochainement dans VIBRA CONNECT.",
}: {
  label: string;
  className: string;
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass w-full max-w-md rounded-2xl border border-white/15 p-5">
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm text-white/80">{description}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
