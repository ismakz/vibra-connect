export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_INPUT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ImageKind = "image/jpeg" | "image/png" | "image/webp";

function detectImageKind(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export type ImageFileValidation =
  | { ok: true; kind: ImageKind; buffer: Buffer }
  | { ok: false; error: string };

/**
 * Vérifie taille, type navigateur et signature binaire (anti faux MIME).
 */
export async function validateClientImageFile(file: File): Promise<ImageFileValidation> {
  if (!file.size || file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return { ok: false, error: "Fichier trop volumineux (maximum 5 Mo)." };
  }

  const declared = file.type?.toLowerCase() ?? "";
  if (!ALLOWED_INPUT_TYPES.has(declared)) {
    return { ok: false, error: "Format non supporté. Utilisez JPG, PNG ou WebP." };
  }

  const ab = await file.arrayBuffer();
  const bytes = new Uint8Array(ab);
  const kind = detectImageKind(bytes);
  if (!kind) {
    return { ok: false, error: "Le fichier n’est pas une image valide (signature invalide)." };
  }
  if (kind !== declared) {
    return { ok: false, error: "Le type réel du fichier ne correspond pas à une image autorisée." };
  }

  return { ok: true, kind, buffer: Buffer.from(ab) };
}
