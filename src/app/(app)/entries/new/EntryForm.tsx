"use client";

import { useMemo, useState } from "react";
import { createEntry } from "../actions";

type Subcategory = { id: string; domain: string; label: string };

const DOMAINS = ["MEAL", "MOVIE", "GAME", "TRAVEL"] as const;

export function EntryForm({ subcategories }: { subcategories: Subcategory[] }) {
  const [domain, setDomain] = useState<string>(DOMAINS[0]);

  const options = useMemo(
    () => subcategories.filter((s) => s.domain === domain),
    [subcategories, domain]
  );

  return (
    <form action={createEntry} className="space-y-3">
      <select
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

      <select name="subcategoryId" required className="w-full rounded border px-2 py-1">
        {options.length === 0 && (
          <option value="">No subcategories yet -- add one first</option>
        )}
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      <input
        name="title"
        placeholder="Title"
        required
        className="w-full rounded border px-2 py-1"
      />

      <input
        name="experiencedAt"
        type="date"
        required
        defaultValue={new Date().toISOString().slice(0, 10)}
        className="w-full rounded border px-2 py-1"
      />

      <textarea name="notes" placeholder="Notes" className="w-full rounded border px-2 py-1" />

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
