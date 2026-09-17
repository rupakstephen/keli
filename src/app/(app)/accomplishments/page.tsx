import Link from "next/link";
import { prisma } from "@/lib/db";

// Same reasoning as subcategories/page.tsx: must be fresh on every request.
export const dynamic = "force-dynamic";

export default async function AccomplishmentsPage() {
  const accomplishments = await prisma.accomplishment.findMany({
    orderBy: { achievedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Accomplishments</h1>
        <Link href="/accomplishments/new" className="text-sm underline">
          Add
        </Link>
      </div>

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
          </li>
        ))}
      </ul>
    </div>
  );
}
