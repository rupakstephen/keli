import Link from "next/link";
import { prisma } from "@/lib/db";
import { Domain } from "@/generated/prisma/client";
import { DomainTabs } from "@/components/DomainTabs";

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

      <DomainTabs basePath="/journal" selected={selectedDomain} />

      {entries.length === 0 && (
        <p className="text-zinc-500">
          No entries yet --{" "}
          <Link href="/entries/new" className="underline">
            add your first one
          </Link>
          .
        </p>
      )}

      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded border p-3">
            <div className="flex justify-between text-sm text-zinc-500">
              <Link href={`/rank/${entry.subcategoryId}`} className="underline">
                {entry.subcategory.label}
              </Link>
              <span>{entry.experiencedAt.toISOString().slice(0, 10)}</span>
            </div>
            <Link href={`/entries/${entry.id}`} className="font-medium">
              {entry.title}
            </Link>
            {entry.notes && <p className="text-sm text-zinc-600">{entry.notes}</p>}
            <p className="text-xs text-zinc-400">Added by {entry.createdBy.name}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
