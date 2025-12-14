import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient, isAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * PATCH /api/materials/[id]
 * Update a MaterialItem
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
        { error: "Clients cannot manage materials library" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    // Check ownership (unless admin)
    const prisma = getPrisma();
    const existing = await (prisma as any).materialItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const material = await (prisma as any).materialItem.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        category: body.category !== undefined ? (body.category?.trim() || null) : undefined,
        supplier: body.supplier !== undefined ? (body.supplier?.trim() || null) : undefined,
        unitLabel: body.unitLabel !== undefined ? body.unitLabel.trim() : undefined,
        unitCost: body.unitCost !== undefined ? (body.unitCost != null ? body.unitCost : null) : undefined,
        notes: body.notes !== undefined ? (body.notes?.trim() || null) : undefined,
        isArchived: body.isArchived !== undefined ? body.isArchived : undefined,
      },
    });

    return NextResponse.json({
      material: {
        id: material.id,
        name: material.name,
        category: material.category,
        supplier: material.supplier,
        unitLabel: material.unitLabel,
        unitCost: material.unitCost ? Number(material.unitCost) : null,
        notes: material.notes,
        isArchived: material.isArchived,
        createdAt: material.createdAt.toISOString(),
        updatedAt: material.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      { error: "Failed to update material" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/materials/[id]
 * Soft delete a MaterialItem (set isArchived = true)
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
        { error: "Clients cannot manage materials library" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Check ownership (unless admin)
    const prisma = getPrisma();
    const existing = await (prisma as any).materialItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Soft delete (set isArchived = true)
    const material = await (prisma as any).materialItem.update({
      where: { id },
      data: { isArchived: true },
    });

    return NextResponse.json({
      success: true,
      material: {
        id: material.id,
        isArchived: material.isArchived,
      },
    });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 }
    );
  }
}

