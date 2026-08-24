import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`);
    }
    throw err;
  }
}

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <form action={login} className="flex flex-col gap-4">
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Password"
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <button type="submit" className="rounded bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700">
          Sign in
        </button>
      </form>
      <p className="mt-4 text-sm text-black/60 dark:text-white/60">
        No account?{" "}
        <Link href="/signup" className="underline underline-offset-2">
          Sign up
        </Link>
      </p>
    </main>
  );
}
