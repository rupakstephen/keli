import Link from "next/link";
import { prisma } from "@/lib/db";
import { Domain } from "@/generated/prisma/client";
import { createSubcategory } from "./actions";
import { Field } from "@/components/Field";

// Otherwise Next prerenders this at build time and bakes in whatever
// subcategories existed then -- newly added ones wouldn't show until redeploy.
export const dynamic = "force-dynamic";

const DOMAINS: Domain[] = ["MEAL", "MOVIE", "GAME", "TRAVEL"];

export default async function SubcategoriesPage() {
  const subcategories = await prisma.subcategory.findMany({
    orderBy: [{ domain: "asc" }, { label: "asc" }],
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-lg font-semibold">Subcategories</h1>

      <form action={createSubcategory} className="flex items-end gap-2">
        <Field label="Domain" htmlFor="domain">
          <select id="domain" name="domain" required className="rounded border px-2 py-1">
            {DOMAINS.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Name" htmlFor="label" hint="e.g. Horror, Indian, Beach" className="flex-1">
          <input
            id="label"
            name="label"
            required
            className="w-full rounded border px-2 py-1"
          />
        </Field>
        <button type="submit" className="rounded bg-black px-3 py-1 text-white">
          Add
        </button>
      </form>

      {subcategories.length === 0 && (
        <p className="text-zinc-500">No subcategories yet -- add one above to get started.</p>
      )}

      {DOMAINS.map((domain) => {
        const inDomain = subcategories.filter((s) => s.domain === domain);
        if (inDomain.length === 0) return null;
        return (
          <div key={domain}>
            <h2 className="text-sm font-medium text-zinc-500">{domain}</h2>
            <ul className="list-disc pl-5">
              {inDomain.map((s) => (
                <li key={s.id}>
                  <Link href={`/rank/${s.id}`} className="underline">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
