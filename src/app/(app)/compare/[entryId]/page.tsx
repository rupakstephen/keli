import { prisma } from "@/lib/db";
import { duelOpponentIndex } from "@/lib/ranking";
import { CompareDuel } from "@/components/CompareDuel";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ entryId: string }>;
  searchParams: Promise<{ lo?: string; hi?: string }>;
}) {
  const { entryId } = await params;
  const entry = await prisma.entry.findUniqueOrThrow({ where: { id: entryId } });

  const existing = await prisma.entry.findMany({
    where: { subcategoryId: entry.subcategoryId, id: { not: entryId } },
    orderBy: { rankPosition: "asc" },
  });

  const { lo: rawLo, hi: rawHi } = await searchParams;
  const lo = Math.min(Math.max(Number(rawLo) || 0, 0), existing.length);
  const hi = Math.min(Math.max(Number(rawHi) || existing.length, lo), existing.length);

  const opponent = existing[duelOpponentIndex(lo, hi)];

  return (
    <CompareDuel
      entryId={entry.id}
      opponentEntryId={opponent.id}
      lo={lo}
      hi={hi}
      newTitle={entry.title}
      opponentTitle={opponent.title}
    />
  );
}
