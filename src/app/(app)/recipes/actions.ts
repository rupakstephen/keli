"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function linesToArray(value: string | null): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function createRecipe(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const sourceUrl = (formData.get("sourceUrl") as string)?.trim() || null;
  const imageUrl = (formData.get("imageUrl") as string)?.trim() || null;
  const servings = Number(formData.get("servings")) || null;
  const prepTimeMin = Number(formData.get("prepTimeMin")) || null;
  const cookTimeMin = Number(formData.get("cookTimeMin")) || null;
  const ingredients = linesToArray(formData.get("ingredients") as string | null);
  const instructions = linesToArray(formData.get("instructions") as string | null);
  const rawJsonLdRaw = formData.get("rawJsonLd") as string | null;

  const recipe = await prisma.recipe.create({
    data: {
      title,
      sourceUrl,
      imageUrl,
      servings,
      prepTimeMin,
      cookTimeMin,
      ingredients,
      instructions,
      rawJsonLd: rawJsonLdRaw ? JSON.parse(rawJsonLdRaw) : undefined,
      createdById: session.user.id,
    },
  });

  redirect(`/recipes/${recipe.id}`);
}
