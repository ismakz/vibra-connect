export const IMAGE_UPLOAD_PURPOSES = [
  "avatar",
  "business-logo",
  "business-banner",
  "business-gallery",
  "product",
  "bizapay-proof",
] as const;

export type ImageUploadPurpose = (typeof IMAGE_UPLOAD_PURPOSES)[number];

const PURPOSE_TO_FOLDER: Record<ImageUploadPurpose, string> = {
  avatar: "vibra-connect/avatars",
  "business-logo": "vibra-connect/business/logos",
  "business-banner": "vibra-connect/business/banners",
  "business-gallery": "vibra-connect/business/gallery",
  product: "vibra-connect/products",
  "bizapay-proof": "vibra-connect/bizapay-proofs",
};

export function isValidImageUploadPurpose(value: string): value is ImageUploadPurpose {
  return (IMAGE_UPLOAD_PURPOSES as readonly string[]).includes(value);
}

export function cloudinaryFolderForPurpose(purpose: ImageUploadPurpose): string {
  return PURPOSE_TO_FOLDER[purpose];
}
