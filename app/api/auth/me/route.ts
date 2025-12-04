import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Return safe user data including role, verification status, and admin flag
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        role: user.role || "tradie", // Default for older users
        verificationStatus: user.verificationStatus || "unverified", // Default for older users
        verifiedAt: user.verifiedAt ?? null,
        isAdmin: user.isAdmin ?? false,
        businessDetails: user.businessDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

