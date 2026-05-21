import { Readable } from "node:stream";

import { v2 as cloudinary } from "cloudinary";

function ensureConfigured() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary non configuré");
  }
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
}

export async function uploadImageBufferToCloudinary(buffer: Buffer, folder: string): Promise<{ secureUrl: string }> {
  ensureConfigured();
  const secureUrl = await new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "image" }, (err, result) => {
      if (err) reject(err);
      else if (!result?.secure_url) reject(new Error("Réponse Cloudinary invalide"));
      else resolve(result.secure_url);
    });
    Readable.from(buffer).pipe(stream);
  });
  return { secureUrl };
}
