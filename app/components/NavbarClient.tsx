"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type UserRole = "tradie" | "builder" | "client" | "supplier" | "admin";
// Support both new and legacy verification statuses for backwards compatibility
type VerificationStatus = "unverified" | "pending" | "verified" | "pending_review" | "rejected";

interface NavbarClientProps {
  user: {
    email: string;
    role: UserRole;
    verificationStatus: VerificationStatus;
    verifiedAt: string | null;
    isAdmin: boolean;
  } | null;
}

function VerificationBadge({ role, status }: { role: UserRole; status: VerificationStatus }) {
  if (role === "tradie") {
    if (status === "verified") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-300">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Verified
        </span>
      );
    }
    if (status === "pending" || status === "pending_review") {
      return (
        <Link
          href="/settings/verification"
          className="inline-flex items-center gap-1 px-2 py-1 bg-amber-900/50 text-amber-400 hover:text-amber-300 text-xs font-medium rounded-full transition-colors"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Verification Pending
        </Link>
      );
    }
    // Handle legacy "rejected" status - show as unverified
    if (status === "rejected") {
      return (
        <Link
          href="/settings/verification"
          className="inline-flex items-center gap-1 px-2 py-1 bg-red-900/50 text-red-400 hover:text-red-300 text-xs font-medium rounded-full transition-colors"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Verification Rejected
        </Link>
      );
    }
    // status === "unverified"
    return (
      <Link
        href="/settings/verification"
        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-400 hover:text-slate-300 text-xs font-medium rounded-full transition-colors"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Not Verified
      </Link>
    );
  }
  
  // Client badge
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-300">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Verified
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-900/50 text-red-400 text-xs font-medium rounded-full">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        Rejected
      </span>
    );
  }
  // status === "unverified" or "pending"/"pending_review" for client
  // Also handle legacy "rejected" as unverified
  const statusStr = status as string;
  if (statusStr === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-400 text-xs font-medium rounded-full">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Not Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-400 text-xs font-medium rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      Not Verified
    </span>
  );
}

export default function NavbarClient({ user: initialUser }: NavbarClientProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [user, setUser] = useState<NavbarClientProps["user"]>(initialUser);

  // Check auth immediately on mount and whenever route changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { 
          cache: "no-store",
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser({
              email: data.user.email,
              role: data.user.role || "tradie",
              verificationStatus: data.user.verificationStatus || "unverified",
              verifiedAt: data.user.verifiedAt ?? null,
              isAdmin: data.user.isAdmin ?? false,
            });
          } else {
            // No user in response - definitely logged out
            setUser(null);
          }
        } else {
          // Not authenticated (401/403)
          setUser(null);
        }
      } catch (error) {
        // If check fails, assume logged out for safety
        console.error("Auth check failed:", error);
        setUser(null);
      }
    };

    // Check auth on mount
    checkAuth();
    
    // Also refresh when window gets focus (user might have logged in/out in another tab)
    const handleFocus = () => {
      checkAuth();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Sync with server prop when it changes (from router.refresh() or navigation)
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // Close mobile menu when user logs out
  useEffect(() => {
    if (!user && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [user, mobileMenuOpen]);

  const isLoggedIn = !!user;
  const isClient = user?.role === "client";

  // Role-aware navigation links
  const navLinks = isClient
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/jobs", label: "Jobs" },
        { href: "/settings", label: "Settings" },
      ]
    : [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/jobs", label: "Jobs" },
        { href: "/billing", label: "Billing" },
        { href: "/settings", label: "Settings" },
      ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    // Immediately clear user state and close mobile menu for instant UI update
    setUser(null);
    setMobileMenuOpen(false);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setLogoutError(data.error || "Logout failed");
        setIsLoggingOut(false);
        // Re-check auth to restore correct state if logout failed
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });
        if (authResponse.ok) {
          const authData = await authResponse.json();
          if (authData.user) {
            setUser({
              email: authData.user.email,
              role: authData.user.role || "tradie",
              verificationStatus: authData.user.verificationStatus || "unverified",
              verifiedAt: authData.user.verifiedAt ?? null,
              isAdmin: authData.user.isAdmin ?? false,
            });
          }
        }
        return;
      }

      // Clear session cookie is handled by server
      // Ensure user state is cleared and menu is closed
      setUser(null);
      setMobileMenuOpen(false);
      // Redirect to login and refresh to update navbar state
      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("An unexpected error occurred");
      setIsLoggingOut(false);
      // Ensure user state is cleared and menu is closed even on error
      setUser(null);
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => {
              router.push(isLoggedIn ? "/dashboard" : "/");
            }}
            className="flex items-center text-2xl font-bold text-white tracking-tight hover:opacity-80 transition-opacity"
          >
            OMNEXORA
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {isLoggedIn && navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
            <div className={`ml-4 ${isLoggedIn ? "pl-4 border-l border-slate-700" : ""} flex items-center space-x-3`}>
              {logoutError && (
                <span className="text-red-400 text-xs">{logoutError}</span>
              )}
              {isLoggedIn ? (
                <>
                  <VerificationBadge role={user.role} status={user.verificationStatus} />
                  {user.isAdmin && (
                    <Link
                      href="/admin/users"
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-xs font-medium"
                    >
                      Admin
                    </Link>
                  )}
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
            {isLoggedIn && navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push(link.href);
                }}
                className="w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium"
              >
                {link.label}
              </button>
            ))}
            <div className={`${isLoggedIn ? "pt-3 mt-3 border-t border-slate-700" : ""}`}>
              {logoutError && (
                <p className="px-4 py-2 text-red-400 text-sm">{logoutError}</p>
              )}
              {isLoggedIn ? (
                <>
                  <div className="px-4 py-2" onClick={() => setMobileMenuOpen(false)}>
                    <VerificationBadge role={user.role} status={user.verificationStatus} />
                  </div>
                  {user.isAdmin && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/admin/users");
                      }}
                      className="w-full mx-4 my-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-center rounded-lg transition-colors text-sm font-medium"
                    >
                      Admin Panel
                    </button>
                  )}
                  <p className="px-4 py-2 text-slate-400 text-sm truncate">
                    {user.email}
                  </p>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/login");
                  }}
                  className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg transition-colors text-sm font-semibold text-center"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

