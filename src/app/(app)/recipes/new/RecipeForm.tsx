"use client";

import { useState } from "react";
import { Field } from "@/components/Field";

type ParsedRecipe = {
  title: string;
  imageUrl: string | null;
  servings: number | null;
  prepTimeMin: number | null;
  cookTimeMin: number | null;
  ingredients: string[];
  instructions: string[];
  rawJsonLd: unknown | null;
  sourceUrl?: string;
};

export type RecipeFormValues = {
  title: string;
  sourceUrl: string;
  imageUrl: string;
  servings: string;
  prepTimeMin: string;
  cookTimeMin: string;
  ingredients: string;
  instructions: string;
};

const EMPTY_VALUES: RecipeFormValues = {
  title: "",
  sourceUrl: "",
  imageUrl: "",
  servings: "",
  prepTimeMin: "",
  cookTimeMin: "",
  ingredients: "",
  instructions: "",
};

export function RecipeForm({
  action,
  id,
  defaultValues,
  showImport = false,
  submitLabel = "Save recipe",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id?: string;
  defaultValues?: Partial<RecipeFormValues>;
  showImport?: boolean;
  submitLabel?: string;
}) {
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [fields, setFields] = useState<RecipeFormValues>({ ...EMPTY_VALUES, ...defaultValues });
  const [rawJsonLd, setRawJsonLd] = useState<string | null>(null);

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError(null);
    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "Import failed -- fill in the form manually instead.");
        return;
      }
      const parsed = data as ParsedRecipe;
      setFields({
        title: parsed.title ?? "",
        sourceUrl: parsed.sourceUrl ?? importUrl.trim(),
        imageUrl: parsed.imageUrl ?? "",
        servings: parsed.servings?.toString() ?? "",
        prepTimeMin: parsed.prepTimeMin?.toString() ?? "",
        cookTimeMin: parsed.cookTimeMin?.toString() ?? "",
        ingredients: parsed.ingredients?.join("\n") ?? "",
        instructions: parsed.instructions?.join("\n") ?? "",
      });
      setRawJsonLd(parsed.rawJsonLd ? JSON.stringify(parsed.rawJsonLd) : null);
    } catch {
      setImportError("Couldn't reach that URL -- fill in the form manually instead.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {showImport && (
        <div className="space-y-2 rounded border p-3">
          <Field label="Import from a URL" htmlFor="importUrl">
            <div className="flex gap-2">
              <input
                id="importUrl"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://example.com/recipe"
                className="flex-1 rounded border px-2 py-1"
              />
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || !importUrl.trim()}
                className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </Field>
          {importError && <p className="text-sm text-red-600">{importError}</p>}
        </div>
      )}

      {fields.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable source hosts
        <img src={fields.imageUrl} alt="" className="w-full rounded" />
      )}

      <form action={action} className="space-y-3">
        {id && <input type="hidden" name="id" value={id} />}
        <input type="hidden" name="rawJsonLd" value={rawJsonLd ?? ""} />

        <Field label="Title" htmlFor="title">
          <input
            id="title"
            name="title"
            required
            value={fields.title}
            onChange={(e) => setFields({ ...fields, title: e.target.value })}
            className="w-full rounded border px-2 py-1"
          />
        </Field>
        <Field label="Source URL" htmlFor="sourceUrl" hint="leave blank for your own recipe">
          <input
            id="sourceUrl"
            name="sourceUrl"
            value={fields.sourceUrl}
            onChange={(e) => setFields({ ...fields, sourceUrl: e.target.value })}
            className="w-full rounded border px-2 py-1"
          />
        </Field>
        <Field label="Image URL" htmlFor="imageUrl">
          <input
            id="imageUrl"
            name="imageUrl"
            value={fields.imageUrl}
            onChange={(e) => setFields({ ...fields, imageUrl: e.target.value })}
            className="w-full rounded border px-2 py-1"
          />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Servings" htmlFor="servings">
            <input
              id="servings"
              name="servings"
              type="number"
              min="0"
              value={fields.servings}
              onChange={(e) => setFields({ ...fields, servings: e.target.value })}
              className="w-full rounded border px-2 py-1"
            />
          </Field>
          <Field label="Prep (min)" htmlFor="prepTimeMin">
            <input
              id="prepTimeMin"
              name="prepTimeMin"
              type="number"
              min="0"
              value={fields.prepTimeMin}
              onChange={(e) => setFields({ ...fields, prepTimeMin: e.target.value })}
              className="w-full rounded border px-2 py-1"
            />
          </Field>
          <Field label="Cook (min)" htmlFor="cookTimeMin">
            <input
              id="cookTimeMin"
              name="cookTimeMin"
              type="number"
              min="0"
              value={fields.cookTimeMin}
              onChange={(e) => setFields({ ...fields, cookTimeMin: e.target.value })}
              className="w-full rounded border px-2 py-1"
            />
          </Field>
        </div>
        <Field label="Ingredients" htmlFor="ingredients" hint="one per line">
          <textarea
            id="ingredients"
            name="ingredients"
            rows={6}
            value={fields.ingredients}
            onChange={(e) => setFields({ ...fields, ingredients: e.target.value })}
            className="w-full rounded border px-2 py-1"
          />
        </Field>
        <Field label="Instructions" htmlFor="instructions" hint="one step per line">
          <textarea
            id="instructions"
            name="instructions"
            rows={8}
            value={fields.instructions}
            onChange={(e) => setFields({ ...fields, instructions: e.target.value })}
            className="w-full rounded border px-2 py-1"
          />
        </Field>
        <button type="submit" className="rounded bg-black px-3 py-1 text-white">
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
