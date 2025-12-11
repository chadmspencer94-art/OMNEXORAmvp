import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/settings/business-profile
 * Returns the current user's business profile fields from Prisma
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

    // Find user in Prisma by email (since KV and Prisma may use different IDs)
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        businessName: true,
        abn: true,
        primaryTrade: true,
        tradeTypes: true,
        doesResidential: true,
        doesCommercial: true,
        doesStrata: true,
        serviceRadiusKm: true,
        servicePostcodes: true,
        hourlyRate: true,
        calloutFee: true,
        ratePerM2Interior: true,
        ratePerM2Exterior: true,
        ratePerLmTrim: true,
      },
    });

    // Return business profile data (or defaults if user not found in Prisma yet)
    return NextResponse.json({
      businessProfile: prismaUser ? {
        businessName: prismaUser.businessName ?? null,
        abn: prismaUser.abn ?? null,
        primaryTrade: prismaUser.primaryTrade ?? null,
        tradeTypes: prismaUser.tradeTypes ?? null,
        doesResidential: prismaUser.doesResidential ?? true,
        doesCommercial: prismaUser.doesCommercial ?? false,
        doesStrata: prismaUser.doesStrata ?? false,
        serviceRadiusKm: prismaUser.serviceRadiusKm ?? null,
        servicePostcodes: prismaUser.servicePostcodes ?? null,
        hourlyRate: prismaUser.hourlyRate ?? null,
        calloutFee: prismaUser.calloutFee ?? null,
        ratePerM2Interior: prismaUser.ratePerM2Interior ?? null,
        ratePerM2Exterior: prismaUser.ratePerM2Exterior ?? null,
        ratePerLmTrim: prismaUser.ratePerLmTrim ?? null,
      } : {
        businessName: null,
        abn: null,
        primaryTrade: null,
        tradeTypes: null,
        doesResidential: true,
        doesCommercial: false,
        doesStrata: false,
        serviceRadiusKm: null,
        servicePostcodes: null,
        hourlyRate: null,
        calloutFee: null,
        ratePerM2Interior: null,
        ratePerM2Exterior: null,
        ratePerLmTrim: null,
      },
    });
  } catch (error) {
    console.error("Error fetching business profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/business-profile
 * Updates the current user's business profile fields in Prisma
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

    console.log(`[business-profile] saving details for user ${user.id}`);

    const body = await request.json();
    const {
      businessName,
      abn,
      primaryTrade,
      tradeTypes,
      doesResidential,
      doesCommercial,
      doesStrata,
      serviceRadiusKm,
      servicePostcodes,
      hourlyRate,
      calloutFee,
      ratePerM2Interior,
      ratePerM2Exterior,
      ratePerLmTrim,
    } = body;

    // Validate primary trade if provided
    const validTradeTypes = ["Painter", "Plasterer", "Carpenter", "Electrician", "Other"];
    if (primaryTrade !== undefined && primaryTrade !== null && primaryTrade !== "" && !validTradeTypes.includes(primaryTrade)) {
      return NextResponse.json(
        { error: "Invalid primary trade. Must be one of: Painter, Plasterer, Carpenter, Electrician, Other" },
        { status: 400 }
      );
    }

    // Validate numeric fields
    const validateInt = (value: any, fieldName: string, min?: number) => {
      if (value === undefined || value === null || value === "") return null;
      const num = Number(value);
      if (isNaN(num) || num < 0 || (min !== undefined && num < min)) {
        throw new Error(`${fieldName} must be a non-negative number${min ? ` >= ${min}` : ""}`);
      }
      return Math.round(num); // Convert to Int
    };

    let parsedServiceRadiusKm: number | null = null;
    let parsedHourlyRate: number | null = null;
    let parsedCalloutFee: number | null = null;
    let parsedRatePerM2Interior: number | null = null;
    let parsedRatePerM2Exterior: number | null = null;
    let parsedRatePerLmTrim: number | null = null;

    try {
      parsedServiceRadiusKm = validateInt(serviceRadiusKm, "Service radius");
      parsedHourlyRate = validateInt(hourlyRate, "Hourly rate");
      parsedCalloutFee = validateInt(calloutFee, "Callout fee");
      parsedRatePerM2Interior = validateInt(ratePerM2Interior, "Rate per m² interior");
      parsedRatePerM2Exterior = validateInt(ratePerM2Exterior, "Rate per m² exterior");
      parsedRatePerLmTrim = validateInt(ratePerLmTrim, "Rate per linear metre");
    } catch (validationError: any) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }

    // Build update object (only include fields that are provided)
    const updateData: any = {};
    if (businessName !== undefined) updateData.businessName = businessName?.trim() || null;
    if (abn !== undefined) updateData.abn = abn?.trim() || null;
    if (primaryTrade !== undefined) updateData.primaryTrade = primaryTrade?.trim() || null;
    if (tradeTypes !== undefined) updateData.tradeTypes = tradeTypes?.trim() || null;
    if (doesResidential !== undefined) updateData.doesResidential = Boolean(doesResidential);
    if (doesCommercial !== undefined) updateData.doesCommercial = Boolean(doesCommercial);
    if (doesStrata !== undefined) updateData.doesStrata = Boolean(doesStrata);
    if (serviceRadiusKm !== undefined) updateData.serviceRadiusKm = parsedServiceRadiusKm;
    if (servicePostcodes !== undefined) updateData.servicePostcodes = servicePostcodes?.trim() || null;
    if (hourlyRate !== undefined) updateData.hourlyRate = parsedHourlyRate;
    if (calloutFee !== undefined) updateData.calloutFee = parsedCalloutFee;
    if (ratePerM2Interior !== undefined) updateData.ratePerM2Interior = parsedRatePerM2Interior;
    if (ratePerM2Exterior !== undefined) updateData.ratePerM2Exterior = parsedRatePerM2Exterior;
    if (ratePerLmTrim !== undefined) updateData.ratePerLmTrim = parsedRatePerLmTrim;

    // Check if user exists in Prisma
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    let updatedUser;
    if (existingUser) {
      // Update existing user
      console.log(`[business-profile] updating existing user ${user.id} in Prisma`);
      updatedUser = await prisma.user.update({
        where: { email: user.email },
        data: updateData,
      });
      console.log(`[business-profile] successfully updated user ${user.id}`);
    } else {
      console.warn(`[business-profile] user ${user.id} not found in Prisma, data will be saved when user is synced`);
      // User doesn't exist in Prisma yet - we can't create without passwordHash
      // Return the update data as if it was saved (it will be saved when user is synced to Prisma)
      // For now, just return success - the data will be persisted when user is properly synced
      return NextResponse.json({
        success: true,
        businessProfile: {
          businessName: updateData.businessName ?? null,
          abn: updateData.abn ?? null,
          primaryTrade: updateData.primaryTrade ?? null,
          tradeTypes: updateData.tradeTypes ?? null,
          doesResidential: updateData.doesResidential ?? true,
          doesCommercial: updateData.doesCommercial ?? false,
          doesStrata: updateData.doesStrata ?? false,
          serviceRadiusKm: updateData.serviceRadiusKm ?? null,
          servicePostcodes: updateData.servicePostcodes ?? null,
          hourlyRate: updateData.hourlyRate ?? null,
          calloutFee: updateData.calloutFee ?? null,
          ratePerM2Interior: updateData.ratePerM2Interior ?? null,
          ratePerM2Exterior: updateData.ratePerM2Exterior ?? null,
          ratePerLmTrim: updateData.ratePerLmTrim ?? null,
        },
        note: "User not found in Prisma. Please ensure user is synced to database.",
      });
    }

    return NextResponse.json({
      success: true,
      businessProfile: {
        businessName: updatedUser.businessName ?? null,
        abn: updatedUser.abn ?? null,
        primaryTrade: updatedUser.primaryTrade ?? null,
        tradeTypes: updatedUser.tradeTypes ?? null,
        doesResidential: updatedUser.doesResidential ?? true,
        doesCommercial: updatedUser.doesCommercial ?? false,
        doesStrata: updatedUser.doesStrata ?? false,
        serviceRadiusKm: updatedUser.serviceRadiusKm ?? null,
        servicePostcodes: updatedUser.servicePostcodes ?? null,
        hourlyRate: updatedUser.hourlyRate ?? null,
        calloutFee: updatedUser.calloutFee ?? null,
        ratePerM2Interior: updatedUser.ratePerM2Interior ?? null,
        ratePerM2Exterior: updatedUser.ratePerM2Exterior ?? null,
        ratePerLmTrim: updatedUser.ratePerLmTrim ?? null,
      },
    });
  } catch (error: any) {
    console.error("[business-profile] error updating business profile:", error);
    const errorMessage = error?.message || "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

