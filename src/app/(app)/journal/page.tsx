import Link from "next/link";
import { prisma } from "@/lib/db";
import { Domain } from "@/generated/prisma/client";

const DOMAINS: Domain[] = ["MEAL", "MOVIE", "GAME", "TRAVEL"];

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const { domain } = await searchParams;
  const selectedDomain = DOMAINS.includes(domain as Domain) ? (domain as Domain) : undefined;

  const entries = await prisma.entry.findMany({
    where: selectedDomain ? { domain: selectedDomain } : undefined,
    include: { subcategory: true, createdBy: true },
    orderBy: { experiencedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">Journal</h1>

      <nav className="flex gap-3 text-sm">
        <Link href="/journal" className={!selectedDomain ? "font-semibold" : "text-zinc-500"}>
          All
        </Link>
        {DOMAINS.map((d) => (
          <Link
            key={d}
            href={`/journal?domain=${d}`}
            className={selectedDomain === d ? "font-semibold" : "text-zinc-500"}
          >
            {d}
          </Link>
        ))}
      </nav>

      {entries.length === 0 && <p className="text-zinc-500">No entries yet.</p>}

      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded border p-3">
            <div className="flex justify-between text-sm text-zinc-500">
              <span>{entry.subcategory.label}</span>
              <span>{entry.experiencedAt.toISOString().slice(0, 10)}</span>
            </div>
            <div className="font-medium">{entry.title}</div>
            {entry.notes && <p className="text-sm text-zinc-600">{entry.notes}</p>}
            <p className="text-xs text-zinc-400">Added by {entry.createdBy.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
