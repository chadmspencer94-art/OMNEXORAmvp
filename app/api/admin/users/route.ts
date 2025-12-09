import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { buildPagination, buildPaginatedResult, type PaginatedResult } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

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
}

/**
 * GET /api/admin/users
 * Returns paginated users in the system (admin only)
 * Query params: page, search, verificationStatus, planStatus, accountStatus
 */
export async function GET(request: NextRequest) {
  try {
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

    // Build pagination
    const { page, pageSize, skip, take } = buildPagination(pageParam, 20);

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
          tradeTypes: user.tradeTypes ? JSON.parse(user.tradeTypes) : undefined,
          serviceArea: user.serviceArea || undefined,
          serviceAreaCity: user.serviceAreaCity || undefined,
          serviceAreaRadiusKm: user.serviceRadiusKm || undefined,
        },
        trialEndsAt: user.trialEndsAt?.toISOString() || null,
      };
    });

    const result: PaginatedResult<UserListItem> = buildPaginatedResult(
      users,
      page,
      pageSize,
      totalItems
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
