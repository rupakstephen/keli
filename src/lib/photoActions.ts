"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validatePhotoTarget } from "@/lib/photoTarget";

export async function attachPhoto(input: {
  url: string;
  entryId: string | null;
  accomplishmentId: string | null;
  revalidate: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const validation = validatePhotoTarget(input);
  if (!validation.ok) throw new Error(validation.error);

  await prisma.photo.create({
    data: {
      url: input.url,
      entryId: input.entryId,
      accomplishmentId: input.accomplishmentId,
      uploadedById: session.user.id,
    },
  });

  revalidatePath(input.revalidate);
}
