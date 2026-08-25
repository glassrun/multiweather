import Link from "next/link";
import { headers } from "next/headers";
import { auth, signOut } from "@/auth";
import { detectLocaleFromAcceptLanguage, getTranslations } from "@/lib/i18n";

export default async function Header() {
  const [session, headerList] = await Promise.all([auth(), headers()]);
  const t = getTranslations(detectLocaleFromAcceptLanguage(headerList.get("accept-language")));

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
        <Link href="/" className="text-base font-semibold">
          {t.appName}
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
      </div>
    </header>
  );
}
