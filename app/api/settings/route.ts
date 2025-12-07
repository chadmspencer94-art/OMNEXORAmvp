import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, updateUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Return user settings including pricing
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        hourlyRate: user.hourlyRate ?? null,
        dayRate: user.dayRate ?? null,
        materialMarkupPercent: user.materialMarkupPercent ?? null,
        roughEstimateOnly: user.roughEstimateOnly ?? null,
      },
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { hourlyRate, dayRate, materialMarkupPercent, roughEstimateOnly } = body;

    // Validate and parse pricing fields
    const parsedHourlyRate = hourlyRate !== undefined && hourlyRate !== null && hourlyRate !== ""
      ? Number(hourlyRate)
      : null;
    const parsedDayRate = dayRate !== undefined && dayRate !== null && dayRate !== ""
      ? Number(dayRate)
      : null;
    const parsedMaterialMarkup = materialMarkupPercent !== undefined && materialMarkupPercent !== null && materialMarkupPercent !== ""
      ? Number(materialMarkupPercent)
      : null;
    const parsedRoughEstimateOnly = roughEstimateOnly !== undefined ? Boolean(roughEstimateOnly) : null;

    // Validate rates are non-negative numbers if provided
    if (parsedHourlyRate !== null && (isNaN(parsedHourlyRate) || parsedHourlyRate < 0)) {
      return NextResponse.json(
        { error: "Hourly rate must be a non-negative number" },
        { status: 400 }
      );
    }

    if (parsedDayRate !== null && (isNaN(parsedDayRate) || parsedDayRate < 0)) {
      return NextResponse.json(
        { error: "Day rate must be a non-negative number" },
        { status: 400 }
      );
    }

    if (parsedMaterialMarkup !== null && (isNaN(parsedMaterialMarkup) || parsedMaterialMarkup < 0 || parsedMaterialMarkup > 100)) {
      return NextResponse.json(
        { error: "Material markup must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    // Update user with pricing settings
    const updatedUser = await updateUser(user.id, {
      hourlyRate: parsedHourlyRate,
      dayRate: parsedDayRate,
      materialMarkupPercent: parsedMaterialMarkup,
      roughEstimateOnly: parsedRoughEstimateOnly,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        hourlyRate: updatedUser.hourlyRate ?? null,
        dayRate: updatedUser.dayRate ?? null,
        materialMarkupPercent: updatedUser.materialMarkupPercent ?? null,
        roughEstimateOnly: updatedUser.roughEstimateOnly ?? null,
      },
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

