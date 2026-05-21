/**
 * Génère les PNG PWA + favicon.ico à partir de public/logo.svg
 * Exécution : npm run pwa:icons
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public", "logo.svg");

async function main() {
  const svg = fs.readFileSync(svgPath);

  const png192 = await sharp(svg).resize(192, 192).png().toBuffer();
  const png512 = await sharp(svg).resize(512, 512).png().toBuffer();
  const apple = await sharp(svg).resize(180, 180).png().toBuffer();
  const png32 = await sharp(svg).resize(32, 32).png().toBuffer();
  const png16 = await sharp(svg).resize(16, 16).png().toBuffer();

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
