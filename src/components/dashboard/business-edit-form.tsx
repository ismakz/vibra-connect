"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { ComingSoonButton } from "@/components/dashboard/coming-soon-button";
import { DashboardGlassCard } from "@/components/dashboard/dashboard-glass-card";
import { LocationCascadingSelects } from "@/components/location/location-cascading-selects";
import { ImageUploadField } from "@/components/upload/image-upload-field";
import { getBusinessCoverImage, getBusinessLogoImage, isDataImage } from "@/lib/business-ui";
import type { LocationTreeCountry } from "@/lib/location-queries";
import { selectForm } from "@/lib/select-classes";

type Option = { id: string; name: string };

function cityNameFromTree(tree: LocationTreeCountry[], cityId: string): string | undefined {
  if (!cityId) return undefined;
  for (const c of tree) {
    for (const p of c.provinces) {
      const city = p.cities.find((x) => x.id === cityId);
      if (city) return city.name;
    }
  }
  return undefined;
}

type FormState = {
  name: string;
  description: string;
  categoryId: string;
  cityId: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  openingHours: string;
  logoUrl: string;
  bannerUrl: string;
  galleryImages: string;
  contactPreference: "WHATSAPP" | "PHONE" | "BIZAFLOW_TELECOM" | "INTERNAL_MESSAGE" | "EMAIL";
};

export function BusinessEditForm({
  initialValues,
  locationTree,
  categories,
  maxGalleryImages,
  databaseAvailable,
  imageUploadConfigured,
}: {
  initialValues: FormState;
  locationTree: LocationTreeCountry[];
  categories: Option[];
  maxGalleryImages: number;
  databaseAvailable: boolean;
  imageUploadConfigured: boolean;
}) {
  const [values, setValues] = useState<FormState>(initialValues);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });
  const [saving, setSaving] = useState(false);

  const galleryPreview = values.galleryImages
    .split(/\r?\n|,/)
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, maxGalleryImages);

  const cityName = cityNameFromTree(locationTree, values.cityId) ?? "Ville";
  const categoryName = categories.find((c) => c.id === values.categoryId)?.name ?? "Catégorie";

  const preview = useMemo(() => {
    return {
      name: values.name.trim() || "Nom du business",
      description: values.description.trim() || "Description professionnelle de votre business.",
      city: cityName,
      category: categoryName,
      cover: getBusinessCoverImage({
        name: values.name.trim() || "Business",
        bannerUrl: values.bannerUrl.trim() || null,
        category: { name: categoryName },
        city: { name: cityName },
      }),
      logo: getBusinessLogoImage({
        name: values.name.trim() || "Business",
        logoUrl: values.logoUrl.trim() || null,
      }),
      gallery: galleryPreview,
    };
  }, [values, cityName, categoryName, galleryPreview]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!databaseAvailable) {
      setStatus({
        type: "error",
        message: "Base de données indisponible. Modification impossible en mode vitrine.",
      });
      return;
    }

    if (!values.name.trim()) {
      setStatus({ type: "error", message: "Le nom du business est requis." });
      return;
    }
    if (!values.cityId || !values.categoryId) {
      setStatus({ type: "error", message: "Sélectionnez la ville et la catégorie." });
      return;
    }
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setStatus({ type: "error", message: "Email invalide." });
      return;
    }
    if (galleryPreview.length > maxGalleryImages) {
      setStatus({ type: "error", message: `Maximum ${maxGalleryImages} images dans la galerie.` });
      return;
    }
    const invalidGalleryUrl = galleryPreview.find((url) => {
      try {
        const parsed = new URL(url);
        return !["http:", "https:"].includes(parsed.protocol);
      } catch {
        return true;
      }
    });
    if (invalidGalleryUrl) {
      setStatus({ type: "error", message: "La galerie contient une URL invalide." });
      return;
    }

    setSaving(true);
    setStatus({ type: "idle", message: "" });

    try {
      const response = await fetch("/api/dashboard/business/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        setStatus({ type: "error", message: result.error ?? "Échec de la sauvegarde." });
      } else {
        setStatus({ type: "success", message: "Profil business mis à jour avec succès." });
      }
    } catch {
      setStatus({ type: "error", message: "Erreur réseau. Veuillez réessayer." });
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm";

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form onSubmit={onSubmit} className="space-y-5">
        <DashboardGlassCard className="p-5">
          <h2 className="text-lg font-bold">Informations principales</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input
              value={values.name}
              onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nom business"
              className={inputClass}
            />
            <input
              value={values.email}
              onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email (optionnel)"
              className={inputClass}
            />
            <select
              value={values.categoryId}
              onChange={(e) => setValues((p) => ({ ...p, categoryId: e.target.value }))}
              className={selectForm}
            >
              <option value="">Catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="md:col-span-2">
              <LocationCascadingSelects
                tree={locationTree}
                value={values.cityId}
                onChange={(id) => setValues((p) => ({ ...p, cityId: id }))}
                valueMode="id"
                disabled={!databaseAvailable}
              />
            </div>
            <input
              value={values.phone}
              onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Téléphone"
              className={inputClass}
            />
            <input
              value={values.whatsapp}
              onChange={(e) => setValues((p) => ({ ...p, whatsapp: e.target.value }))}
              placeholder="WhatsApp"
              className={inputClass}
            />
            <input
              value={values.address}
              onChange={(e) => setValues((p) => ({ ...p, address: e.target.value }))}
              placeholder="Adresse"
              className={`${inputClass} md:col-span-2`}
            />
            <input
              value={values.openingHours}
              onChange={(e) => setValues((p) => ({ ...p, openingHours: e.target.value }))}
              placeholder="Horaires (ex: 08:00-18:00)"
              className={`${inputClass} md:col-span-2`}
            />
          </div>
          <textarea
            value={values.description}
            onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description professionnelle"
            className={`${inputClass} mt-3 min-h-24`}
          />
        </DashboardGlassCard>

        <DashboardGlassCard className="p-5">
          <h2 className="text-lg font-bold">Médias & contact</h2>
          <div className="mt-3 grid gap-3">
            <div>
              <span className="mb-1 block text-xs text-white/70">Logo URL</span>
              <ImageUploadField
                purpose="business-logo"
                label="Logo (upload)"
                value={values.logoUrl}
                onChange={(logoUrl) => setValues((p) => ({ ...p, logoUrl }))}
                imageUploadConfigured={imageUploadConfigured}
                disabled={!databaseAvailable}
                className="mb-2"
              />
              <input
                value={values.logoUrl}
                onChange={(e) => setValues((p) => ({ ...p, logoUrl: e.target.value }))}
                placeholder="Logo URL"
                className={inputClass}
              />
            </div>
            <div>
              <span className="mb-1 block text-xs text-white/70">Bannière URL</span>
              <ImageUploadField
                purpose="business-banner"
                label="Bannière (upload)"
                value={values.bannerUrl}
                onChange={(bannerUrl) => setValues((p) => ({ ...p, bannerUrl }))}
                imageUploadConfigured={imageUploadConfigured}
                disabled={!databaseAvailable}
                className="mb-2"
              />
              <input
                value={values.bannerUrl}
                onChange={(e) => setValues((p) => ({ ...p, bannerUrl: e.target.value }))}
                placeholder="Bannière URL"
                className={inputClass}
              />
            </div>
            <div>
              <span className="mb-1 block text-xs text-white/70">Galerie (URLs)</span>
              <ImageUploadField
                purpose="business-gallery"
                label="Ajouter une image à la galerie (upload)"
                value=""
                onChange={(url) =>
                  setValues((p) => {
                    const cur = p.galleryImages.trim();
                    if (!cur) return { ...p, galleryImages: url };
                    const lines = cur.split(/\r?\n/).filter(Boolean);
                    if (lines.length >= maxGalleryImages) return p;
                    return { ...p, galleryImages: `${cur.replace(/\s+$/, "")}\n${url}` };
                  })
                }
                imageUploadConfigured={imageUploadConfigured}
                disabled={!databaseAvailable}
                className="mb-2"
              />
              <textarea
                value={values.galleryImages}
                onChange={(e) => setValues((p) => ({ ...p, galleryImages: e.target.value }))}
                placeholder="Galerie images (URLs séparées par virgule ou ligne)"
                className={`${inputClass} min-h-24`}
              />
            </div>
            <p className="text-xs text-white/60">
              {galleryPreview.length}/{maxGalleryImages} images
            </p>
            <select
              value={values.contactPreference}
              onChange={(e) => setValues((p) => ({ ...p, contactPreference: e.target.value as FormState["contactPreference"] }))}
              className={selectForm}
            >
              <option value="WHATSAPP">Préférence contact: WhatsApp</option>
              <option value="PHONE">Téléphone</option>
              <option value="EMAIL">Email</option>
              <option value="BIZAFLOW_TELECOM">Bizaflow Telecom</option>
              <option value="INTERNAL_MESSAGE">Message interne</option>
            </select>
          </div>
          <div className="mt-3">
            <ComingSoonButton
              label="Configurer Bizaflow Telecom"
              className="rounded-full border border-cyan-300/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200"
              description="L’intégration Bizaflow Telecom sera disponible prochainement."
            />
          </div>
        </DashboardGlassCard>

        {status.type !== "idle" && (
          <div
            className={[
              "rounded-xl border px-4 py-3 text-sm",
              status.type === "success"
                ? "border-green-400/30 bg-green-500/10 text-green-200"
                : "border-amber-400/30 bg-amber-500/10 text-amber-200",
            ].join(" ")}
          >
            {status.message}
          </div>
        )}

        <div className="flex gap-2">
          <button
            disabled={saving || !databaseAvailable}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>

      <div className="space-y-5">
        <DashboardGlassCard className="overflow-hidden p-0">
          <div className="relative h-36">
            <Image
              src={preview.cover}
              alt="Preview cover"
              fill
              sizes="(max-width: 1024px) 100vw, 360px"
              className="object-cover"
              unoptimized={isDataImage(preview.cover)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050816]/80 to-transparent" />
          </div>
          <div className="p-4">
            <div className="-mt-10 flex items-end gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full border border-white/20 bg-white/10 p-1">
                <Image
                  src={preview.logo}
                  alt="Preview logo"
                  width={48}
                  height={48}
                  className="h-full w-full rounded-full object-cover"
                  unoptimized={isDataImage(preview.logo)}
                />
              </div>
              <div>
                <p className="font-semibold">{preview.name}</p>
                <p className="text-xs text-white/70">
                  {preview.category} • {preview.city}
                </p>
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-white/75">{preview.description}</p>
          </div>
        </DashboardGlassCard>

        <DashboardGlassCard className="p-4">
          <h3 className="text-sm font-semibold text-cyan-200">Galerie preview</h3>
          {preview.gallery.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {preview.gallery.map((src) => (
                <div key={src} className="relative h-16 overflow-hidden rounded-lg border border-white/10">
                  <Image src={src} alt="Gallery preview" fill className="object-cover" sizes="100px" />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-white/65">Ajoutez des URLs d&apos;images pour voir la galerie.</p>
          )}
        </DashboardGlassCard>
      </div>
    </div>
  );
}
