import { prisma } from "@/lib/db";
import { EntryForm } from "./EntryForm";

// Same reasoning as subcategories/page.tsx: the subcategory list must be
// fresh on every request, not baked in at build time.
export const dynamic = "force-dynamic";

export default async function NewEntryPage() {
  const [subcategories, recipes] = await Promise.all([
    prisma.subcategory.findMany({
      orderBy: [{ domain: "asc" }, { label: "asc" }],
    }),
    prisma.recipe.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-lg font-semibold">Add entry</h1>
      <EntryForm subcategories={subcategories} recipes={recipes} />
    </div>
  );
}
