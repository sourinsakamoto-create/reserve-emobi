import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "トゥクトゥク予約",
  description: "トゥクトゥクアクティビティのオンライン予約サイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="bg-emerald-800 text-white">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-wide">
              🛺 トゥクトゥク予約
            </Link>
            <nav className="text-sm flex gap-4">
              <Link href="/" className="hover:underline">
                アクティビティ一覧
              </Link>
              <Link href="/admin" className="hover:underline opacity-80">
                管理画面
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full">{children}</main>
        <footer className="text-center text-xs text-neutral-500 py-6">
          © {new Date().getFullYear()} トゥクトゥク予約
        </footer>
      </body>
    </html>
  );
}
