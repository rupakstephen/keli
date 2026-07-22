"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeRankPosition, nextDuelRange } from "@/lib/ranking";

export async function submitComparison(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const entryId = formData.get("entryId") as string;
  const opponentEntryId = formData.get("opponentEntryId") as string;
  const lo = Number(formData.get("lo"));
  const hi = Number(formData.get("hi"));
  const newEntryWon = formData.get("winner") === "new";

  const entry = await prisma.entry.findUniqueOrThrow({ where: { id: entryId } });

  await prisma.comparison.create({
    data: {
      subcategoryId: entry.subcategoryId,
      winnerEntryId: newEntryWon ? entryId : opponentEntryId,
      loserEntryId: newEntryWon ? opponentEntryId : entryId,
      comparedById: session.user.id,
    },
  });

  const { lo: nextLo, hi: nextHi } = nextDuelRange(lo, hi, newEntryWon);

  if (nextLo < nextHi) {
    redirect(`/compare/${entryId}?lo=${nextLo}&hi=${nextHi}`);
  }

  // lo === hi: that's the insertion index. Finalize the real rankPosition.
  const existing = await prisma.entry.findMany({
    where: { subcategoryId: entry.subcategoryId, id: { not: entryId } },
    orderBy: { rankPosition: "asc" },
  });

  await prisma.entry.update({
    where: { id: entryId },
    data: { rankPosition: computeRankPosition(existing, nextLo) },
  });

  redirect(`/rank/${entry.subcategoryId}`);
}
