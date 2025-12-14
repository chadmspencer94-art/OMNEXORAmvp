import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

/**
 * PUT /api/job-templates/[id]
 * Update an existing job template
 */
export async function PUT(
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

    // Only tradie/business users can update templates
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot update job templates" },
        { status: 403 }
      );
    }

    // Find user in Prisma by email
    const prisma = getPrisma();
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!prismaUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { id } = await context.params;

    // Verify template exists and belongs to user
    const existingTemplate = await prisma.jobTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (existingTemplate.userId !== prismaUser.id) {
      return NextResponse.json(
        { error: "Not authorized to update this template" },
        { status: 403 }
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

    // Build update data (only include fields that are provided)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (tradeType !== undefined) updateData.tradeType = tradeType.trim();
    if (propertyType !== undefined) updateData.propertyType = propertyType.trim();
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1?.trim() || null;
    if (suburb !== undefined) updateData.suburb = suburb?.trim() || null;
    if (state !== undefined) updateData.state = state?.trim() || null;
    if (postcode !== undefined) updateData.postcode = postcode?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (defaultClientNotes !== undefined) updateData.defaultClientNotes = defaultClientNotes?.trim() || null;
    if (defaultMaterialsNotes !== undefined) updateData.defaultMaterialsNotes = defaultMaterialsNotes?.trim() || null;
    if (includeSwms !== undefined) updateData.includeSwms = includeSwms === true;
    if (includeVariationDoc !== undefined) updateData.includeVariationDoc = includeVariationDoc === true;
    if (includeEotDoc !== undefined) updateData.includeEotDoc = includeEotDoc === true;
    if (includeProgressClaim !== undefined) updateData.includeProgressClaim = includeProgressClaim === true;
    if (includeHandoverChecklist !== undefined) updateData.includeHandoverChecklist = includeHandoverChecklist === true;
    if (includeMaintenanceGuide !== undefined) updateData.includeMaintenanceGuide = includeMaintenanceGuide === true;

    // Update template
    const template = await prisma.jobTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error updating job template:", error);
    return NextResponse.json(
      { error: "Failed to update job template" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/job-templates/[id]
 * Delete a job template
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

    // Only tradie/business users can delete templates
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot delete job templates" },
        { status: 403 }
      );
    }

    // Find user in Prisma by email
    const prisma = getPrisma();
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!prismaUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { id } = await context.params;

    // Verify template exists and belongs to user
    const existingTemplate = await prisma.jobTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (existingTemplate.userId !== prismaUser.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this template" },
        { status: 403 }
      );
    }

    // Delete template
    await prisma.jobTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job template:", error);
    return NextResponse.json(
      { error: "Failed to delete job template" },
      { status: 500 }
    );
  }
}

