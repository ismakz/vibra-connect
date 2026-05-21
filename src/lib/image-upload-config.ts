/** True si l’upload Cloudinary côté serveur est utilisable (`POST /api/upload`). */
export function isImageUploadConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
  );
}
