import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Only non-client users can save client notes
    if (isClient(currentUser)) {
      return NextResponse.json(
        { error: "Clients cannot save client notes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { clientKey, note } = body;

    if (!clientKey || typeof clientKey !== "string") {
      return NextResponse.json(
        { error: "Client key is required" },
        { status: 400 }
      );
    }

    // Normalize client key (should be email, lowercase)
    const normalizedKey = clientKey.toLowerCase().trim();

    // Upsert the note (only one note per user/clientKey)
    const prisma = getPrisma();
    await prisma.clientNote.upsert({
      where: {
        userId_clientKey: {
          userId: currentUser.id,
          clientKey: normalizedKey,
        },
      },
      update: {
        note: note || "",
        updatedAt: new Date(),
      },
      create: {
        userId: currentUser.id,
        clientKey: normalizedKey,
        note: note || "",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving client note:", error);
    return NextResponse.json(
      { error: "Failed to save note" },
      { status: 500 }
    );
  }
}

