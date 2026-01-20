import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { buildPagination, buildPaginatedResult, type PaginatedResult } from "@/lib/pagination";
import { getPrisma } from "@/lib/prisma";

interface UserListItem {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  role: string;
  verificationStatus: string;
  verifiedAt: string | null;
  isAdmin: boolean;
  planTier?: string;
  planStatus?: string;
  trialEndsAt?: string | null;
  accountStatus?: string;
  isBanned?: boolean;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  totalJobs?: number;
  businessName?: string;
  businessDetails?: {
    businessName?: string;
    tradingName?: string;
    abn?: string;
    tradeTypes?: string[];
    serviceArea?: string;
    serviceAreaCity?: string;
    serviceAreaRadiusKm?: number;
  };
  // Signup tracking
  signupSource?: string;
  inviteCodeUsed?: string;
}

/**
 * GET /api/admin/users
 * Returns paginated users in the system (admin only)
 * Query params: page, search, verificationStatus, planStatus, accountStatus
 */
export async function GET(request: NextRequest) {
  try {
    console.log("[admin-users] loading users list");
    // Check authentication and admin status
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!isAdmin(currentUser)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const searchQuery = searchParams.get("search") || "";
    const verificationFilter = searchParams.get("verificationStatus") || "all";
    const planStatusFilter = searchParams.get("planStatus") || "all";
    const accountStatusFilter = searchParams.get("accountStatus") || "all";
    const signupSourceFilter = searchParams.get("signupSource") || "all";

    // Build pagination
    const { page, pageSize, skip, take } = buildPagination(pageParam, 20);

    const prisma = getPrisma();
    // Build Prisma where clause
    const where: any = {};

    // Search filter (email, businessName)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      where.OR = [
        { email: { contains: query, mode: "insensitive" } },
        { businessName: { contains: query, mode: "insensitive" } },
        { tradingName: { contains: query, mode: "insensitive" } },
      ];
    }

    // Verification status filter
    if (verificationFilter !== "all") {
      where.verificationStatus = verificationFilter;
    }

    // Plan status filter
    if (planStatusFilter !== "all") {
      where.planStatus = planStatusFilter;
    }

    // Account status filter
    if (accountStatusFilter !== "all") {
      if (accountStatusFilter === "BANNED") {
        where.isBanned = true;
      } else {
        where.accountStatus = accountStatusFilter;
        where.isBanned = false;
      }
    }
    
    // Signup source filter (for separating founders from regular users)
    // Note: this filter only works after DB migration adds signupSource column
    // Until then, filtering by signupSource won't work at DB level
    let signupSourceFilterValue = signupSourceFilter;
    if (signupSourceFilter !== "all") {
      try {
        // Test if signupSource column exists
        await prisma.$queryRaw`SELECT signupSource FROM users LIMIT 1`;
        if (signupSourceFilter === "FOUNDER") {
          // Show both FOUNDER_CODE and FOUNDER_EMAIL users
          where.signupSource = { in: ["FOUNDER_CODE", "FOUNDER_EMAIL"] };
        } else {
          where.signupSource = signupSourceFilterValue;
        }
      } catch {
        // Column doesn't exist yet, skip DB-level filter
        console.log("[admin-users] signupSource column not available for filtering");
      }
    }

    // Get total count with same filters
    const totalItems = await prisma.user.count({ where });

    // Get paginated users
    const prismaUsers = await prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        createdAt: true,
        role: true,
        verificationStatus: true,
        verifiedAt: true,
        emailVerifiedAt: true, // Email verification status
        isBanned: true,
        accountStatus: true,
        planTier: true,
        planStatus: true,
        trialEndsAt: true,
        lastLoginAt: true,
        lastActivityAt: true,
        totalJobs: true,
        businessName: true,
        tradingName: true,
        abn: true,
        primaryTrade: true,
        tradeTypes: true,
        serviceArea: true,
        serviceAreaCity: true,
        serviceRadiusKm: true,
        onboardingCompletedAt: true,
        onboardingDismissed: true,
        onboardingBusinessProfileDone: true,
        onboardingRatesDone: true,
        onboardingServiceAreaDone: true,
        onboardingVerificationDone: true,
        onboardingFirstJobDone: true,
      },
    });
    
    // Try to get signup tracking fields separately (in case DB schema is out of sync)
    // These fields may not exist until migration is run
    let signupTrackingMap: Map<string, { signupSource?: string; inviteCodeUsed?: string }> = new Map();
    try {
      const signupData = await prisma.$queryRaw`SELECT id, signupSource, inviteCodeUsed FROM users` as Array<{ id: string; signupSource?: string; inviteCodeUsed?: string }>;
      signupTrackingMap = new Map(signupData.map(d => [d.id, { signupSource: d.signupSource, inviteCodeUsed: d.inviteCodeUsed }]));
    } catch {
      // Fields don't exist yet, that's okay
      console.log("[admin-users] signupSource fields not available in database yet");
    }

    // Check admin status from KV (since isAdmin might not be in Prisma)
    const { getAllUsers } = await import("@/lib/auth");
    const allKvUsers = await getAllUsers();
    const kvUserMap = new Map(allKvUsers.map((u) => [u.id, u]));

    // Map to response format
    const users: UserListItem[] = prismaUsers.map((user) => {
      const kvUser = kvUserMap.get(user.id);
      const isAdminFlag = kvUser?.isAdmin ?? false;

      return {
        id: user.id,
        email: user.email,
        name: user.email.split("@")[0],
        businessName: user.businessName || undefined,
        role: user.role,
        isAdmin: isAdminFlag,
        planTier: user.planTier || "FREE",
        planStatus: user.planStatus || "TRIAL",
        accountStatus: user.accountStatus || (user.isBanned ? "BANNED" : "ACTIVE"),
        isBanned: user.isBanned,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        lastActivityAt: user.lastActivityAt?.toISOString() || null,
        totalJobs: user.totalJobs || 0,
        verificationStatus: user.verificationStatus,
        verifiedAt: user.verifiedAt?.toISOString() || null,
        emailVerifiedAt: user.emailVerifiedAt?.toISOString() || null, // Email verification status
        businessDetails: {
          businessName: user.businessName || undefined,
          tradingName: user.tradingName || undefined,
          abn: user.abn || undefined,
          tradeTypes: user.tradeTypes ? (() => {
            try {
              return JSON.parse(user.tradeTypes);
            } catch {
              // If JSON parsing fails, return as string array or undefined
              return user.tradeTypes.includes(",") ? user.tradeTypes.split(",").map(t => t.trim()) : undefined;
            }
          })() : undefined,
          serviceArea: user.serviceArea || undefined,
          serviceAreaCity: user.serviceAreaCity || undefined,
          serviceAreaRadiusKm: user.serviceRadiusKm || undefined,
        },
        trialEndsAt: user.trialEndsAt?.toISOString() || null,
        // Signup tracking (from raw query or KV fallback)
        signupSource: signupTrackingMap.get(user.id)?.signupSource || kvUser?.signupSource || "ORGANIC",
        inviteCodeUsed: signupTrackingMap.get(user.id)?.inviteCodeUsed || kvUser?.inviteCodeUsed || undefined,
      };
    });

    const result: PaginatedResult<UserListItem> = buildPaginatedResult(
      users,
      page,
      pageSize,
      totalItems
    );

    console.log(`[admin-users] loaded ${users.length} users (page ${page}, total ${totalItems})`);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[admin-users] error fetching users:", error);
    const errorMessage = error?.message || "Failed to load users. Please try again.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
