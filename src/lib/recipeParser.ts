import * as cheerio from "cheerio";

export type ParsedRecipe = {
  title: string;
  imageUrl: string | null;
  servings: number | null;
  prepTimeMin: number | null;
  cookTimeMin: number | null;
  ingredients: string[];
  instructions: string[];
  rawJsonLd: unknown | null;
};

// PT1H30M / PT20M / PT45S -> whole minutes. Recipe sites are inconsistent
// about whether short prep times use PT15M or PT0H15M, so all three
// components are parsed and summed rather than assuming a fixed shape.
function parseIsoDurationMinutes(duration: unknown): number | null {
  if (typeof duration !== "string") return null;
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const [, hours, minutes, seconds] = match;
  if (!hours && !minutes && !seconds) return null;
  return (
    (hours ? Number(hours) * 60 : 0) +
    (minutes ? Number(minutes) : 0) +
    (seconds ? Math.round(Number(seconds) / 60) : 0)
  );
}

function parseServings(recipeYield: unknown): number | null {
  const value = Array.isArray(recipeYield) ? recipeYield[0] : recipeYield;
  if (typeof value === "number") return Math.round(value);
  if (typeof value === "string") {
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : null;
  }
  return null;
}

function normalizeImage(image: unknown): string | null {
  if (typeof image === "string") return image;
  if (Array.isArray(image)) return normalizeImage(image[0]);
  if (image && typeof image === "object" && "url" in image) {
    return normalizeImage((image as { url: unknown }).url);
  }
  return null;
}

function normalizeIngredients(ingredients: unknown): string[] {
  if (!Array.isArray(ingredients)) return [];
  return ingredients.filter((i): i is string => typeof i === "string").map((i) => i.trim());
}

// recipeInstructions is the most inconsistent field across sites: plain
// string, string[], HowToStep[], or HowToSection[] (each section nesting
// its own itemListElement of HowToStep). Flatten all shapes to string[].
function normalizeInstructions(instructions: unknown): string[] {
  if (typeof instructions === "string") {
    return instructions
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(instructions)) return [];

  const steps: string[] = [];
  for (const item of instructions) {
    if (typeof item === "string") {
      steps.push(item.trim());
      continue;
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      if (obj["@type"] === "HowToSection" && Array.isArray(obj.itemListElement)) {
        steps.push(...normalizeInstructions(obj.itemListElement));
        continue;
      }
      if (typeof obj.text === "string") {
        steps.push(obj.text.trim());
      }
    }
  }
  return steps.filter(Boolean);
}

// A JSON-LD document is either a single object, or has a top-level @graph
// array of objects -- find the first one whose @type includes "Recipe".
function findRecipeNode(json: unknown): Record<string, unknown> | null {
  const candidates: unknown[] = Array.isArray(json)
    ? json
    : json && typeof json === "object" && Array.isArray((json as { "@graph"?: unknown })["@graph"])
      ? (json as { "@graph": unknown[] })["@graph"]
      : [json];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const type = (candidate as Record<string, unknown>)["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (types.includes("Recipe")) return candidate as Record<string, unknown>;
  }
  return null;
}

function normalizeRecipeNode(node: Record<string, unknown>): ParsedRecipe {
  return {
    title: typeof node.name === "string" ? node.name : "Untitled recipe",
    imageUrl: normalizeImage(node.image),
    servings: parseServings(node.recipeYield),
    prepTimeMin: parseIsoDurationMinutes(node.prepTime),
    cookTimeMin: parseIsoDurationMinutes(node.cookTime),
    ingredients: normalizeIngredients(node.recipeIngredient),
    instructions: normalizeInstructions(node.recipeInstructions),
    rawJsonLd: node,
  };
}

// Fallback when no JSON-LD Recipe is found: a basic microdata pass, plus
// whatever generic <title>/og:image metadata exists so the manual form at
// least isn't starting from a totally blank page.
function parseMicrodataFallback($: cheerio.CheerioAPI): ParsedRecipe | null {
  const root = $('[itemtype*="schema.org/Recipe"]').first();
  if (root.length === 0) return null;

  const text = (selector: string) =>
    root.find(selector).first().attr("content")?.trim() ||
    root.find(selector).first().text().trim() ||
    null;

  const ingredients = root
    .find('[itemprop="recipeIngredient"], [itemprop="ingredients"]')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  const instructions = root
    .find('[itemprop="recipeInstructions"]')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  return {
    title: text('[itemprop="name"]') || $("title").first().text().trim() || "Untitled recipe",
    imageUrl: root.find('[itemprop="image"]').first().attr("src") || null,
    servings: parseServings(text('[itemprop="recipeYield"]')),
    prepTimeMin: parseIsoDurationMinutes(root.find('[itemprop="prepTime"]').attr("datetime")),
    cookTimeMin: parseIsoDurationMinutes(root.find('[itemprop="cookTime"]').attr("datetime")),
    ingredients,
    instructions,
    rawJsonLd: null,
  };
}

export function parseRecipeHtml(html: string): ParsedRecipe | null {
  const $ = cheerio.load(html);

  const jsonLdBlocks = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text())
    .get();

  for (const block of jsonLdBlocks) {
    try {
      const json = JSON.parse(block);
      const node = findRecipeNode(json);
      if (node) return normalizeRecipeNode(node);
    } catch {
      // Malformed JSON-LD block -- skip it, try the next one.
    }
  }

  return parseMicrodataFallback($);
}
