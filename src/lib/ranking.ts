// Explicit ordered position via binary-search insertion -- not Elo. Every
// comparison is a one-time authoritative statement ("Shrek 2 > Shrek 1")
// that should never be silently re-weighted later; binary insertion keeps
// the list always structurally consistent with every comparison made.
//
// Convention: rankPosition ascending == best to worst (position 1 == best).

// Given the current [lo, hi) search window, which existing-entry index does
// the next duel compare the new entry against?
export function duelOpponentIndex(lo: number, hi: number): number {
  return Math.floor((lo + hi) / 2);
}

// Narrow the search window after a duel. The new entry winning means it's
// better than the opponent, so it belongs before that index (hi = mid);
// losing means it belongs after (lo = mid + 1).
export function nextDuelRange(
  lo: number,
  hi: number,
  newEntryWon: boolean
): { lo: number; hi: number } {
  const mid = duelOpponentIndex(lo, hi);
  return newEntryWon ? { lo, hi: mid } : { lo: mid + 1, hi };
}

// Once lo === hi, that's the insertion index. Compute the fractional
// rankPosition: the midpoint of the two neighbors it landed between (or
// +/-1000 past whichever end it landed at, or 1000 if the subcategory was
// empty). Inserting this way never requires rewriting other rows.
export function computeRankPosition(
  existing: { rankPosition: number }[], // sorted ascending, best to worst
  insertionIndex: number
): number {
  if (existing.length === 0) return 1000;
  if (insertionIndex === 0) return existing[0].rankPosition - 1000;
  if (insertionIndex === existing.length) {
    return existing[existing.length - 1].rankPosition + 1000;
  }
  return (existing[insertionIndex - 1].rankPosition + existing[insertionIndex].rankPosition) / 2;
}
