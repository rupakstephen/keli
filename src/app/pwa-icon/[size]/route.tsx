import { ImageResponse } from "next/og";

// Generated rather than checked in as binaries: a "k" on the app's dark
// theme colour. The glyph stays inside the central 60% so the same image is
// safe as a maskable icon. Sizes: 180 (iOS), 192 and 512 (manifest).
const SIZES = [180, 192, 512];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const size = Number((await params).size);
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#18181b",
          color: "#ffffff",
          fontSize: size * 0.6,
          fontWeight: 700,
        }}
      >
        k
      </div>
    ),
    { width: size, height: size },
  );
}
