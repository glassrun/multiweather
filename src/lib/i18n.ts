export type Locale = "en" | "el";

export interface Translations {
  appName: string;
  tagline: string;
  searchPlaceholder: string;
  searching: string;
  loadingWeather: string;
  saveLocation: string;
  saved: string;
  saving: string;
  signIn: string;
  signUp: string;
  signOut: string;
  feelsLike: string;
  humidity: string;
  wind: string;
  precipChance: string;
  forecast7day: string;
  rain: string;
  source: string;
  temp: string;
  condition: string;
  conditionUnavailable: string;
  cached: string;
  showBreakdown: (n: number) => string;
  hideBreakdown: (n: number) => string;
  sourceAgreement: (pct: number) => string;
  fromSources: (n: number) => string;
  removeLocation: (label: string) => string;
  email: string;
  password: string;
  passwordMinChars: string;
  nameOptional: string;
  createAccount: string;
  noAccount: string;
  alreadyHaveAccount: string;
  invalidCredentials: string;
  checkDetails: string;
  emailAlreadyRegistered: string;
}

export const translations: Record<Locale, Translations> = {
  en: {
    appName: "Weather Consensus",
    tagline: "The most likely current weather and forecast, aggregated across multiple sources.",
    searchPlaceholder: "Search for a city...",
    searching: "Searching…",
    loadingWeather: "Loading weather…",
    saveLocation: "Save location",
    saved: "Saved",
    saving: "Saving…",
    signIn: "Sign in",
    signUp: "Sign up",
    signOut: "Sign out",
    feelsLike: "Feels like",
    humidity: "Humidity",
    wind: "Wind",
    precipChance: "Precip. chance",
    forecast7day: "7-day forecast",
    rain: "rain",
    source: "Source",
    temp: "Temp",
    condition: "Condition",
    conditionUnavailable: "Condition unavailable",
    cached: "cached",
    showBreakdown: (n: number) => `Show per-source breakdown (${n})`,
    hideBreakdown: (n: number) => `Hide per-source breakdown (${n})`,
    sourceAgreement: (pct: number) => `${pct}% source agreement`,
    fromSources: (n: number) => `from ${n} source${n === 1 ? "" : "s"}`,
    removeLocation: (label: string) => `Remove ${label}`,
    email: "Email",
    password: "Password",
    passwordMinChars: "Password (min 8 characters)",
    nameOptional: "Name (optional)",
    createAccount: "Create an account",
    noAccount: "No account?",
    alreadyHaveAccount: "Already have an account?",
    invalidCredentials: "Invalid email or password",
    checkDetails: "Please check your details and try again",
    emailAlreadyRegistered: "An account with this email already exists",
  },
  el: {
    appName: "Συναίνεση Καιρού",
    tagline: "Ο πιο πιθανός τρέχων καιρός και πρόγνωση, από πολλαπλές πηγές.",
    searchPlaceholder: "Αναζήτηση πόλης...",
    searching: "Αναζήτηση…",
    loadingWeather: "Φόρτωση καιρού…",
    saveLocation: "Αποθήκευση τοποθεσίας",
    saved: "Αποθηκεύτηκε",
    saving: "Αποθήκευση…",
    signIn: "Σύνδεση",
    signUp: "Εγγραφή",
    signOut: "Αποσύνδεση",
    feelsLike: "Αίσθηση",
    humidity: "Υγρασία",
    wind: "Άνεμος",
    precipChance: "Πιθ. βροχής",
    forecast7day: "Πρόγνωση 7 ημερών",
    rain: "βροχή",
    source: "Πηγή",
    temp: "Θερμ.",
    condition: "Συνθήκη",
    conditionUnavailable: "Μη διαθέσιμη συνθήκη",
    cached: "από cache",
    showBreakdown: (n: number) => `Εμφάνιση ανάλυσης πηγών (${n})`,
    hideBreakdown: (n: number) => `Απόκρυψη ανάλυσης πηγών (${n})`,
    sourceAgreement: (pct: number) => `${pct}% συμφωνία πηγών`,
    fromSources: (n: number) => (n === 1 ? "από 1 πηγή" : `από ${n} πηγές`),
    removeLocation: (label: string) => `Αφαίρεση ${label}`,
    email: "Email",
    password: "Κωδικός",
    passwordMinChars: "Κωδικός (τουλάχιστον 8 χαρακτήρες)",
    nameOptional: "Όνομα (προαιρετικό)",
    createAccount: "Δημιουργία λογαριασμού",
    noAccount: "Δεν έχετε λογαριασμό;",
    alreadyHaveAccount: "Έχετε ήδη λογαριασμό;",
    invalidCredentials: "Λανθασμένο email ή κωδικός",
    checkDetails: "Ελέγξτε τα στοιχεία σας και δοκιμάστε ξανά",
    emailAlreadyRegistered: "Υπάρχει ήδη λογαριασμός με αυτό το email",
  },
};

export function detectLocaleFromAcceptLanguage(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return "en";
  // Accept-Language is a comma-separated, q-weighted list, e.g. "el-GR,el;q=0.9,en;q=0.8".
  // We only support en/el right now, so just check whether Greek appears at all.
  return /\bel\b/i.test(acceptLanguage) ? "el" : "en";
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}
