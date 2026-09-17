import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatStats } from "@/lib/statsStrip";
import { PhotoUploader } from "@/components/PhotoUploader";

// Same reasoning as subcategories/page.tsx: must be fresh on every request.
export const dynamic = "force-dynamic";

export default async function AccomplishmentsPage() {
  const [accomplishments, entryCountsByDomain, totalComparisons, cookedFromRecipes] =
    await Promise.all([
      prisma.accomplishment.findMany({
        orderBy: { achievedAt: "desc" },
        include: { photos: { select: { id: true, url: true } } },
      }),
      prisma.entry.groupBy({ by: ["domain"], _count: { _all: true } }),
      prisma.comparison.count(),
      prisma.entry.groupBy({ by: ["recipeId"], where: { recipeId: { not: null } } }),
    ]);

  const stats = formatStats({
    entryCountsByDomain: entryCountsByDomain.map((d) => ({
      domain: d.domain,
      count: d._count._all,
    })),
    totalComparisons,
    recipesCookedFrom: cookedFromRecipes.length,
    totalAccomplishments: accomplishments.length,
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Accomplishments</h1>
        <Link href="/accomplishments/new" className="text-sm underline">
          Add
        </Link>
      </div>

      <dl className="flex flex-wrap gap-4 rounded border p-3 text-sm">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-zinc-500">{s.label}</dt>
            <dd className="text-lg font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>

      {accomplishments.length === 0 && (
        <p className="text-zinc-500">No accomplishments logged yet.</p>
      )}

      <ul className="space-y-4">
        {accomplishments.map((a) => (
          <li key={a.id} className="rounded border p-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">{a.title}</h2>
              <time className="text-xs text-zinc-500">
                {a.achievedAt.toISOString().slice(0, 10)}
              </time>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{a.description}</p>
            <div className="mt-2">
              <PhotoUploader
                accomplishmentId={a.id}
                photos={a.photos}
                revalidate="/accomplishments"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
