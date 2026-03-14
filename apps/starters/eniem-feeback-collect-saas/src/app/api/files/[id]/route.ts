import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const file = await prisma.file.findUnique({
      where: { id },
      select: { base64Data: true, mimeType: true },
    });

    if (!file) {
      return new Response("Not Found", { status: 404 });
    }

    const buffer = Buffer.from(file.base64Data, "base64");

    return new Response(buffer, {
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
}
