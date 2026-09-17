const DOMAIN_LABELS: Record<string, string> = {
  MEAL: "Meals",
  MOVIE: "Movies",
  GAME: "Games",
  TRAVEL: "Travel",
};

export function formatStats(input: {
  entryCountsByDomain: { domain: string; count: number }[];
  totalComparisons: number;
  recipesCookedFrom: number;
  totalAccomplishments: number;
}): { label: string; value: number }[] {
  const domainStats = input.entryCountsByDomain
    .filter((d) => d.count > 0)
    .map((d) => ({ label: DOMAIN_LABELS[d.domain] ?? d.domain, value: d.count }));

  return [
    ...domainStats,
    { label: "Comparisons", value: input.totalComparisons },
    { label: "Recipes cooked", value: input.recipesCookedFrom },
    { label: "Accomplishments", value: input.totalAccomplishments },
  ];
}
