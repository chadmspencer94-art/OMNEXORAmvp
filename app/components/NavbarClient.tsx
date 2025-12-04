"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface NavbarClientProps {
  user: {
    email: string;
  } | null;
}

export default function NavbarClient({ user }: NavbarClientProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const isLoggedIn = !!user;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/jobs", label: "Jobs" },
    { href: "/billing", label: "Billing" },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setLogoutError(data.error || "Logout failed");
        return;
      }

      router.push("/");
    } catch {
      setLogoutError("An unexpected error occurred");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-white tracking-tight">
              OMNEXORA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
            <div className="ml-4 pl-4 border-l border-slate-700 flex items-center space-x-3">
              {logoutError && (
                <span className="text-red-400 text-xs">{logoutError}</span>
              )}
              {isLoggedIn ? (
                <>
                  <span className="text-slate-400 text-sm truncate max-w-[150px]">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isLoggingOut ? "..." : "Logout"}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg transition-colors text-sm font-semibold"
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-700">
              {logoutError && (
                <p className="px-4 py-2 text-red-400 text-sm">{logoutError}</p>
              )}
              {isLoggedIn ? (
                <>
                  <p className="px-4 py-2 text-slate-400 text-sm truncate">
                    {user.email}
                  </p>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg transition-colors text-sm font-semibold text-center"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

