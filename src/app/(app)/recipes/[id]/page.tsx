import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { RecipeForm } from "../new/RecipeForm";
import { updateRecipe } from "./actions";

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

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">{recipe.title}</h1>

      <RecipeForm
        action={updateRecipe}
        id={recipe.id}
        submitLabel="Save changes"
        defaultValues={{
          title: recipe.title,
          sourceUrl: recipe.sourceUrl ?? "",
          imageUrl: recipe.imageUrl ?? "",
          servings: recipe.servings?.toString() ?? "",
          prepTimeMin: recipe.prepTimeMin?.toString() ?? "",
          cookTimeMin: recipe.cookTimeMin?.toString() ?? "",
          ingredients: asStringArray(recipe.ingredients).join("\n"),
          instructions: asStringArray(recipe.instructions).join("\n"),
        }}
      />

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
