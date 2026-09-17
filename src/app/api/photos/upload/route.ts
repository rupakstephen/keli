import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validatePhotoTarget } from "@/lib/photoTarget";

// Client-upload pattern: the browser gets a short-lived signed token from
// this route, then uploads bytes directly to Blob storage -- image bytes
// never pass through this server function's body (avoids Vercel's function
// payload-size limits).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const target = JSON.parse(clientPayload ?? "{}") as {
          entryId: string | null;
          accomplishmentId: string | null;
        };
        const validation = validatePhotoTarget(target);
        if (!validation.ok) {
          throw new Error(validation.error);
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
          tokenPayload: JSON.stringify({ ...target, uploadedById: session.user.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { entryId, accomplishmentId, uploadedById } = JSON.parse(
          tokenPayload ?? "{}"
        ) as { entryId: string | null; accomplishmentId: string | null; uploadedById: string };
        await prisma.photo.create({
          data: { url: blob.url, entryId, accomplishmentId, uploadedById },
        });
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
