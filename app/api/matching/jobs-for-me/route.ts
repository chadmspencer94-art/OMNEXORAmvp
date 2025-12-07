import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllActiveJobs, type Job } from "@/lib/jobs";
import { doesJobMatchUser } from "@/lib/matching";

/**
 * GET /api/matching/jobs-for-me
 * Returns jobs that match the current user's service area and work types
 */
export async function GET() {
  try {
    // Get current logged-in user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user has configured service area or trade preferences
    // Load from Prisma to check business profile
    const { prisma } = await import("@/lib/prisma");
    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        primaryTrade: true,
        tradeTypes: true,
        servicePostcodes: true,
      },
    });
    
    // If user hasn't set any preferences, return empty with a message
    if (!prismaUser || (!prismaUser.primaryTrade && !prismaUser.tradeTypes && !prismaUser.servicePostcodes)) {
      return NextResponse.json({
        jobs: [],
        message: "Please complete your Business Profile to see matching jobs.",
      });
    }
    
    // Get all active jobs (excluding user's own jobs)
    const allJobs = await getAllActiveJobs(100); // Get more jobs to filter from
    
    // Filter out user's own jobs
    const otherUsersJobs = allJobs.filter((job) => job.userId !== user.id);
    
    // Match each job against the user
    const matchingJobs: Array<Job & { matchReasons: string[] }> = [];
    
    for (const job of otherUsersJobs) {
      const matchResult = await doesJobMatchUser({ user, job });
      
      if (matchResult.matches) {
        matchingJobs.push({
          ...job,
          matchReasons: matchResult.reasons.map((r) => r.reason),
        });
      }
    }
    
    // Sort by createdAt descending (newest first)
    matchingJobs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Limit to top 20 matches
    const limitedMatches = matchingJobs.slice(0, 20);
    
    return NextResponse.json({
      jobs: limitedMatches.map((job) => ({
        id: job.id,
        title: job.title,
        status: job.status,
        tradeType: job.tradeType,
        propertyType: job.propertyType,
        address: job.address,
        createdAt: job.createdAt,
        matchReasons: job.matchReasons,
      })),
    });
  } catch (error) {
    console.error("Error fetching matching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch matching jobs" },
      { status: 500 }
    );
  }
}

