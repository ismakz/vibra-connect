import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { uploadImageBufferToCloudinary } from "@/lib/cloudinary-upload";
import { isImageUploadConfigured } from "@/lib/image-upload-config";
import { cloudinaryFolderForPurpose, isValidImageUploadPurpose } from "@/lib/image-upload-purpose";
import { validateClientImageFile } from "@/lib/validate-image-file";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isImageUploadConfigured()) {
    return NextResponse.json({ ok: false, error: "Upload image non configuré sur le serveur." }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Vous devez être connecté pour envoyer une image." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Requête multipart invalide." }, { status: 400 });
  }

  const purposeRaw = String(formData.get("purpose") ?? "").trim();
  if (!isValidImageUploadPurpose(purposeRaw)) {
    return NextResponse.json({ ok: false, error: "Type d’upload non autorisé." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Champ « file » manquant ou invalide." }, { status: 400 });
  }

  const validated = await validateClientImageFile(file);
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  try {
    const folder = cloudinaryFolderForPurpose(purposeRaw);
    const { secureUrl } = await uploadImageBufferToCloudinary(validated.buffer, folder);
    return NextResponse.json({ ok: true, url: secureUrl });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Échec de l’envoi vers le stockage d’images. Réessayez dans un instant." },
      { status: 502 },
    );
  }
}
