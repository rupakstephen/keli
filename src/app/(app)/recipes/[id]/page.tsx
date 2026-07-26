import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { entries: { include: { subcategory: true } } },
  });

  if (!recipe) notFound();

  const ingredients = asStringArray(recipe.ingredients);
  const instructions = asStringArray(recipe.instructions);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">{recipe.title}</h1>

      {recipe.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable source hosts
        <img src={recipe.imageUrl} alt="" className="w-full rounded" />
      )}

      <div className="flex gap-4 text-sm text-zinc-500">
        {recipe.servings != null && <span>{recipe.servings} servings</span>}
        {recipe.prepTimeMin != null && <span>Prep {recipe.prepTimeMin}m</span>}
        {recipe.cookTimeMin != null && <span>Cook {recipe.cookTimeMin}m</span>}
      </div>

      {recipe.sourceUrl && (
        <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="text-sm underline">
          Original source
        </a>
      )}

      {ingredients.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-500">Ingredients</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {ingredients.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {instructions.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-500">Instructions</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {instructions.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      )}

      {recipe.entries.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-500">Cooked as</h2>
          <ul className="space-y-1 text-sm">
            {recipe.entries.map((entry) => (
              <li key={entry.id}>
                <Link href={`/entries/${entry.id}`} className="underline">
                  {entry.title}
                </Link>{" "}
                <span className="text-zinc-400">({entry.subcategory.label})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
