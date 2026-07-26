import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { RecipeForm } from "../../new/RecipeForm";
import { updateRecipe } from "../actions";

export const dynamic = "force-dynamic";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const recipe = await prisma.recipe.findUnique({ where: { id } });

  if (!recipe) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">Edit recipe</h1>
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
    </div>
  );
}
