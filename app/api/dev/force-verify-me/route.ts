import { NextResponse } from "next/server";
import { getCurrentUser, updateUser } from "@/lib/auth";

const PRIMARY_ADMIN_EMAIL = "chad.omnexora@outlook.com";
const SUPERADMIN_EMAILS = [
  "chad.omnexora@outlook.com",
  "chadmspencer94@gmail.com",
];

export async function POST() {
  // Block this route in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();
    const isAdminEmail = SUPERADMIN_EMAILS.includes(user.email.toLowerCase());

    // Update user to verified (and admin if applicable)
    const updatedUser = await updateUser(user.id, {
      verificationStatus: "verified",
      verifiedAt: now,
      ...(isAdminEmail && { isAdmin: true }),
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    console.log(`[DEV] Force-verified user: ${user.email} (isAdmin: ${isAdminEmail})`);

    return NextResponse.json({
      success: true,
      message: "Account force-verified",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        verificationStatus: updatedUser.verificationStatus,
        verifiedAt: updatedUser.verifiedAt,
        isAdmin: updatedUser.isAdmin,
      },
    });
  } catch (error) {
    console.error("[DEV] Force-verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

