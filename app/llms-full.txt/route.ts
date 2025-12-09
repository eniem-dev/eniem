import { NextResponse } from "next/server";
import { generateLlmsFullText } from "@/lib/llms";

export const dynamic = "force-static";

export async function GET() {
  const content = await generateLlmsFullText();

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
