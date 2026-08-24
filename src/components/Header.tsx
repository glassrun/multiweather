import Link from "next/link";
import { auth, signOut } from "@/auth";

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Weather Consensus
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {session?.user ? (
            <>
              <span className="text-black/60 dark:text-white/60">{session.user.email}</span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="underline underline-offset-2">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="underline underline-offset-2">
                Sign in
              </Link>
              <Link href="/signup" className="underline underline-offset-2">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
