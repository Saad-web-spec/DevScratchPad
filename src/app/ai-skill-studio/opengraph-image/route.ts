import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const imagePath = path.join(process.cwd(), "public", "og-ai-skill-studio.png");
  const buffer = fs.readFileSync(imagePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
