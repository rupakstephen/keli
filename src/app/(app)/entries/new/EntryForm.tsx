"use client";

import { useMemo, useState } from "react";
import { createEntry } from "../actions";
import { Field } from "@/components/Field";

type Subcategory = { id: string; domain: string; label: string };
type Recipe = { id: string; title: string };

const DOMAINS = ["MEAL", "MOVIE", "GAME", "TRAVEL"] as const;

export function EntryForm({
  subcategories,
  recipes,
}: {
  subcategories: Subcategory[];
  recipes: Recipe[];
}) {
  const [domain, setDomain] = useState<string>(DOMAINS[0]);

  const options = useMemo(
    () => subcategories.filter((s) => s.domain === domain),
    [subcategories, domain]
  );

  return (
    <form action={createEntry} className="space-y-3">
      <Field label="Domain" htmlFor="domain">
        <select
          id="domain"
          name="domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full rounded border px-2 py-1"
        >
          {DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Subcategory" htmlFor="subcategoryId">
        <select id="subcategoryId" name="subcategoryId" required className="w-full rounded border px-2 py-1">
          {options.length === 0 && (
            <option value="">No subcategories yet -- add one first</option>
          )}
          {options.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Title" htmlFor="title">
        <input id="title" name="title" required className="w-full rounded border px-2 py-1" />
      </Field>

      <Field label="Date" htmlFor="experiencedAt">
        <input
          id="experiencedAt"
          name="experiencedAt"
          type="date"
          required
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="w-full rounded border px-2 py-1"
        />
      </Field>

      <Field label="Notes" htmlFor="notes">
        <textarea id="notes" name="notes" className="w-full rounded border px-2 py-1" />
      </Field>

      {domain === "MEAL" && recipes.length > 0 && (
        <Field label="Recipe" htmlFor="recipeId" hint="optional">
          <select id="recipeId" name="recipeId" defaultValue="" className="w-full rounded border px-2 py-1">
            <option value="">No recipe linked</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </Field>
      )}

      <button
        type="submit"
        disabled={options.length === 0}
        className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
      >
        Save
      </button>
    </form>
  );
}
