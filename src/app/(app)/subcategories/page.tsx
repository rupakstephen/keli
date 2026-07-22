import Link from "next/link";
import { prisma } from "@/lib/db";
import { Domain } from "@/generated/prisma/client";
import { createSubcategory } from "./actions";

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

      <form action={createSubcategory} className="flex gap-2">
        <select name="domain" required className="rounded border px-2 py-1">
          {DOMAINS.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
        <input
          name="label"
          placeholder="e.g. Horror, Indian, Beach"
          required
          className="flex-1 rounded border px-2 py-1"
        />
        <button type="submit" className="rounded bg-black px-3 py-1 text-white">
          Add
        </button>
      </form>

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
