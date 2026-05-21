"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { ImageUploadPurpose } from "@/lib/image-upload-purpose";
import { MAX_IMAGE_UPLOAD_BYTES } from "@/lib/validate-image-file";

function isLikelyImageUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  try {
    const u = new URL(t);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export type ImageUploadFieldProps = {
  purpose: ImageUploadPurpose;
  label?: string;
  /** URL affichée / envoyée au formulaire (https…). */
  value: string;
  onChange: (nextUrl: string) => void;
  imageUploadConfigured: boolean;
  disabled?: boolean;
  className?: string;
};

export function ImageUploadField({
  purpose,
  label,
  value,
  onChange,
  imageUploadConfigured,
  disabled = false,
  className = "",
}: ImageUploadFieldProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef<string | null>(null);
  const [inputNonce, setInputNonce] = useState(0);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, []);

  const revokeBlob = useCallback(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    setLocalPreview(null);
    setInputNonce((n) => n + 1);
  }, []);

  const previewSrc = localPreview ?? (isLikelyImageUrl(value) ? value.trim() : null);

  const onPickFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setError("");
      if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        setError("Fichier trop volumineux (maximum 5 Mo).");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Format non supporté. Utilisez JPG, PNG ou WebP.");
        return;
      }
      revokeBlob();
      const objectUrl = URL.createObjectURL(file);
      blobRef.current = objectUrl;
      setLocalPreview(objectUrl);

      setUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);
        body.append("purpose", purpose);
        const res = await fetch("/api/upload", { method: "POST", body });
        const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
        if (!res.ok || !data.ok || !data.url) {
          setError(data.error ?? "Échec de l’upload.");
          revokeBlob();
          return;
        }
        onChange(data.url);
        revokeBlob();
      } catch {
        setError("Erreur réseau pendant l’upload.");
        revokeBlob();
      } finally {
        setUploading(false);
      }
    },
    [onChange, purpose, revokeBlob],
  );

  const onRemove = useCallback(() => {
    setError("");
    revokeBlob();
    onChange("");
    fileRef.current?.focus();
  }, [onChange, revokeBlob]);

  const onReplace = useCallback(() => {
    setError("");
    fileRef.current?.click();
  }, []);

  const busy = disabled || uploading;

  return (
    <div className={`space-y-2 ${className}`}>
      {label ? <span className="mb-1 block text-xs text-white/70">{label}</span> : null}

      {!imageUploadConfigured ? (
        <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Upload image non configuré, utilisez une URL.
        </p>
      ) : null}

      {imageUploadConfigured ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            key={inputNonce}
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            disabled={busy}
            onChange={onPickFile}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Envoi en cours…" : "Choisir une photo"}
          </button>
          {isLikelyImageUrl(value) ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onReplace}
                className="rounded-lg border border-cyan-400/35 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remplacer
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onRemove}
                className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Supprimer
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs text-red-100">{error}</p>
      ) : null}

      {previewSrc ? (
        <div className="relative mt-1 h-28 w-28 overflow-hidden rounded-xl border border-white/15 bg-white/5">
          <Image src={previewSrc} alt="" fill className="object-cover" sizes="112px" unoptimized />
        </div>
      ) : null}
    </div>
  );
}
