// entry.rankPosition is intentionally never passed in or rendered here --
// only the array order (i.e. relative position) reaches the UI.
type RankedEntry = { id: string; title: string; notes: string | null };

export function RankedList({ entries }: { entries: RankedEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-zinc-500">No entries ranked yet.</p>;
  }

  return (
    <ol className="space-y-2">
      {entries.map((entry, i) => (
        <li key={entry.id} className="flex gap-3 rounded border p-3">
          <span className="font-semibold text-zinc-400">{i + 1}</span>
          <div>
            <div className="font-medium">{entry.title}</div>
            {entry.notes && <p className="text-sm text-zinc-600">{entry.notes}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
