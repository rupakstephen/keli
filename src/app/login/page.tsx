import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Field } from "@/components/Field";

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=invalid");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form action={login} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">keli</h1>
        {error && <p className="text-sm text-red-600">Wrong email or password.</p>}
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded border px-3 py-2"
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded border px-3 py-2"
          />
        </Field>
        <button type="submit" className="w-full rounded bg-black px-3 py-2 text-white">
          Log in
        </button>
      </form>
    </main>
  );
}
