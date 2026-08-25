import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Weather Consensus", template: "%s · Weather Consensus" },
  description: "The most likely current weather and forecast, aggregated from multiple sources.",
  // Read directly from process.env (not the validated `env` proxy) - this
  // object literal runs at module load, including while `next build` is
  // just tracing pages, when required vars like DATABASE_URL intentionally
  // aren't set yet. A raw, optional read can't throw there.
  ...(process.env.SITE_URL ? { metadataBase: new URL(process.env.SITE_URL) } : {}),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        {children}
      </body>
    </html>
  );
}
