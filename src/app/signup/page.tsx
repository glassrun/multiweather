import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { createUser, signupSchema, EmailAlreadyRegisteredError } from "@/lib/users";
import { detectLocaleFromAcceptLanguage, getTranslations } from "@/lib/i18n";

async function signup(formData: FormData) {
  "use server";
  const t = getTranslations(detectLocaleFromAcceptLanguage((await headers()).get("accept-language")));

  const parsed = signupSchema.safeParse({
    name: formData.get("name") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(`/signup?error=${encodeURIComponent(t.checkDetails)}`);
  }

  try {
    await createUser(parsed.data);
  } catch (err) {
    if (err instanceof EmailAlreadyRegisteredError) {
      redirect(`/signup?error=${encodeURIComponent(t.emailAlreadyRegistered)}`);
    }
    throw err;
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/login");
    }
    throw err;
  }
}

export default async function SignupPage(props: PageProps<"/signup">) {
  const [searchParams, headerList] = await Promise.all([props.searchParams, headers()]);
  const t = getTranslations(detectLocaleFromAcceptLanguage(headerList.get("accept-language")));
  const error = typeof searchParams.error === "string" ? searchParams.error : null;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">{t.createAccount}</h1>
      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <form action={signup} className="flex flex-col gap-4">
        <input
          name="name"
          type="text"
          placeholder={t.nameOptional}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <input
          name="email"
          type="email"
          required
          placeholder={t.email}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder={t.passwordMinChars}
          className="rounded border border-black/15 px-3 py-2 dark:border-white/20"
        />
        <button type="submit" className="rounded bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700">
          {t.signUp}
        </button>
      </form>
      <p className="mt-4 text-sm text-black/60 dark:text-white/60">
        {t.alreadyHaveAccount}{" "}
        <Link href="/login" className="underline underline-offset-2">
          {t.signIn}
        </Link>
      </p>
    </main>
  );
}
