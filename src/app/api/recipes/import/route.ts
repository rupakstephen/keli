import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseRecipeHtml } from "@/lib/recipeParser";

// Many recipe sites block requests without a browser-like UA, and some
// hang indefinitely on dead/slow hosts -- both are common enough to guard
// against explicitly rather than let the request hang or 403 silently.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 10_000;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { url } = (await request.json().catch(() => ({}))) as { url?: string };
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  let html: string;
  try {
    const response = await fetch(parsedUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: `Couldn't fetch that page (status ${response.status})` },
        { status: 502 }
      );
    }
    html = await response.text();
  } catch {
    return NextResponse.json({ error: "Couldn't reach that URL" }, { status: 502 });
  }

  const parsed = parseRecipeHtml(html);
  if (!parsed) {
    return NextResponse.json(
      { error: "Couldn't find recipe data on that page -- fill in the form manually instead." },
      { status: 422 }
    );
  }

  return NextResponse.json({ ...parsed, sourceUrl: parsedUrl.toString() });
}
