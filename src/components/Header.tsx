import Link from "next/link";
import { headers } from "next/headers";
import { auth, signOut } from "@/auth";
import { detectLocaleFromAcceptLanguage, getTranslations } from "@/lib/i18n";
import AccountMenu from "@/components/AccountMenu";

export default async function Header() {
  const [session, headerList] = await Promise.all([auth(), headers()]);
  const t = getTranslations(detectLocaleFromAcceptLanguage(headerList.get("accept-language")));

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
        <Link href="/" className="truncate text-base font-semibold">
          {t.appName}
        </Link>

        {/* Desktop / wide screens: inline email + auth links */}
        <nav className="hidden items-center gap-4 text-sm sm:flex">
          {session?.user ? (
            <>
              <span className="text-black/60 dark:text-white/60">{session.user.email}</span>
              <form action={handleSignOut}>
                <button type="submit" className="underline underline-offset-2">
                  {t.signOut}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="underline underline-offset-2">
                {t.signIn}
              </Link>
              <Link href="/signup" className="underline underline-offset-2">
                {t.signUp}
              </Link>
            </>
          )}
        </nav>

        {/* Narrow screens: collapse into a three-dot overflow menu */}
        <AccountMenu
          email={session?.user?.email ?? null}
          signInLabel={t.signIn}
          signUpLabel={t.signUp}
          signOutLabel={t.signOut}
          onSignOut={handleSignOut}
        />
      </div>
    </header>
  );
}
