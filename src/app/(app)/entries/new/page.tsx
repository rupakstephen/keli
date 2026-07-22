import { prisma } from "@/lib/db";
import { EntryForm } from "./EntryForm";

// Same reasoning as subcategories/page.tsx: the subcategory list must be
// fresh on every request, not baked in at build time.
export const dynamic = "force-dynamic";

export default async function NewEntryPage() {
  const subcategories = await prisma.subcategory.findMany({
    orderBy: [{ domain: "asc" }, { label: "asc" }],
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-lg font-semibold">Add entry</h1>
      <EntryForm subcategories={subcategories} />
    </div>
  );
}
