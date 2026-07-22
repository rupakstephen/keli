import { auth, signOut } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">keli</h1>
      <p>Logged in as {session?.user?.name ?? session?.user?.email}.</p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button type="submit" className="rounded border px-3 py-2">
          Log out
        </button>
      </form>
    </main>
  );
}
