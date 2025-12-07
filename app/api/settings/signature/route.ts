import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/settings/signature
 * Returns the current user's signature
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        signatureImage: true,
        signatureUpdatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      signatureImage: prismaUser?.signatureImage || null,
      signatureUpdatedAt: prismaUser?.signatureUpdatedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("Error fetching signature:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/signature
 * Saves or updates the current user's signature
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { dataUrl } = body;

    if (typeof dataUrl !== "string") {
      return NextResponse.json(
        { error: "Invalid request. dataUrl must be a string." },
        { status: 400 }
      );
    }

    // Basic size check (limit to ~500KB for data URLs)
    if (dataUrl.length > 500000) {
      return NextResponse.json(
        { error: "Signature image is too large. Please try again with a smaller image." },
        { status: 400 }
      );
    }

    // Validate it's a data URL
    if (!dataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image format. Please use a valid image data URL." },
        { status: 400 }
      );
    }

    // Update signature
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        signatureImage: dataUrl,
        signatureUpdatedAt: new Date(),
      },
      select: {
        signatureImage: true,
        signatureUpdatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      signatureImage: updatedUser.signatureImage,
      signatureUpdatedAt: updatedUser.signatureUpdatedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error("Error saving signature:", error);
    return NextResponse.json(
      { error: "Failed to save signature. Please try again." },
      { status: 500 }
    );
  }
}

