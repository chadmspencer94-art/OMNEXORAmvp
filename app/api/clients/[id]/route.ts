import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient, isAdmin } from "@/lib/auth";
import { getClientById, updateClient } from "@/lib/clientCrm";

/**
 * PATCH /api/clients/[id]
 * Update a client's details (notes, tags, contact info)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only tradie/business/admin can update clients
    if (isClient(user)) {
      return NextResponse.json(
        { error: "Forbidden - client accounts cannot access CRM" },
        { status: 403 }
      );
    }

    const { id: clientId } = await context.params;
    const body = await request.json();

    const {
      name,
      email,
      phone,
      company,
      suburb,
      state,
      postcode,
      tags,
      notes,
    } = body;

    // Load client to ensure it exists and belongs to user
    const client = await getClientById(clientId, user.id);
    if (!client) {
      // Admin can update any client
      if (isAdmin(user)) {
        const { getPrisma } = await import("@/lib/prisma"); const prisma = getPrisma();
        const adminClient = await prisma.client.findUnique({
          where: { id: clientId },
        });
        if (!adminClient) {
          return NextResponse.json(
            { error: "Client not found" },
            { status: 404 }
          );
        }
        // Admin can update - use adminClient.ownerId
        const updated = await updateClient(clientId, adminClient.ownerId, {
          name,
          email,
          phone,
          company,
          suburb,
          state,
          postcode,
          tags,
          notes,
        });
        return NextResponse.json({ client: updated });
      }
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Update client
    const updated = await updateClient(clientId, user.id, {
      name,
      email,
      phone,
      company,
      suburb,
      state,
      postcode,
      tags,
      notes,
    });

    return NextResponse.json({ client: updated });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

