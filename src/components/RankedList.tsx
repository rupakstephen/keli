import Link from "next/link";
import { moveEntry } from "@/app/(app)/rank/[subcategoryId]/actions";

// entry.rankPosition is intentionally never passed in or rendered here --
// only the array order (i.e. relative position) reaches the UI.
type RankedEntry = { id: string; title: string; notes: string | null };

export function RankedList({ entries }: { entries: RankedEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-zinc-500">No entries ranked yet -- add one to get started.</p>;
  }

  return (
    <ol className="space-y-2">
      {entries.map((entry, i) => (
        <li key={entry.id} className="flex items-center gap-3 rounded border p-3">
          <span className="font-semibold text-zinc-400">{i + 1}</span>
          <Link href={`/entries/${entry.id}`} className="flex-1">
            <div className="font-medium">{entry.title}</div>
            {entry.notes && <p className="text-sm text-zinc-600">{entry.notes}</p>}
          </Link>
          <div className="flex flex-col gap-1">
            <form action={moveEntry}>
              <input type="hidden" name="entryId" value={entry.id} />
              <input type="hidden" name="direction" value="up" />
              <button
                type="submit"
                disabled={i === 0}
                aria-label="Move up"
                className="rounded border px-2 py-0.5 text-xs disabled:opacity-30"
              >
                ↑
              </button>
            </form>
            <form action={moveEntry}>
              <input type="hidden" name="entryId" value={entry.id} />
              <input type="hidden" name="direction" value="down" />
              <button
                type="submit"
                disabled={i === entries.length - 1}
                aria-label="Move down"
                className="rounded border px-2 py-0.5 text-xs disabled:opacity-30"
              >
                ↓
              </button>
            </form>
          </div>
        </li>
      ))}
    </ol>
  );
}
