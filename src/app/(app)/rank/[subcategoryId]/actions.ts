"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { computeRankPosition } from "@/lib/ranking";

// Manual re-rank: move one slot up/down without a full re-comparison
// (the "fast-follow" described in docs/implementation-plan.md's ranking
// section). Recomputes rankPosition as the midpoint of the new neighbors.
export async function moveEntry(formData: FormData) {
  const entryId = formData.get("entryId") as string;
  const direction = formData.get("direction") as string;

  const entry = await prisma.entry.findUniqueOrThrow({ where: { id: entryId } });
  const siblings = await prisma.entry.findMany({
    where: { subcategoryId: entry.subcategoryId },
    orderBy: { rankPosition: "asc" },
  });

  const index = siblings.findIndex((e) => e.id === entryId);
  const insertionIndex = direction === "up" ? index - 1 : index + 1;
  const remaining = siblings.filter((e) => e.id !== entryId);

  if (insertionIndex < 0 || insertionIndex > remaining.length) return;

  await prisma.entry.update({
    where: { id: entryId },
    data: { rankPosition: computeRankPosition(remaining, insertionIndex) },
  });

  revalidatePath(`/rank/${entry.subcategoryId}`);
}
