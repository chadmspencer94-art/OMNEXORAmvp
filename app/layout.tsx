import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Root layout uses Navbar which calls getCurrentUser() (uses cookies())
// This makes all pages dynamic, which is necessary for authenticated routes
// Public pages (/, /login, /register) can still be cached by Next.js even if marked dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "OMNEXORA - AI Job Packs for Tradies",
  description: "Generate AI-powered job packs for Australian tradies to cut admin and win back time for what most matters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
