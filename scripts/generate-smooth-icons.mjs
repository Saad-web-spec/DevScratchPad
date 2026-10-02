import sharp from "sharp";
import fs from "fs";
import path from "path";

const transparentSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="2048" height="2048">
  <g fill="none" stroke="#000000" stroke-width="36" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 178 142 L 64 256 L 178 370" />
    <path d="M 278 116 L 234 396" />
    <path d="M 334 142 L 448 256 L 334 370" />
  </g>
</svg>`;

const whiteBgSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="2048" height="2048">
  <rect width="512" height="512" fill="#ffffff" />
  <g fill="none" stroke="#000000" stroke-width="36" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 178 142 L 64 256 L 178 370" />
    <path d="M 278 116 L 234 396" />
    <path d="M 334 142 L 448 256 L 334 370" />
  </g>
</svg>`;

const maskableSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="2048" height="2048">
  <rect width="512" height="512" fill="#ffffff" />
  <g transform="translate(51.2, 51.2) scale(0.8)" fill="none" stroke="#000000" stroke-width="36" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 178 142 L 64 256 L 178 370" />
    <path d="M 278 116 L 234 396" />
    <path d="M 334 142 L 448 256 L 334 370" />
  </g>
</svg>`;

async function renderPng(svg, size, outputPath) {
  await sharp(Buffer.from(svg))
    .resize(size, size, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  console.log(`Generated: ${outputPath} (${size}x${size})`);
}

async function main() {
  // 1. src/app icons (Next.js app router metadata)
  await renderPng(transparentSvg, 512, path.join("src", "app", "icon.png"));
  await renderPng(whiteBgSvg, 512, path.join("src", "app", "apple-icon.png"));

  // 2. public icons (for PWA manifest and direct web access)
  await renderPng(transparentSvg, 512, path.join("public", "icon.png"));
  await renderPng(whiteBgSvg, 512, path.join("public", "apple-icon.png"));
  await renderPng(transparentSvg, 192, path.join("public", "icon-192.png"));
  await renderPng(transparentSvg, 512, path.join("public", "icon-512.png"));
  await renderPng(maskableSvg, 512, path.join("public", "icon-maskable-512.png"));

  console.log("All smooth icons generated successfully!");
}

main().catch(console.error);
