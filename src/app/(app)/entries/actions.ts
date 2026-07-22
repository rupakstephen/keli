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

  // Placeholder position -- appended past the current worst entry. Correct
  // if the subcategory was empty (nothing to duel against); otherwise this
  // is overwritten once the duel flow below resolves where it really goes.
  const worst = await prisma.entry.findFirst({
    where: { subcategoryId },
    orderBy: { rankPosition: "desc" },
  });

  const entry = await prisma.entry.create({
    data: {
      domain,
      subcategoryId,
      title,
      notes,
      experiencedAt: new Date(experiencedAt),
      rankPosition: (worst?.rankPosition ?? 0) + 1000,
      createdById: session.user.id,
    },
  });

  const existing = await prisma.entry.findMany({
    where: { subcategoryId, id: { not: entry.id } },
    orderBy: { rankPosition: "asc" },
  });

  if (existing.length === 0) {
    // Nothing to compare against -- the placeholder above is already correct.
    redirect(`/rank/${subcategoryId}`);
  }

  redirect(`/compare/${entry.id}?lo=0&hi=${existing.length}`);
}
