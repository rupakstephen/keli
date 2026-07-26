"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { linesToArray } from "@/lib/linesToArray";

// rawJsonLd is deliberately left untouched here -- it's the original
// scraped block, kept for reprocessing if normalization logic changes
// later, not something a manual edit should overwrite.
export async function updateRecipe(formData: FormData) {
  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  if (!id || !title) return;

  const sourceUrl = (formData.get("sourceUrl") as string)?.trim() || null;
  const imageUrl = (formData.get("imageUrl") as string)?.trim() || null;
  const servings = Number(formData.get("servings")) || null;
  const prepTimeMin = Number(formData.get("prepTimeMin")) || null;
  const cookTimeMin = Number(formData.get("cookTimeMin")) || null;
  const ingredients = linesToArray(formData.get("ingredients") as string | null);
  const instructions = linesToArray(formData.get("instructions") as string | null);

  await prisma.recipe.update({
    where: { id },
    data: {
      title,
      sourceUrl,
      imageUrl,
      servings,
      prepTimeMin,
      cookTimeMin,
      ingredients,
      instructions,
    },
  });

  redirect(`/recipes/${id}`);
}
