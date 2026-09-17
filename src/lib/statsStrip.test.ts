import { test } from "node:test";
import assert from "node:assert/strict";
import { formatStats } from "./statsStrip";

test("formats domain counts, comparisons, recipes, and accomplishments", () => {
  const stats = formatStats({
    entryCountsByDomain: [
      { domain: "MEAL", count: 12 },
      { domain: "MOVIE", count: 3 },
    ],
    totalComparisons: 25,
    recipesCookedFrom: 4,
    totalAccomplishments: 2,
  });

  assert.deepEqual(stats, [
    { label: "Meals", value: 12 },
    { label: "Movies", value: 3 },
    { label: "Comparisons", value: 25 },
    { label: "Recipes cooked", value: 4 },
    { label: "Accomplishments", value: 2 },
  ]);
});

test("omits domains with zero entries", () => {
  const stats = formatStats({
    entryCountsByDomain: [{ domain: "GAME", count: 0 }],
    totalComparisons: 0,
    recipesCookedFrom: 0,
    totalAccomplishments: 0,
  });

  assert.deepEqual(
    stats.map((s) => s.label),
    ["Comparisons", "Recipes cooked", "Accomplishments"]
  );
});
