import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * DELETE /api/materials/bulk
 * Bulk archive multiple materials
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot manage materials library" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ids, deleteAll } = body;

    const prisma = getPrisma();

    if (deleteAll === true) {
      // Archive all materials for this user
      const result = await (prisma as any).materialItem.updateMany({
        where: {
          userId: user.id,
          isArchived: false,
        },
        data: {
          isArchived: true,
        },
      });

      return NextResponse.json({
        success: true,
        archived: result.count,
        message: `Archived ${result.count} materials`,
      });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No material IDs provided" },
        { status: 400 }
      );
    }

    // Limit bulk operations to 100 items at a time
    if (ids.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 materials can be deleted at once" },
        { status: 400 }
      );
    }

    // Archive the selected materials (only if they belong to this user)
    const result = await (prisma as any).materialItem.updateMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
      data: {
        isArchived: true,
      },
    });

    return NextResponse.json({
      success: true,
      archived: result.count,
      message: `Archived ${result.count} materials`,
    });
  } catch (error) {
    console.error("Error bulk archiving materials:", error);
    return NextResponse.json(
      { error: "Failed to archive materials" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/materials/bulk
 * Bulk restore archived materials
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

    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot manage materials library" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ids, action } = body;

    if (action !== "restore") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No material IDs provided" },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    // Restore the selected materials (only if they belong to this user)
    const result = await (prisma as any).materialItem.updateMany({
      where: {
        id: { in: ids },
        userId: user.id,
        isArchived: true,
      },
      data: {
        isArchived: false,
      },
    });

    return NextResponse.json({
      success: true,
      restored: result.count,
      message: `Restored ${result.count} materials`,
    });
  } catch (error) {
    console.error("Error restoring materials:", error);
    return NextResponse.json(
      { error: "Failed to restore materials" },
      { status: 500 }
    );
  }
}
