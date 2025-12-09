import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/job-templates
 * List all job templates for the current user
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

    // Only tradie/business users can access templates
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot access job templates" },
        { status: 403 }
      );
    }

    // Find user in Prisma by email
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!prismaUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch templates for this user
    const templates = await prisma.jobTemplate.findMany({
      where: { userId: prismaUser.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching job templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch job templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/job-templates
 * Create a new job template
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

    // Only tradie/business users can create templates
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot create job templates" },
        { status: 403 }
      );
    }

    // Find user in Prisma by email
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!prismaUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      tradeType,
      propertyType,
      addressLine1,
      suburb,
      state,
      postcode,
      notes,
      defaultClientNotes,
      defaultMaterialsNotes,
      includeSwms,
      includeVariationDoc,
      includeEotDoc,
      includeProgressClaim,
      includeHandoverChecklist,
      includeMaintenanceGuide,
    } = body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!tradeType || typeof tradeType !== "string" || tradeType.trim() === "") {
      return NextResponse.json(
        { error: "Trade type is required" },
        { status: 400 }
      );
    }

    if (!propertyType || typeof propertyType !== "string" || propertyType.trim() === "") {
      return NextResponse.json(
        { error: "Property type is required" },
        { status: 400 }
      );
    }

    // Create template
    const template = await prisma.jobTemplate.create({
      data: {
        userId: prismaUser.id,
        title: title.trim(),
        tradeType: tradeType.trim(),
        propertyType: propertyType.trim(),
        addressLine1: addressLine1?.trim() || null,
        suburb: suburb?.trim() || null,
        state: state?.trim() || null,
        postcode: postcode?.trim() || null,
        notes: notes?.trim() || null,
        defaultClientNotes: defaultClientNotes?.trim() || null,
        defaultMaterialsNotes: defaultMaterialsNotes?.trim() || null,
        includeSwms: includeSwms === true,
        includeVariationDoc: includeVariationDoc === true,
        includeEotDoc: includeEotDoc === true,
        includeProgressClaim: includeProgressClaim === true,
        includeHandoverChecklist: includeHandoverChecklist === true,
        includeMaintenanceGuide: includeMaintenanceGuide === true,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error creating job template:", error);
    return NextResponse.json(
      { error: "Failed to create job template" },
      { status: 500 }
    );
  }
}

