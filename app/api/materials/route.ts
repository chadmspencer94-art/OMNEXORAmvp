import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/materials
 * List current user's materials library (with optional search)
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

    // Block clients from accessing materials library
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot manage materials library" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const includeArchived = searchParams.get("includeArchived") === "true";

    const where: any = {
      userId: user.id,
    };

    if (!includeArchived) {
      where.isArchived = false;
    }

    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { supplier: { contains: search, mode: "insensitive" } },
      ];
    }

    const materials = await (prisma as any).materialItem.findMany({
      where,
      orderBy: [
        { isArchived: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({
      materials: materials.map((m: any) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        supplier: m.supplier,
        unitLabel: m.unitLabel,
        unitCost: m.unitCost ? Number(m.unitCost) : null,
        notes: m.notes,
        isArchived: m.isArchived,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/materials
 * Create a new MaterialItem
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
        { error: "Clients cannot manage materials library" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, category, supplier, unitLabel, unitCost, notes } = body;

    if (!name || !unitLabel) {
      return NextResponse.json(
        { error: "Name and unitLabel are required" },
        { status: 400 }
      );
    }

    const material = await (prisma as any).materialItem.create({
      data: {
        userId: user.id,
        name: name.trim(),
        category: category?.trim() || null,
        supplier: supplier?.trim() || null,
        unitLabel: unitLabel.trim(),
        unitCost: unitCost != null ? unitCost : null,
        notes: notes?.trim() || null,
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
    console.error("Error creating material:", error);
    return NextResponse.json(
      { error: "Failed to create material" },
      { status: 500 }
    );
  }
}

