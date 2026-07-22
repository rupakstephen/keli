import Link from "next/link";
import { signOut } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/journal">Journal</Link>
          <Link href="/entries/new">Add entry</Link>
          <Link href="/subcategories">Subcategories</Link>
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="text-sm text-zinc-500">
            Log out
          </button>
        </form>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
