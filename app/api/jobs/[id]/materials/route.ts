import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { prisma } from "@/lib/prisma";
import { recalcJobMaterialsTotals } from "@/lib/materials";

/**
 * GET /api/jobs/[id]/materials
 * List JobMaterial line items for a job
 */
export async function GET(
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
        { error: "Clients cannot view job materials" },
        { status: 403 }
      );
    }

    const { id: jobId } = await context.params;

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

    const jobMaterials = await prisma.jobMaterial.findMany({
      where: {
        jobId,
        userId: user.id,
      },
      orderBy: { createdAt: "asc" },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json({
      materials: jobMaterials.map((m: any) => ({
        id: m.id,
        materialItemId: m.materialItemId,
        name: m.name,
        unitLabel: m.unitLabel,
        unitCost: m.unitCost ? Number(m.unitCost) : null,
        quantity: m.quantity,
        markupPercent: m.markupPercent ? Number(m.markupPercent) : null,
        notes: m.notes,
        lineTotal: m.lineTotal ? Number(m.lineTotal) : null,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching job materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch job materials" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs/[id]/materials
 * Add a new JobMaterial line item
 */
export async function POST(
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
        { error: "Clients cannot manage job materials" },
        { status: 403 }
      );
    }

    const { id: jobId } = await context.params;
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

    const {
      materialItemId,
      name,
      unitLabel,
      unitCost,
      quantity,
      markupPercent,
      notes,
    } = body;

    if (!name || !unitLabel || quantity == null) {
      return NextResponse.json(
        { error: "Name, unitLabel, and quantity are required" },
        { status: 400 }
      );
    }

    // If materialItemId is provided, optionally fetch defaults
    let finalUnitCost = unitCost != null ? unitCost : null;
    if (materialItemId && finalUnitCost == null) {
      const materialItem = await (prisma as any).materialItem.findUnique({
        where: { id: materialItemId },
      });
      if (materialItem && materialItem.userId === user.id) {
        finalUnitCost = materialItem.unitCost ? Number(materialItem.unitCost) : null;
      }
    }

    // Calculate line total
    const baseCost = (finalUnitCost || 0) * (quantity || 0);
    const markupAmount = baseCost * ((markupPercent || 0) / 100);
    const lineTotal = baseCost + markupAmount;

    const jobMaterial = await (prisma as any).jobMaterial.create({
      data: {
        jobId,
        userId: user.id,
        materialItemId: materialItemId || null,
        name: name.trim(),
        unitLabel: unitLabel.trim(),
        unitCost: finalUnitCost,
        quantity: quantity,
        markupPercent: markupPercent != null ? markupPercent : null,
        notes: notes?.trim() || null,
        lineTotal: lineTotal,
      },
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
    console.error("Error creating job material:", error);
    return NextResponse.json(
      { error: "Failed to create job material" },
      { status: 500 }
    );
  }
}
