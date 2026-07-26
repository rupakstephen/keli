import Link from "next/link";
import { signOut } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/journal", label: "Journal", icon: "📓" },
  { href: "/entries/new", label: "Add", icon: "➕" },
  { href: "/subcategories", label: "Lists", icon: "📋" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <nav className="hidden gap-4 text-sm font-medium sm:flex">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <span className="text-sm font-semibold sm:hidden">keli</span>
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

      <main className="flex-1 p-4 pb-20 sm:pb-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t bg-background sm:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs text-zinc-600"
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
