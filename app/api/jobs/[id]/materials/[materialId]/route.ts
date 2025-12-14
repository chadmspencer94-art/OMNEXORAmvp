import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { getPrisma } from "@/lib/prisma";
import { recalcJobMaterialsTotals } from "@/lib/materials";

/**
 * PATCH /api/jobs/[id]/materials/[materialId]
 * Update a JobMaterial line item
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; materialId: string }> }
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
        { error: "Clients cannot manage job materials" },
        { status: 403 }
      );
    }

    const { id: jobId, materialId } = await context.params;
    const body = await request.json();

    // Check job ownership
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Check material ownership
    const prisma = getPrisma();
    const existing = await (prisma as any).jobMaterial.findUnique({
      where: { id: materialId },
    });

    if (!existing || existing.jobId !== jobId || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Job material not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.unitLabel !== undefined) updateData.unitLabel = body.unitLabel.trim();
    if (body.unitCost !== undefined) updateData.unitCost = body.unitCost != null ? body.unitCost : null;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.markupPercent !== undefined) updateData.markupPercent = body.markupPercent != null ? body.markupPercent : null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;

    // Recalculate line total
    const finalUnitCost = updateData.unitCost !== undefined ? (updateData.unitCost || 0) : (existing.unitCost ? Number(existing.unitCost) : 0);
    const finalQuantity = updateData.quantity !== undefined ? updateData.quantity : existing.quantity;
    const finalMarkupPercent = updateData.markupPercent !== undefined ? (updateData.markupPercent || 0) : (existing.markupPercent ? Number(existing.markupPercent) : 0);

    const baseCost = finalUnitCost * finalQuantity;
    const markupAmount = baseCost * (finalMarkupPercent / 100);
    updateData.lineTotal = baseCost + markupAmount;

    const jobMaterial = await (prisma as any).jobMaterial.update({
      where: { id: materialId },
      data: updateData,
    });

    // Recalculate job totals
    const totals = await recalcJobMaterialsTotals(jobId, user.id);

    return NextResponse.json({
      material: {
        id: jobMaterial.id,
        materialItemId: jobMaterial.materialItemId,
        name: jobMaterial.name,
        unitLabel: jobMaterial.unitLabel,
        unitCost: jobMaterial.unitCost ? Number(jobMaterial.unitCost) : null,
        quantity: jobMaterial.quantity,
        markupPercent: jobMaterial.markupPercent ? Number(jobMaterial.markupPercent) : null,
        notes: jobMaterial.notes,
        lineTotal: jobMaterial.lineTotal ? Number(jobMaterial.lineTotal) : null,
        createdAt: jobMaterial.createdAt.toISOString(),
        updatedAt: jobMaterial.updatedAt.toISOString(),
      },
      totals,
    });
  } catch (error) {
    console.error("Error updating job material:", error);
    return NextResponse.json(
      { error: "Failed to update job material" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id]/materials/[materialId]
 * Remove a JobMaterial line item
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; materialId: string }> }
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
        { error: "Clients cannot manage job materials" },
        { status: 403 }
      );
    }

    const { id: jobId, materialId } = await context.params;

    // Check job ownership
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Check material ownership
    const prisma = getPrisma();
    const existing = await (prisma as any).jobMaterial.findUnique({
      where: { id: materialId },
    });

    if (!existing || existing.jobId !== jobId || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Job material not found" },
        { status: 404 }
      );
    }

    await (prisma as any).jobMaterial.delete({
      where: { id: materialId },
    });

    // Recalculate job totals
    const totals = await recalcJobMaterialsTotals(jobId, user.id);

    return NextResponse.json({
      success: true,
      totals,
    });
  } catch (error) {
    console.error("Error deleting job material:", error);
    return NextResponse.json(
      { error: "Failed to delete job material" },
      { status: 500 }
    );
  }
}

