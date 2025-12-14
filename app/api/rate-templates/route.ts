import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * GET /api/rate-templates
 * List current user's rate templates
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Block clients
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot manage rate templates" },
        { status: 403 }
      );
    }

    const prisma = getPrisma();
    const templates = await (prisma as any).rateTemplate.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({
      templates: templates.map((t: any) => ({
        id: t.id,
        name: t.name,
        tradeType: t.tradeType,
        propertyType: t.propertyType,
        hourlyRate: t.hourlyRate,
        helperHourlyRate: t.helperHourlyRate,
        dayRate: t.dayRate,
        calloutFee: t.calloutFee,
        minCharge: t.minCharge,
        ratePerM2Interior: t.ratePerM2Interior,
        ratePerM2Exterior: t.ratePerM2Exterior,
        ratePerLmTrim: t.ratePerLmTrim,
        materialMarkupPercent: t.materialMarkupPercent,
        isDefault: t.isDefault,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching rate templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch rate templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rate-templates
 * Create a new rate template
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

    // Block clients
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot manage rate templates" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      tradeType,
      propertyType,
      hourlyRate,
      helperHourlyRate,
      dayRate,
      calloutFee,
      minCharge,
      ratePerM2Interior,
      ratePerM2Exterior,
      ratePerLmTrim,
      materialMarkupPercent,
      isDefault,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    // Validate numeric fields
    const numericFields = {
      hourlyRate,
      helperHourlyRate,
      dayRate,
      calloutFee,
      minCharge,
      ratePerM2Interior,
      ratePerM2Exterior,
      ratePerLmTrim,
    };

    for (const [field, value] of Object.entries(numericFields)) {
      if (value != null && (typeof value !== "number" || value < 0)) {
        return NextResponse.json(
          { error: `${field} must be a number >= 0` },
          { status: 400 }
        );
      }
    }

    if (materialMarkupPercent != null && (typeof materialMarkupPercent !== "number" || materialMarkupPercent < 0)) {
      return NextResponse.json(
        { error: "materialMarkupPercent must be a number >= 0" },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    // If setting as default, clear other defaults
    if (isDefault === true) {
      await (prisma as any).rateTemplate.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await (prisma as any).rateTemplate.create({
      data: {
        userId: user.id,
        name: name.trim(),
        tradeType: tradeType?.trim() || null,
        propertyType: propertyType?.trim() || null,
        hourlyRate: hourlyRate != null ? Math.round(hourlyRate) : null,
        helperHourlyRate: helperHourlyRate != null ? Math.round(helperHourlyRate) : null,
        dayRate: dayRate != null ? Math.round(dayRate) : null,
        calloutFee: calloutFee != null ? Math.round(calloutFee) : null,
        minCharge: minCharge != null ? Math.round(minCharge) : null,
        ratePerM2Interior: ratePerM2Interior != null ? Math.round(ratePerM2Interior) : null,
        ratePerM2Exterior: ratePerM2Exterior != null ? Math.round(ratePerM2Exterior) : null,
        ratePerLmTrim: ratePerLmTrim != null ? Math.round(ratePerLmTrim) : null,
        materialMarkupPercent: materialMarkupPercent != null ? materialMarkupPercent : null,
        isDefault: isDefault === true,
      },
    });

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        tradeType: template.tradeType,
        propertyType: template.propertyType,
        hourlyRate: template.hourlyRate,
        helperHourlyRate: template.helperHourlyRate,
        dayRate: template.dayRate,
        calloutFee: template.calloutFee,
        minCharge: template.minCharge,
        ratePerM2Interior: template.ratePerM2Interior,
        ratePerM2Exterior: template.ratePerM2Exterior,
        ratePerLmTrim: template.ratePerLmTrim,
        materialMarkupPercent: template.materialMarkupPercent,
        isDefault: template.isDefault,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating rate template:", error);
    return NextResponse.json(
      { error: "Failed to create rate template" },
      { status: 500 }
    );
  }
}

