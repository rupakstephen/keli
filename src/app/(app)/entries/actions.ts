"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Domain } from "@/generated/prisma/client";

export async function createEntry(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const domain = formData.get("domain") as Domain;
  const subcategoryId = formData.get("subcategoryId") as string;
  const title = (formData.get("title") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;
  const experiencedAt = formData.get("experiencedAt") as string;

  if (!domain || !subcategoryId || !title || !experiencedAt) return;

  // M1 just appends to the end of the subcategory's list. The binary-search
  // duel flow that actually places new entries by comparison is M2.
  const last = await prisma.entry.findFirst({
    where: { subcategoryId },
    orderBy: { rankPosition: "desc" },
  });
  const rankPosition = (last?.rankPosition ?? 0) + 1000;

  await prisma.entry.create({
    data: {
      domain,
      subcategoryId,
      title,
      notes,
      experiencedAt: new Date(experiencedAt),
      rankPosition,
      createdById: session.user.id,
    },
  });

  redirect("/journal");
}
