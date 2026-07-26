import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateEntry } from "./actions";

export const dynamic = "force-dynamic";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const entry = await prisma.entry.findUnique({
    where: { id },
    include: { subcategory: true, createdBy: true, recipe: true },
  });

  if (!entry) notFound();

  const siblings = await prisma.entry.findMany({
    where: { subcategoryId: entry.subcategoryId },
    orderBy: { rankPosition: "asc" },
    select: { id: true },
  });
  const position = siblings.findIndex((e) => e.id === entry.id) + 1;

  const recipes =
    entry.domain === "MEAL"
      ? await prisma.recipe.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } })
      : [];

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="text-sm text-zinc-500">
        <Link href={`/rank/${entry.subcategoryId}`} className="underline">
          {entry.subcategory.domain} &middot; {entry.subcategory.label}
        </Link>
        {" -- "}#{position} of {siblings.length}
      </div>

      <form action={updateEntry} className="space-y-3">
        <input type="hidden" name="id" value={entry.id} />
        <input
          name="title"
          defaultValue={entry.title}
          required
          className="w-full rounded border px-2 py-1 font-medium"
        />
        <input
          name="experiencedAt"
          type="date"
          defaultValue={entry.experiencedAt.toISOString().slice(0, 10)}
          required
          className="w-full rounded border px-2 py-1"
        />
        <textarea
          name="notes"
          defaultValue={entry.notes ?? ""}
          placeholder="Notes"
          className="w-full rounded border px-2 py-1"
        />
        {entry.domain === "MEAL" && recipes.length > 0 && (
          <select
            name="recipeId"
            defaultValue={entry.recipeId ?? ""}
            className="w-full rounded border px-2 py-1"
          >
            <option value="">No recipe linked</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        )}
        {entry.recipe && (
          <p className="text-sm">
            Recipe:{" "}
            <Link href={`/recipes/${entry.recipe.id}`} className="underline">
              {entry.recipe.title}
            </Link>
          </p>
        )}
        <p className="text-xs text-zinc-400">Added by {entry.createdBy.name}</p>
        <button type="submit" className="rounded bg-black px-3 py-1 text-white">
          Save
        </button>
      </form>
    </div>
  );
}
