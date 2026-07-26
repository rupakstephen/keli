import Link from "next/link";
import { prisma } from "@/lib/db";

// The recipe list must be fresh on every request, not baked in at build time.
export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Recipe box</h1>
        <Link href="/recipes/new" className="rounded bg-black px-3 py-1 text-sm text-white">
          Add recipe
        </Link>
      </div>

      {recipes.length === 0 && (
        <p className="text-zinc-500">
          No recipes yet --{" "}
          <Link href="/recipes/new" className="underline">
            add your first one
          </Link>
          .
        </p>
      )}

      <ul className="space-y-2">
        {recipes.map((recipe) => (
          <li key={recipe.id} className="rounded border p-3">
            <Link href={`/recipes/${recipe.id}`} className="font-medium">
              {recipe.title}
            </Link>
            {recipe.sourceUrl && (
              <p className="truncate text-xs text-zinc-400">{recipe.sourceUrl}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
