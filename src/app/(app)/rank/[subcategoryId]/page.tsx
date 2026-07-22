import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { RankedList } from "@/components/RankedList";

export const dynamic = "force-dynamic";

export default async function RankPage({
  params,
}: {
  params: Promise<{ subcategoryId: string }>;
}) {
  const { subcategoryId } = await params;

  const subcategory = await prisma.subcategory.findUnique({
    where: { id: subcategoryId },
    include: { entries: { orderBy: { rankPosition: "asc" } } },
  });

  if (!subcategory) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">
        {subcategory.domain} &middot; {subcategory.label}
      </h1>
      <RankedList entries={subcategory.entries} />
    </div>
  );
}
