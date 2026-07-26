"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

// Only title/notes/experiencedAt/recipeId are editable here -- changing
// domain or subcategory would change which list the entry is
// scoped/ranked within, which needs a re-comparison flow, not a plain edit
// (out of scope for M3).
export async function updateEntry(formData: FormData) {
  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim() || null;
  const experiencedAt = formData.get("experiencedAt") as string;
  const recipeId = (formData.get("recipeId") as string)?.trim() || null;

  if (!id || !title || !experiencedAt) return;

  await prisma.entry.update({
    where: { id },
    data: { title, notes, experiencedAt: new Date(experiencedAt), recipeId },
  });

  redirect(`/entries/${id}`);
}
