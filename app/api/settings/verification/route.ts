import { NextResponse } from "next/server";
import { 
  getCurrentUser, 
  updateUser, 
  addUserToVerificationIndex,
  type TradieBusinessDetails 
} from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";

interface VerificationRequestBody {
  businessName: string;
  tradingName?: string;
  abn: string;
  tradeTypes: string;
  serviceArea: string;
  insuranceProvider?: string;
  insuranceExpiry?: string;
  licenceNumber?: string;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Only tradies can submit verification
    const userRole = user.role || "tradie";
    if (userRole !== "tradie") {
      return NextResponse.json(
        { error: "Only tradies can submit business verification" },
        { status: 403 }
      );
    }

    // Can't submit if already pending or verified
    const currentStatus = user.verificationStatus || "unverified";
    if (currentStatus === "pending_review") {
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

    const body = (await request.json()) as VerificationRequestBody;

    // Validate required fields
    if (!body.businessName?.trim()) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }
    if (!body.abn?.trim()) {
      return NextResponse.json(
        { error: "ABN is required" },
        { status: 400 }
      );
    }
    if (!body.tradeTypes?.trim()) {
      return NextResponse.json(
        { error: "At least one trade type is required" },
        { status: 400 }
      );
    }
    if (!body.serviceArea?.trim()) {
      return NextResponse.json(
        { error: "Service area is required" },
        { status: 400 }
      );
    }

    // Parse trade types from comma-separated string
    const tradeTypes = body.tradeTypes
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tradeTypes.length === 0) {
      return NextResponse.json(
        { error: "At least one trade type is required" },
        { status: 400 }
      );
    }

    // Build business details
    const businessDetails: TradieBusinessDetails = {
      businessName: body.businessName.trim(),
      tradingName: body.tradingName?.trim() || undefined,
      abn: body.abn.trim(),
      tradeTypes,
      serviceArea: body.serviceArea.trim(),
      insuranceProvider: body.insuranceProvider?.trim() || undefined,
      insuranceExpiry: body.insuranceExpiry?.trim() || undefined,
      licenceNumber: body.licenceNumber?.trim() || undefined,
      verificationSubmittedAt: new Date().toISOString(),
    };

    // Update user with business details and set status to pending_review
    const updatedUser = await updateUser(user.id, {
      businessDetails,
      verificationStatus: "pending_review",
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Add user to verification pending index for admin review
    await addUserToVerificationIndex(user.id, "pending_review");

    // Send notification email
    await sendNotification("tradie_verification_submitted", {
      user: updatedUser,
      businessDetails,
    });

    return NextResponse.json({
      success: true,
      message: "Verification submitted successfully",
      verificationStatus: "pending_review",
    });
  } catch (error) {
    console.error("Verification submission error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
