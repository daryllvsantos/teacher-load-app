import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Teacher Load Management",
  description: "Manage teacher subject loads and shifts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[var(--background)] text-[var(--text-primary)] antialiased`}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--surface)] px-6 py-4 shadow-sm ring-1 ring-[var(--border)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Teacher Load Management
              </p>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                Subject & Shift Scheduler
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <nav className="flex flex-wrap gap-3 text-sm font-medium">
                <Link
                  className="rounded-full border border-transparent bg-[var(--surface-muted)] px-4 py-2 text-[var(--text-primary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  href="/"
                >
                  Dashboard
                </Link>
                <Link
                  className="rounded-full border border-transparent bg-[var(--surface-muted)] px-4 py-2 text-[var(--text-primary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  href="/teachers"
                >
                  Teachers
                </Link>
                <Link
                  className="rounded-full border border-transparent bg-[var(--surface-muted)] px-4 py-2 text-[var(--text-primary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  href="/subjects"
                >
                  Subjects
                </Link>
                <Link
                  className="rounded-full border border-transparent bg-[var(--surface-muted)] px-4 py-2 text-[var(--text-primary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  href="/loads"
                >
                  Loads
                </Link>
              </nav>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 py-8">{children}</main>
          <footer className="mt-auto text-xs text-[var(--text-muted)]">
            Morning shift: 6:00 AM - 12:00 NN • Afternoon shift: 1:00 PM - 7:00 PM
          </footer>
        </div>
      </body>
    </html>
  );
}
