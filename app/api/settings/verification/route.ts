import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { upsertUserVerification, getUserVerification, updateVerificationStatus } from "@/lib/verification";

/**
 * GET /api/settings/verification
 * Returns the current user's verification record
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Clients don't need verification
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Verification is only for trade/business accounts" },
        { status: 403 }
      );
    }

    const verification = await getUserVerification(user.id);

    // Return default structure if no record exists
    if (!verification) {
      return NextResponse.json({
        verification: {
          status: "unverified",
          businessName: null,
          abn: null,
          primaryTrade: null,
          workTypes: null,
          licenceNumber: null,
          licenceType: null,
          licenceExpiry: null,
          insuranceProvider: null,
          insurancePolicyNumber: null,
          insuranceExpiry: null,
          insuranceCoverageNotes: null,
          abnEvidenceUrl: null,
          licenceEvidenceUrl: null,
          insuranceEvidenceUrl: null,
          rejectionReason: null,
        },
      });
    }

    return NextResponse.json({ verification });
  } catch (error) {
    console.error("Error fetching verification:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/verification
 * Creates or updates the user's verification record and sets status to "pending"
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Clients can't submit verification
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Verification is only for trade/business accounts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      businessName,
      abn,
      primaryTrade,
      workTypes,
      licenceNumber,
      licenceType,
      licenceExpiry,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceExpiry,
      insuranceCoverageNotes,
      abnEvidenceUrl,
      licenceEvidenceUrl,
      insuranceEvidenceUrl,
    } = body;

    // Validate required fields
    if (!businessName?.trim()) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }
    if (!abn?.trim()) {
      return NextResponse.json(
        { error: "ABN is required" },
        { status: 400 }
      );
    }
    if (!primaryTrade?.trim()) {
      return NextResponse.json(
        { error: "Primary trade is required" },
        { status: 400 }
      );
    }
    if (!workTypes?.trim()) {
      return NextResponse.json(
        { error: "Work types are required (select at least one: residential, commercial, strata)" },
        { status: 400 }
      );
    }

    // Check current status
    const currentVerification = await getUserVerification(user.id);
    const currentStatus = currentVerification?.status || "unverified";

    // Can't submit if already pending or verified
    if (currentStatus === "pending") {
      return NextResponse.json(
        { error: "Your verification is already pending review" },
        { status: 400 }
      );
    }
    if (currentStatus === "verified") {
      return NextResponse.json(
        { error: "Your business is already verified" },
        { status: 400 }
      );
    }

    // Upsert verification record
    await upsertUserVerification(user.id, {
      businessName: businessName.trim(),
      abn: abn.trim(),
      primaryTrade: primaryTrade.trim(),
      workTypes: workTypes.trim(),
      licenceNumber: licenceNumber?.trim() || null,
      licenceType: licenceType?.trim() || null,
      licenceExpiry: licenceExpiry || null,
      insuranceProvider: insuranceProvider?.trim() || null,
      insurancePolicyNumber: insurancePolicyNumber?.trim() || null,
      insuranceExpiry: insuranceExpiry || null,
      insuranceCoverageNotes: insuranceCoverageNotes?.trim() || null,
      abnEvidenceUrl: abnEvidenceUrl?.trim() || null,
      licenceEvidenceUrl: licenceEvidenceUrl?.trim() || null,
      insuranceEvidenceUrl: insuranceEvidenceUrl?.trim() || null,
    });

    // Set status to "pending" if it was "unverified" or "rejected"
    if (currentStatus === "unverified" || currentStatus === "rejected") {
      await updateVerificationStatus(user.id, "pending", {
        rejectionReason: null, // Clear any previous rejection reason
      });
    }

    return NextResponse.json({
      success: true,
      message: "Verification details submitted. We'll review them soon.",
    });
  } catch (error) {
    console.error("Error submitting verification:", error);
    return NextResponse.json(
      { error: "Failed to submit verification" },
      { status: 500 }
    );
  }
}
