"use client";

import Link from "next/link";
import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { featureFlags } from "@/lib/featureFlags";
import { resetDemoData } from "@/app/api/demo/reset/actions";
import OvisModal from "./OvisModal";

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
  isDemoMode?: boolean;
}

function VerificationBadge({ role, status }: { role: UserRole; status: VerificationStatus }) {
  if (role === "tradie") {
    if (status === "verified") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-300">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Structured
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
          Structuring Pending
        </Link>
      );
    }
    // Handle legacy "rejected" status - show as unstructured
    if (status === "rejected") {
      return (
        <Link
          href="/settings/verification"
          className="inline-flex items-center gap-1 px-2 py-1 bg-red-900/50 text-red-400 hover:text-red-300 text-xs font-medium rounded-full transition-colors"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Structuring Rejected
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
        Not Structured
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
        Structured
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
  // Also handle legacy "rejected" as unstructured
  const statusStr = status as string;
  if (statusStr === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-400 text-xs font-medium rounded-full">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Not Structured
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-400 text-xs font-medium rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      Not Structured
    </span>
  );
}

export default function NavbarClient({ user: initialUser, isDemoMode = false }: NavbarClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isOvisModalOpen, setIsOvisModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Use server-provided user directly - no client-side auth checks to avoid hydration mismatches
  const user = initialUser;

  // Ensure pathname-dependent rendering only happens after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when user logs out
  useEffect(() => {
    if (!user && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [user, mobileMenuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Close dropdown when user logs in
  useEffect(() => {
    if (user && dropdownOpen) {
      setDropdownOpen(false);
    }
  }, [user, dropdownOpen]);

  // Refresh navbar when window gets focus (user might have logged in/out in another tab)
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;
    let isRefreshing = false;
    
    const handleFocus = () => {
      // Debounce refresh calls to avoid multiple rapid refreshes
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      
      refreshTimeout = setTimeout(() => {
        // Only refresh if not already refreshing and component is still mounted
        if (!isRefreshing && mounted) {
          isRefreshing = true;
          try {
            router.refresh();
          } catch (error) {
            // Silently fail if refresh fails (e.g., during navigation or server unavailable)
            console.debug("[NavbarClient] Failed to refresh on focus:", error);
          } finally {
            // Reset flag after a short delay
            setTimeout(() => {
              isRefreshing = false;
            }, 1000);
          }
        }
      }, 300);
    };
    
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [router, mounted]);

  const isLoggedIn = !!user;
  const isClient = user?.role === "client";
  const isSuperAdmin = user?.isAdmin === true;
  const [isResetting, startReset] = useTransition();

  // Role-aware navigation links
  // Core routes are always shown; experimental features are controlled by feature flags
  const navLinks = isClient
    ? [
        { href: "/client/dashboard", label: "Dashboard" },
        { href: "/client/jobs/new", label: "Post Job" },
      ]
    : [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/jobs", label: "Jobs" },
        ...(featureFlags.showCalendar ? [{ href: "/calendar", label: "Calendar" }] : []),
        { href: "/clients", label: "Clients" },
        ...(featureFlags.showBilling ? [{ href: "/billing", label: "Billing" }] : []),
        { href: "/settings", label: "Settings" },
      ];

  const handleResetDemoData = async () => {
    if (!confirm("Reset demo data? This will update demo user accounts to their default state.")) {
      return;
    }

    startReset(async () => {
      try {
        const result = await resetDemoData();

        if (!result.success) {
          alert(result.error || "Failed to reset demo data");
          return;
        }

        alert(result.message || "Demo data reset successfully!");
        router.refresh();
      } catch (error) {
        console.error("Error resetting demo data:", error);
        alert("An unexpected error occurred. Please try again.");
      }
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    // Close mobile menu immediately for instant UI update
    setMobileMenuOpen(false);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setLogoutError(data.error || "Logout failed");
        setIsLoggingOut(false);
        // Refresh to get updated auth state from server
        try {
          router.refresh();
        } catch (error) {
          // Silently fail if refresh fails
          console.debug("[NavbarClient] Failed to refresh after logout error:", error);
        }
        return;
      }

      // Clear session cookie is handled by server
      // Close menu and redirect to login, then refresh to update navbar state
      setMobileMenuOpen(false);
      router.replace("/login");
      try {
        router.refresh();
      } catch (error) {
        // Silently fail if refresh fails
        console.debug("[NavbarClient] Failed to refresh after logout:", error);
      }
    } catch {
      setLogoutError("An unexpected error occurred");
      setIsLoggingOut(false);
      // Close menu and refresh to get updated auth state from server
      setMobileMenuOpen(false);
      try {
        router.refresh();
      } catch (error) {
        // Silently fail if refresh fails
        console.debug("[NavbarClient] Failed to refresh after logout exception:", error);
      }
    }
  };

  return (
    <>
      {/* DEMO MODE Banner - Only shown when DEMO_MODE=true */}
      {isDemoMode && (
        <div className="bg-amber-600 border-b border-amber-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-medium text-amber-900">DEMO MODE</span>
              {isSuperAdmin && (
                <button
                  onClick={handleResetDemoData}
                  disabled={isResetting}
                  className="ml-2 px-2 py-0.5 text-xs font-medium text-amber-900 hover:text-amber-950 bg-amber-500 hover:bg-amber-400 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? "Resetting..." : "Reset Demo Data"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => {
                router.push(isLoggedIn ? "/dashboard" : "/");
              }}
              className="flex items-center text-xl sm:text-2xl font-bold text-white tracking-tight hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
            >
              OMNEXORA
            </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {isLoggedIn && navLinks.map((link) => {
              // Only calculate active state after hydration to avoid mismatch
              const isActive = mounted && (pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href)));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    isActive
                      ? "text-white bg-slate-800"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className={`ml-4 ${isLoggedIn ? "pl-4 border-l border-slate-700" : ""} flex items-center space-x-3`}>
              {logoutError && (
                <span className="text-red-400 text-xs">{logoutError}</span>
              )}
              {isLoggedIn ? (
                <>
                  <VerificationBadge role={user.role} status={user.verificationStatus} />
                  {user.isAdmin && (
                    <Link
                      href="/admin/dashboard"
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
                    className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    {isLoggingOut ? "..." : "Logout"}
                  </button>
                </>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg transition-colors text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 flex items-center gap-1.5"
                  >
                    Menu
                    <svg
                      className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-2 z-50 max-h-[80vh] overflow-y-auto">
                      {/* Product Section */}
                      <div className="px-4 py-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Product</h3>
                        <ul className="space-y-1">
                          <li>
                            <Link
                              href="/register"
                              onClick={() => setDropdownOpen(false)}
                              className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors text-sm"
                            >
                              Get Started
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/login"
                              onClick={() => setDropdownOpen(false)}
                              className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors text-sm"
                            >
                              Sign In
                            </Link>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setDropdownOpen(false);
                                setIsOvisModalOpen(true);
                              }}
                              className="w-full text-left px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors text-sm"
                            >
                              What is OVIS?
                            </button>
                          </li>
                        </ul>
                      </div>

                      {/* Company Section */}
                      <div className="px-4 py-2 border-t border-slate-700">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Company</h3>
                        <ul className="space-y-1">
                          <li>
                            <a
                              href="https://v0-omnexora-marketing-website.vercel.app/about"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setDropdownOpen(false)}
                              className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors text-sm"
                            >
                              About Us
                            </a>
                          </li>
                          <li>
                            <a
                              href="https://v0-omnexora-marketing-website.vercel.app/contact"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setDropdownOpen(false)}
                              className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors text-sm"
                            >
                              Contact
                            </a>
                          </li>
                          <li>
                            <a
                              href="https://v0-omnexora-marketing-website.vercel.app/contact"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setDropdownOpen(false)}
                              className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors text-sm"
                            >
                              Pilot Program <span className="text-slate-500 text-xs">(Contact us)</span>
                            </a>
                          </li>
                          <li>
                            <span className="block px-3 py-2 text-slate-500 text-sm">
                              Partner with Us <span className="text-xs">(Launching soon)</span>
                            </span>
                          </li>
                          <li>
                            <span className="block px-3 py-2 text-slate-500 text-sm">
                              Affiliates <span className="text-xs">(Coming soon)</span>
                            </span>
                          </li>
                        </ul>
                      </div>

                      {/* Legal Section */}
                      <div className="px-4 py-2 border-t border-slate-700">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Legal</h3>
                        <ul className="space-y-1">
                          <li>
                            <span className="block px-3 py-2 text-slate-500 text-sm">Privacy Policy</span>
                          </li>
                          <li>
                            <span className="block px-3 py-2 text-slate-500 text-sm">Terms of Service</span>
                          </li>
                        </ul>
                      </div>

                      {/* Community Section */}
                      <div className="px-4 py-2 border-t border-slate-700">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Join our Community</h3>
                        <div className="flex gap-3 px-3">
                          {/* Facebook - Coming Soon */}
                          <span className="text-slate-500 cursor-not-allowed" title="Coming soon">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                            </svg>
                          </span>

                          {/* Instagram - Coming Soon */}
                          <span className="text-slate-500 cursor-not-allowed" title="Coming soon">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                            </svg>
                          </span>

                          {/* WhatsApp - Coming Soon */}
                          <span className="text-slate-500 cursor-not-allowed" title="Coming soon">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                          </span>

                          {/* TikTok - Active Link */}
                          <a
                            href="https://www.tiktok.com/@omnexora"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setDropdownOpen(false)}
                            className="text-slate-300 hover:text-white transition-colors"
                            aria-label="Follow us on TikTok"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
            {isLoggedIn && navLinks.map((link) => {
              // Only calculate active state after hydration to avoid mismatch
              const isActive = mounted && (pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href)));
              return (
                <button
                  key={link.href}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push(link.href);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                    isActive
                      ? "text-white bg-slate-700"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
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
                        router.push("/admin/dashboard");
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
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push("/register");
                    }}
                    className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg transition-colors text-sm font-semibold text-center"
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      router.push("/login");
                    }}
                    className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium text-center border border-slate-600"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
    <OvisModal isOpen={isOvisModalOpen} onClose={() => setIsOvisModalOpen(false)} />
    </>
  );
}

