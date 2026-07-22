import { submitComparison } from "@/app/(app)/compare/[entryId]/actions";

export function CompareDuel({
  entryId,
  opponentEntryId,
  lo,
  hi,
  newTitle,
  opponentTitle,
}: {
  entryId: string;
  opponentEntryId: string;
  lo: number;
  hi: number;
  newTitle: string;
  opponentTitle: string;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">Which was better?</h1>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { winner: "new", title: newTitle },
            { winner: "opponent", title: opponentTitle },
          ] as const
        ).map(({ winner, title }) => (
          <form key={winner} action={submitComparison}>
            <input type="hidden" name="entryId" value={entryId} />
            <input type="hidden" name="opponentEntryId" value={opponentEntryId} />
            <input type="hidden" name="lo" value={lo} />
            <input type="hidden" name="hi" value={hi} />
            <input type="hidden" name="winner" value={winner} />
            <button
              type="submit"
              className="h-32 w-full rounded border p-3 text-center font-medium hover:bg-zinc-50"
            >
              {title}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
