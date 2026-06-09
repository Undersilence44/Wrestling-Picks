import sharp from "sharp";

const input = "public/logo.png";

async function makeIcon(size, output) {
  await sharp(input)
    .resize(size, size, {
      fit: "contain",
      background: { r: 2, g: 6, b: 23, alpha: 1 },
    })
    .png()
    .toFile(output);
}

await makeIcon(192, "public/icons/app-icon-192.png");
await makeIcon(512, "public/icons/app-icon-512.png");
await makeIcon(180, "public/icons/apple-touch-icon.png");

console.log("PWA icons generated");
