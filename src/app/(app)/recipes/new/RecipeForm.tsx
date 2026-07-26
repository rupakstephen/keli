"use client";

import { useState } from "react";
import { createRecipe } from "../actions";

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

export function RecipeForm() {
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [fields, setFields] = useState({
    title: "",
    sourceUrl: "",
    imageUrl: "",
    servings: "",
    prepTimeMin: "",
    cookTimeMin: "",
    ingredients: "",
    instructions: "",
  });
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
      <div className="space-y-2 rounded border p-3">
        <label className="text-sm font-medium">Import from a URL</label>
        <div className="flex gap-2">
          <input
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
        {importError && <p className="text-sm text-red-600">{importError}</p>}
      </div>

      <form action={createRecipe} className="space-y-3">
        <input type="hidden" name="rawJsonLd" value={rawJsonLd ?? ""} />

        <input
          name="title"
          placeholder="Title"
          required
          value={fields.title}
          onChange={(e) => setFields({ ...fields, title: e.target.value })}
          className="w-full rounded border px-2 py-1"
        />
        <input
          name="sourceUrl"
          placeholder="Source URL (leave blank for your own recipe)"
          value={fields.sourceUrl}
          onChange={(e) => setFields({ ...fields, sourceUrl: e.target.value })}
          className="w-full rounded border px-2 py-1"
        />
        <input
          name="imageUrl"
          placeholder="Image URL"
          value={fields.imageUrl}
          onChange={(e) => setFields({ ...fields, imageUrl: e.target.value })}
          className="w-full rounded border px-2 py-1"
        />
        <div className="grid grid-cols-3 gap-2">
          <input
            name="servings"
            type="number"
            min="0"
            placeholder="Servings"
            value={fields.servings}
            onChange={(e) => setFields({ ...fields, servings: e.target.value })}
            className="w-full rounded border px-2 py-1"
          />
          <input
            name="prepTimeMin"
            type="number"
            min="0"
            placeholder="Prep (min)"
            value={fields.prepTimeMin}
            onChange={(e) => setFields({ ...fields, prepTimeMin: e.target.value })}
            className="w-full rounded border px-2 py-1"
          />
          <input
            name="cookTimeMin"
            type="number"
            min="0"
            placeholder="Cook (min)"
            value={fields.cookTimeMin}
            onChange={(e) => setFields({ ...fields, cookTimeMin: e.target.value })}
            className="w-full rounded border px-2 py-1"
          />
        </div>
        <textarea
          name="ingredients"
          placeholder="Ingredients, one per line"
          rows={6}
          value={fields.ingredients}
          onChange={(e) => setFields({ ...fields, ingredients: e.target.value })}
          className="w-full rounded border px-2 py-1"
        />
        <textarea
          name="instructions"
          placeholder="Instructions, one step per line"
          rows={8}
          value={fields.instructions}
          onChange={(e) => setFields({ ...fields, instructions: e.target.value })}
          className="w-full rounded border px-2 py-1"
        />
        <button type="submit" className="rounded bg-black px-3 py-1 text-white">
          Save recipe
        </button>
      </form>
    </div>
  );
}
