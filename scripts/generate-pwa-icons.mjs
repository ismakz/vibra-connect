/**
 * Génère les PNG PWA + favicon.ico à partir de public/logo.png (logo officiel)
 * Exécution : npm run pwa:icons
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const logoPath = path.join(root, "public", "logo.png");

async function main() {
  if (!fs.existsSync(logoPath)) {
    console.error("Fichier manquant : public/logo.png");
    process.exit(1);
  }

  const input = sharp(logoPath);

  const png192 = await input.clone().resize(192, 192, { fit: "contain", background: { r: 5, g: 8, b: 22, alpha: 1 } }).png().toBuffer();
  const png512 = await input.clone().resize(512, 512, { fit: "contain", background: { r: 5, g: 8, b: 22, alpha: 1 } }).png().toBuffer();
  const apple = await input.clone().resize(180, 180, { fit: "contain", background: { r: 5, g: 8, b: 22, alpha: 1 } }).png().toBuffer();
  const png32 = await input.clone().resize(32, 32, { fit: "contain", background: { r: 5, g: 8, b: 22, alpha: 1 } }).png().toBuffer();
  const png16 = await input.clone().resize(16, 16, { fit: "contain", background: { r: 5, g: 8, b: 22, alpha: 1 } }).png().toBuffer();

  fs.writeFileSync(path.join(root, "public", "icon-192.png"), png192);
  fs.writeFileSync(path.join(root, "public", "icon-512.png"), png512);
  fs.writeFileSync(path.join(root, "public", "apple-touch-icon.png"), apple);

  const ico = await pngToIco([png16, png32]);
  fs.writeFileSync(path.join(root, "public", "favicon.ico"), ico);

  console.log("OK: icon-192.png, icon-512.png, apple-touch-icon.png, favicon.ico");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
