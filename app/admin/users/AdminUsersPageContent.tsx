"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PaginationControls from "@/app/components/PaginationControls";

interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  role: string;
  verificationStatus: string;
  verifiedAt: string | null;
  emailVerifiedAt: string | null; // Email verification status
  isAdmin: boolean;
  // Plan fields
  planTier?: string;
  planStatus?: string;
  trialEndsAt?: string | null;
  // Account status
  accountStatus?: string;
  isBanned?: boolean;
  // Activity fields
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  totalJobs?: number;
  totalJobPacks?: number;
  businessDetails?: {
    businessName?: string;
    tradingName?: string;
    abn?: string;
    tradeTypes?: string[];
    serviceArea?: string;
    serviceAreaCity?: string;
    serviceAreaRadiusKm?: number;
  };
  businessName?: string;
  onboardingCompletedAt?: string | null;
  onboardingDismissed?: boolean;
  onboardingBusinessProfileDone?: boolean;
  onboardingRatesDone?: boolean;
  onboardingServiceAreaDone?: boolean;
  onboardingVerificationDone?: boolean;
  onboardingFirstJobDone?: boolean;
}

export default function AdminUsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  });
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  // Search and filter state from URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [verificationFilter, setVerificationFilter] = useState<string>(
    searchParams.get("verificationStatus") || "all"
  );
  const [planStatusFilter, setPlanStatusFilter] = useState<string>(
    searchParams.get("planStatus") || "all"
  );
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>(
    searchParams.get("accountStatus") || "all"
  );

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      // Build query params
      const params = new URLSearchParams();
      const currentPage = searchParams.get("page") || "1";
      params.set("page", currentPage);
      if (searchQuery) params.set("search", searchQuery);
      if (verificationFilter !== "all") params.set("verificationStatus", verificationFilter);
      if (planStatusFilter !== "all") params.set("planStatus", planStatusFilter);
      if (accountStatusFilter !== "all") params.set("accountStatus", accountStatusFilter);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(true);
        setUsers(Array.isArray(data.items) ? data.items : []);
        setPagination({
          page: data.page || 1,
          pageSize: data.pageSize || 20,
          totalItems: data.totalItems || 0,
          totalPages: data.totalPages || 0,
        });
      } else if (response.status === 403) {
        setIsAdmin(false);
        setError("Access denied. Admin privileges required.");
      } else if (response.status === 401) {
        router.push("/login");
      } else {
        let errorData: { error?: string } = {};
        try {
          errorData = await response.json();
        } catch {
          // If JSON parsing fails, use default error message
        }
        setError(errorData?.error || "Failed to load users. Please try again.");
      }
    } catch (err: any) {
      console.error("[admin-users] error fetching users:", err);
      const errorMessage = err?.message || "Failed to load users. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [router, searchParams, searchQuery, verificationFilter, planStatusFilter, accountStatusFilter]);

  // Fetch current user ID on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setCurrentUserId(data.user.id);
          }
        }
      } catch {
        // Ignore errors
      }
    };
    fetchCurrentUser();
  }, []);

  // Update user via API
  const updateUserField = async (field: string, value: any) => {
    if (!selectedUser) return;

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.error || "Could not update user. Please try again.";
        setUpdateError(errorMessage);
        console.error("Update failed:", errorMessage, data);
        setIsUpdating(false);
        return;
      }

      const data = await response.json();
      const updatedUser = data.user;

      // Update selectedUser state
      setSelectedUser(updatedUser);

      // Refresh users list to reflect changes
      fetchUsers();

      // Show success message
      if (field === "isAdmin") {
        setUpdateSuccess(value ? "User is now an admin" : "Admin privileges removed");
      } else {
        setUpdateSuccess("User updated successfully");
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(null);
      }, 3000);

      setUpdateError(null);
    } catch (err) {
      console.error("Error updating user:", err);
      const errorMessage = err instanceof Error ? err.message : "Could not update user. Please try again.";
      setUpdateError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAdmin = () => {
    if (!selectedUser) return;
    updateUserField("isAdmin", !selectedUser.isAdmin);
  };

  const handlePlanStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUserField("planStatus", e.target.value);
  };

  // Update URL when filters change and reset to page 1
  const updateFilters = useCallback((updates: {
    search?: string;
    verificationStatus?: string;
    planStatus?: string;
    accountStatus?: string;
  }) => {
    const params = new URLSearchParams();
    const newSearch = updates.search !== undefined ? updates.search : searchQuery;
    const newVerification = updates.verificationStatus !== undefined ? updates.verificationStatus : verificationFilter;
    const newPlanStatus = updates.planStatus !== undefined ? updates.planStatus : planStatusFilter;
    const newAccountStatus = updates.accountStatus !== undefined ? updates.accountStatus : accountStatusFilter;

    if (newSearch) params.set("search", newSearch);
    if (newVerification !== "all") params.set("verificationStatus", newVerification);
    if (newPlanStatus !== "all") params.set("planStatus", newPlanStatus);
    if (newAccountStatus !== "all") params.set("accountStatus", newAccountStatus);
    // Reset to page 1 when filters change
    // params.delete("page"); // page 1 is default

    router.push(`/admin/users?${params.toString()}`);
  }, [router, searchQuery, verificationFilter, planStatusFilter, accountStatusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Sync URL params with state
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlVerification = searchParams.get("verificationStatus") || "all";
    const urlPlanStatus = searchParams.get("planStatus") || "all";
    const urlAccountStatus = searchParams.get("accountStatus") || "all";

    if (urlSearch !== searchQuery) setSearchQuery(urlSearch);
    if (urlVerification !== verificationFilter) setVerificationFilter(urlVerification);
    if (urlPlanStatus !== planStatusFilter) setPlanStatusFilter(urlPlanStatus);
    if (urlAccountStatus !== accountStatusFilter) setAccountStatusFilter(urlAccountStatus);
  }, [searchParams]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "builder":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "tradie":
        return "bg-green-100 text-green-700 border-green-300";
      case "client":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "supplier":
        return "bg-slate-100 text-slate-700 border-slate-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-700 border-green-300";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "unverified":
        return "bg-slate-100 text-slate-500 border-slate-300";
      default:
        return "bg-slate-100 text-slate-500 border-slate-300";
    }
  };

  const getPlanTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case "FOUNDER":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "PRO":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "BUSINESS":
        return "bg-indigo-100 text-indigo-700 border-indigo-300";
      case "TRIAL":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "FREE":
        return "bg-slate-100 text-slate-500 border-slate-300";
      default:
        return "bg-slate-100 text-slate-500 border-slate-300";
    }
  };

  const getPlanStatusBadgeColor = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-300";
      case "TRIAL":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "PAST_DUE":
        return "bg-red-100 text-red-700 border-red-300";
      case "CANCELLED":
        return "bg-slate-100 text-slate-500 border-slate-300";
      case "SUSPENDED":
        return "bg-amber-100 text-amber-700 border-amber-300";
      default:
        return "bg-slate-100 text-slate-500 border-slate-300";
    }
  };

  const formatLastLogin = (dateString: string | null | undefined) => {
    if (!dateString) return "Never logged in";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-6">
            You don&apos;t have permission to access this page.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Admin Navigation */}
      <div className="mb-6 flex gap-3">
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Dashboard
        </Link>
        <span className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg">
          Users
        </span>
        <Link
          href="/admin/verification"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Verifications
        </Link>
        <Link
          href="/admin/feedback"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
        >
          Feedback Log
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">All Users</h1>
        <p className="text-slate-600">
          Manage all registered users in the system. {pagination.totalItems} total user{pagination.totalItems !== 1 ? "s" : ""}.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search users…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                updateFilters({ search: e.target.value });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateFilters({ search: searchQuery });
                }
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Verification Status Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              updateFilters({ verificationStatus: e.target.value });
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Verification Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="unverified">Unverified</option>
          </select>

          {/* Plan Status Filter */}
          <select
            value={planStatusFilter}
            onChange={(e) => {
              setPlanStatusFilter(e.target.value);
              updateFilters({ planStatus: e.target.value });
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Plan Status</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIAL">Trial</option>
            <option value="PAST_DUE">Past Due</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Account Status Filter */}
          <select
            value={accountStatusFilter}
            onChange={(e) => {
              setAccountStatusFilter(e.target.value);
              updateFilters({ accountStatus: e.target.value });
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Account Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {users.length === 0 && !isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            {pagination.totalItems === 0 ? "No Users Yet" : "No Users Match Filters"}
          </h2>
          <p className="text-slate-600">
            {pagination.totalItems === 0
              ? "No users have registered yet."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => {
                  const accountStatus = user.accountStatus || (user.isBanned ? "BANNED" : "ACTIVE");

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-slate-900">{user.businessName || user.name || user.email.split("@")[0]}</div>
                        {user.businessName && user.email && (
                          <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-slate-900">{user.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          user.isAdmin || user.role === "admin"
                            ? "bg-purple-100 text-purple-700 border-purple-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}>
                          {user.isAdmin || user.role === "admin" ? "Admin" : user.role || "User"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPlanTierBadgeColor(user.planTier)}`}>
                            {user.planTier || "FREE"}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPlanStatusBadgeColor(user.planStatus)}`}>
                            {user.planStatus || "TRIAL"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          accountStatus === "BANNED" || user.isBanned
                            ? "bg-red-100 text-red-700 border-red-300"
                            : accountStatus === "SUSPENDED"
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-green-100 text-green-700 border-green-300"
                        }`}>
                          {accountStatus === "BANNED" ? "Banned" : accountStatus === "SUSPENDED" ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBadgeColor(user.verificationStatus)}`}>
                          {user.verificationStatus === "pending" ? "Pending review" : user.verificationStatus === "verified" ? "Verified" : "Not submitted"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200">
              <PaginationControls
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
              />
            </div>
          )}
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                <p className="mt-1 text-sm text-slate-900">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</label>
                <p className="mt-1 text-sm font-mono text-slate-600">{selectedUser.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verification Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(selectedUser.verificationStatus)}`}>
                      {selectedUser.verificationStatus === "pending" ? "Pending" : selectedUser.verificationStatus === "verified" ? "Verified" : "Unverified"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan Tier</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPlanTierBadgeColor(selectedUser.planTier)}`}>
                      {selectedUser.planTier || "FREE"}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPlanStatusBadgeColor(selectedUser.planStatus)}`}>
                      {selectedUser.planStatus || "TRIAL"}
                    </span>
                  </p>
                </div>
              </div>
              {selectedUser.trialEndsAt && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trial Ends At</label>
                  <p className="mt-1 text-sm text-slate-900">
                    {new Date(selectedUser.trialEndsAt).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Created At</label>
                  <p className="mt-1 text-sm text-slate-900">
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Verified At</label>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedUser.verifiedAt ? new Date(selectedUser.verifiedAt).toLocaleString() : "Not verified"}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Verified</label>
                <p className="mt-1">
                  {selectedUser.emailVerifiedAt ? (
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                        ✓ Verified
                      </span>
                      <span className="text-sm text-slate-600">
                        {new Date(selectedUser.emailVerifiedAt).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300">
                      Not verified
                    </span>
                  )}
                </p>
              </div>
              {/* Onboarding Status */}
              {selectedUser.role !== "client" && (
                <div className="pt-4 border-t border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">
                    Onboarding
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Onboarding completed:</span>
                      <span className="text-sm text-slate-900">
                        {selectedUser.onboardingCompletedAt
                          ? new Date(selectedUser.onboardingCompletedAt).toLocaleString()
                          : "Not yet"}
                      </span>
                    </div>
                    {selectedUser.onboardingBusinessProfileDone !== undefined && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          {selectedUser.onboardingBusinessProfileDone ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-slate-300">○</span>
                          )}
                          <span className="text-slate-600">Business profile</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedUser.onboardingRatesDone ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-slate-300">○</span>
                          )}
                          <span className="text-slate-600">Rates</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedUser.onboardingServiceAreaDone ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-slate-300">○</span>
                          )}
                          <span className="text-slate-600">Service area</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedUser.onboardingVerificationDone ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-slate-300">○</span>
                          )}
                          <span className="text-slate-600">Verification</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedUser.onboardingFirstJobDone ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-slate-300">○</span>
                          )}
                          <span className="text-slate-600">First job</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Login</label>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : "Never"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Activity</label>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedUser.lastActivityAt ? new Date(selectedUser.lastActivityAt).toLocaleString() : "Never"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Jobs</label>
                  <p className="mt-1 text-sm text-slate-900">
                    {selectedUser.totalJobs ?? 0}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</label>
                  <p className="mt-1">
                    {selectedUser.isAdmin ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-300">
                        No
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {selectedUser.businessDetails && (
                <div className="pt-4 border-t border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Details</label>
                  <div className="mt-2 space-y-2">
                    {selectedUser.businessDetails.businessName && (
                      <div>
                        <span className="text-xs text-slate-500">Business Name: </span>
                        <span className="text-sm text-slate-900">{selectedUser.businessDetails.businessName}</span>
                      </div>
                    )}
                    {selectedUser.businessDetails.tradingName && (
                      <div>
                        <span className="text-xs text-slate-500">Trading Name: </span>
                        <span className="text-sm text-slate-900">{selectedUser.businessDetails.tradingName}</span>
                      </div>
                    )}
                    {selectedUser.businessDetails.abn && (
                      <div>
                        <span className="text-xs text-slate-500">ABN: </span>
                        <span className="text-sm font-mono text-slate-900">{selectedUser.businessDetails.abn}</span>
                      </div>
                    )}
                    {selectedUser.businessDetails.tradeTypes && selectedUser.businessDetails.tradeTypes.length > 0 && (
                      <div>
                        <span className="text-xs text-slate-500">Trade Types: </span>
                        <span className="text-sm text-slate-900">{selectedUser.businessDetails.tradeTypes.join(", ")}</span>
                      </div>
                    )}
                    {selectedUser.businessDetails.serviceArea && (
                      <div>
                        <span className="text-xs text-slate-500">Service Area: </span>
                        <span className="text-sm text-slate-900">{selectedUser.businessDetails.serviceArea}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Admin Controls */}
              <div className="pt-4 border-t border-slate-200">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
                  Admin Controls
                </label>
                <div className="space-y-4">
                  {/* Admin Status Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Admin Status</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedUser.isAdmin ? "User has admin privileges" : "User does not have admin privileges"}
                      </p>
                    </div>
                    <button
                      onClick={handleToggleAdmin}
                      disabled={isUpdating || (currentUserId === selectedUser.id && selectedUser.isAdmin)}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        selectedUser.isAdmin
                          ? "bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          : "bg-purple-100 hover:bg-purple-200 text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                    >
                      {isUpdating
                        ? "..."
                        : selectedUser.isAdmin
                        ? currentUserId === selectedUser.id
                          ? "Cannot Remove Own Admin"
                          : "Remove Admin"
                        : "Make Admin"}
                    </button>
                  </div>

                  {/* Plan Status */}
                  <div>
                    <label className="text-sm font-medium text-slate-900 mb-2 block">Plan Status</label>
                    <select
                      value={selectedUser.planStatus || "TRIAL"}
                      onChange={handlePlanStatusChange}
                      disabled={isUpdating}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="TRIAL">TRIAL</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PAST_DUE">PAST_DUE</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  {/* Success Message */}
                  {updateSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {updateSuccess}
                    </div>
                  )}

                  {/* Error Message */}
                  {updateError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {updateError}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

