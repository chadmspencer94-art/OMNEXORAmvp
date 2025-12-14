import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/settings/business-rates
 * Returns the current user's business rates and defaults from Prisma
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

    const prisma = getPrisma();
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        gstRegistered: true,
        defaultMarginPct: true,
        defaultDepositPct: true,
        defaultPaymentTerms: true,
        tradeRatesJson: true,
        dayRate: true,
        hourlyRate: true,
        calloutFee: true,
      },
    });

    // Parse tradeRatesJson if it exists
    let tradeRates = null;
    if (prismaUser?.tradeRatesJson) {
      try {
        tradeRates = JSON.parse(prismaUser.tradeRatesJson);
      } catch {
        tradeRates = null;
      }
    }

    return NextResponse.json({
      businessRates: prismaUser ? {
        gstRegistered: prismaUser.gstRegistered ?? false,
        defaultMarginPct: prismaUser.defaultMarginPct ? Number(prismaUser.defaultMarginPct) : null,
        defaultDepositPct: prismaUser.defaultDepositPct ? Number(prismaUser.defaultDepositPct) : null,
        defaultPaymentTerms: prismaUser.defaultPaymentTerms ?? null,
        tradeRates: tradeRates,
        dayRate: prismaUser.dayRate ?? null,
        hourlyRate: prismaUser.hourlyRate ?? null,
        calloutFee: prismaUser.calloutFee ?? null,
      } : {
        gstRegistered: false,
        defaultMarginPct: null,
        defaultDepositPct: null,
        defaultPaymentTerms: null,
        tradeRates: null,
        dayRate: null,
        hourlyRate: null,
        calloutFee: null,
      },
    });
  } catch (error) {
    console.error("Error fetching business rates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/business-rates
 * Updates the current user's business rates and defaults in Prisma
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

    const body = await request.json();
    const {
      gstRegistered,
      defaultMarginPct,
      defaultDepositPct,
      defaultPaymentTerms,
      tradeRates,
      dayRate,
      hourlyRate,
      calloutFee,
    } = body;

    // Validate numeric fields
    const validateDecimal = (value: any, fieldName: string, min?: number, max?: number) => {
      if (value === undefined || value === null || value === "") return null;
      const num = Number(value);
      if (isNaN(num) || num < 0 || (min !== undefined && num < min) || (max !== undefined && num > max)) {
        throw new Error(`${fieldName} must be a number${min !== undefined ? ` >= ${min}` : ""}${max !== undefined ? ` <= ${max}` : ""}`);
      }
      return num;
    };

    const validateInt = (value: any, fieldName: string, min?: number) => {
      if (value === undefined || value === null || value === "") return null;
      const num = Number(value);
      if (isNaN(num) || num < 0 || (min !== undefined && num < min)) {
        throw new Error(`${fieldName} must be a non-negative number${min ? ` >= ${min}` : ""}`);
      }
      return Math.round(num);
    };

    let parsedDefaultMarginPct: number | null = null;
    let parsedDefaultDepositPct: number | null = null;
    let parsedDayRate: number | null = null;
    let parsedHourlyRate: number | null = null;
    let parsedCalloutFee: number | null = null;

    try {
      parsedDefaultMarginPct = validateDecimal(defaultMarginPct, "Default margin %", 0, 100);
      parsedDefaultDepositPct = validateDecimal(defaultDepositPct, "Default deposit %", 0, 100);
      parsedDayRate = validateInt(dayRate, "Day rate");
      parsedHourlyRate = validateInt(hourlyRate, "Hourly rate");
      parsedCalloutFee = validateInt(calloutFee, "Call-out fee");
    } catch (validationError: any) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }

    // Validate defaultPaymentTerms length
    if (defaultPaymentTerms !== undefined && defaultPaymentTerms !== null && defaultPaymentTerms.length > 100) {
      return NextResponse.json(
        { error: "Default payment terms must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Validate and stringify tradeRates JSON
    let tradeRatesJson: string | null = null;
    if (tradeRates !== undefined && tradeRates !== null) {
      try {
        tradeRatesJson = JSON.stringify(tradeRates);
      } catch {
        return NextResponse.json(
          { error: "Invalid trade rates format" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {};
    if (gstRegistered !== undefined) updateData.gstRegistered = Boolean(gstRegistered);
    if (defaultMarginPct !== undefined) updateData.defaultMarginPct = parsedDefaultMarginPct;
    if (defaultDepositPct !== undefined) updateData.defaultDepositPct = parsedDefaultDepositPct;
    if (defaultPaymentTerms !== undefined) updateData.defaultPaymentTerms = defaultPaymentTerms?.trim() || null;
    if (tradeRates !== undefined) updateData.tradeRatesJson = tradeRatesJson;
    if (dayRate !== undefined) updateData.dayRate = parsedDayRate;
    if (hourlyRate !== undefined) updateData.hourlyRate = parsedHourlyRate;
    if (calloutFee !== undefined) updateData.calloutFee = parsedCalloutFee;

    // Check if user exists in Prisma
    const prisma = getPrisma();
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { email: user.email },
      data: updateData,
    });

    // Parse tradeRatesJson for response
    let responseTradeRates = null;
    if (updatedUser.tradeRatesJson) {
      try {
        responseTradeRates = JSON.parse(updatedUser.tradeRatesJson);
      } catch {
        responseTradeRates = null;
      }
    }

    return NextResponse.json({
      success: true,
      businessRates: {
        gstRegistered: updatedUser.gstRegistered,
        defaultMarginPct: updatedUser.defaultMarginPct ? Number(updatedUser.defaultMarginPct) : null,
        defaultDepositPct: updatedUser.defaultDepositPct ? Number(updatedUser.defaultDepositPct) : null,
        defaultPaymentTerms: updatedUser.defaultPaymentTerms ?? null,
        tradeRates: responseTradeRates,
        dayRate: updatedUser.dayRate ?? null,
        hourlyRate: updatedUser.hourlyRate ?? null,
        calloutFee: updatedUser.calloutFee ?? null,
      },
    });
  } catch (error) {
    console.error("Error updating business rates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

