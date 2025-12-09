import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/rate-templates/[id]
 * Update a rate template
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;
    const body = await request.json();

    // Check ownership (unless admin)
    const existing = await (prisma as any).rateTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Rate template not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Validate name if provided
    if (body.name !== undefined && (!body.name || !body.name.trim())) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    // Validate numeric fields
    const numericFields = [
      "hourlyRate",
      "helperHourlyRate",
      "dayRate",
      "calloutFee",
      "minCharge",
      "ratePerM2Interior",
      "ratePerM2Exterior",
      "ratePerLmTrim",
    ];

    for (const field of numericFields) {
      if (body[field] !== undefined && body[field] != null) {
        if (typeof body[field] !== "number" || body[field] < 0) {
          return NextResponse.json(
            { error: `${field} must be a number >= 0` },
            { status: 400 }
          );
        }
      }
    }

    if (body.materialMarkupPercent !== undefined && body.materialMarkupPercent != null) {
      if (typeof body.materialMarkupPercent !== "number" || body.materialMarkupPercent < 0) {
        return NextResponse.json(
          { error: "materialMarkupPercent must be a number >= 0" },
          { status: 400 }
        );
      }
    }

    // If setting as default, clear other defaults
    if (body.isDefault === true) {
      await (prisma as any).rateTemplate.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          id: { not: id }, // exclude current template
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Build update data
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.tradeType !== undefined) updateData.tradeType = body.tradeType?.trim() || null;
    if (body.propertyType !== undefined) updateData.propertyType = body.propertyType?.trim() || null;
    if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate != null ? Math.round(body.hourlyRate) : null;
    if (body.helperHourlyRate !== undefined) updateData.helperHourlyRate = body.helperHourlyRate != null ? Math.round(body.helperHourlyRate) : null;
    if (body.dayRate !== undefined) updateData.dayRate = body.dayRate != null ? Math.round(body.dayRate) : null;
    if (body.calloutFee !== undefined) updateData.calloutFee = body.calloutFee != null ? Math.round(body.calloutFee) : null;
    if (body.minCharge !== undefined) updateData.minCharge = body.minCharge != null ? Math.round(body.minCharge) : null;
    if (body.ratePerM2Interior !== undefined) updateData.ratePerM2Interior = body.ratePerM2Interior != null ? Math.round(body.ratePerM2Interior) : null;
    if (body.ratePerM2Exterior !== undefined) updateData.ratePerM2Exterior = body.ratePerM2Exterior != null ? Math.round(body.ratePerM2Exterior) : null;
    if (body.ratePerLmTrim !== undefined) updateData.ratePerLmTrim = body.ratePerLmTrim != null ? Math.round(body.ratePerLmTrim) : null;
    if (body.materialMarkupPercent !== undefined) updateData.materialMarkupPercent = body.materialMarkupPercent != null ? body.materialMarkupPercent : null;
    if (body.isDefault !== undefined) updateData.isDefault = body.isDefault === true;

    const template = await (prisma as any).rateTemplate.update({
      where: { id },
      data: updateData,
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
    console.error("Error updating rate template:", error);
    return NextResponse.json(
      { error: "Failed to update rate template" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rate-templates/[id]
 * Delete a rate template
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;

    // Check ownership (unless admin)
    const existing = await (prisma as any).rateTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Rate template not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Delete the template (safe to delete - jobs keep their own rate copies)
    await (prisma as any).rateTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting rate template:", error);
    return NextResponse.json(
      { error: "Failed to delete rate template" },
      { status: 500 }
    );
  }
}

