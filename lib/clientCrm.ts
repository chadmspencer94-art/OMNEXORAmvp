/**
 * Client CRM helper functions
 * Handles finding or creating Client records for job linking
 */

import { getPrisma } from "@/lib/prisma";

export interface FindOrCreateClientArgs {
  ownerUserId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
}

/**
 * Finds or creates a Client record for a tradie/business user.
 * Matches on ownerId + email (if provided), or ownerId + name (if no email).
 * Updates basic details if client exists but info has changed.
 */
export async function findOrCreateClientForJob(
  args: FindOrCreateClientArgs
): Promise<{ clientId: string }> {
  const prisma = getPrisma();
  const { ownerUserId, name, email, phone, company, suburb, state, postcode } = args;

  // Normalize email for matching (lowercase, trim)
  const normalizedEmail = email?.trim().toLowerCase() || null;

  // Try to find existing client
  let client = null;

  if (normalizedEmail) {
    // Match by owner + email (most reliable)
    client = await prisma.client.findFirst({
      where: {
        ownerId: ownerUserId,
        email: normalizedEmail,
      },
    });
  } else {
    // If no email, match by owner + name (less reliable but better than duplicates)
    client = await prisma.client.findFirst({
      where: {
        ownerId: ownerUserId,
        name: name.trim(),
        email: null, // Only match if email is also null
      },
    });
  }

  if (client) {
    // Update client details if they've changed (phone, suburb, etc.)
    const needsUpdate =
      (phone && client.phone !== phone) ||
      (company && client.company !== company) ||
      (suburb && client.suburb !== suburb) ||
      (state && client.state !== state) ||
      (postcode && client.postcode !== postcode) ||
      (normalizedEmail && client.email !== normalizedEmail);

    if (needsUpdate) {
      client = await prisma.client.update({
        where: { id: client.id },
        data: {
          name: name.trim(), // Update name in case it changed
          email: normalizedEmail,
          phone: phone || client.phone,
          company: company || client.company,
          suburb: suburb || client.suburb,
          state: state || client.state,
          postcode: postcode || client.postcode,
        },
      });
    }

    return { clientId: client.id };
  }

  // Create new client
  const newClient = await prisma.client.create({
    data: {
      ownerId: ownerUserId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      company: company?.trim() || null,
      suburb: suburb?.trim() || null,
      state: state?.trim() || null,
      postcode: postcode?.trim() || null,
    },
  });

  return { clientId: newClient.id };
}

/**
 * Gets all clients for a tradie/business user
 */
export async function getClientsForUser(
  ownerUserId: string,
  options?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }
) {
  const { search, page = 1, pageSize = 20 } = options || {};

  const where: any = {
    ownerId: ownerUserId,
  };

  // Add search filter if provided
  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { email: { contains: searchTerm, mode: "insensitive" } },
      { company: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const prisma = getPrisma();
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: [
        { updatedAt: "desc" }, // Most recently updated first
        { createdAt: "desc" },
      ],
      skip,
      take,
    }),
    prisma.client.count({ where }),
  ]);

  return {
    clients,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Gets a single client by ID, ensuring it belongs to the owner
 */
export async function getClientById(
  clientId: string,
  ownerUserId: string
) {
  const prisma = getPrisma();
  return await prisma.client.findFirst({
    where: {
      id: clientId,
      ownerId: ownerUserId,
    },
  });
}

/**
 * Updates a client's details
 */
export async function updateClient(
  clientId: string,
  ownerUserId: string,
  data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    suburb?: string | null;
    state?: string | null;
    postcode?: string | null;
    tags?: string | null;
    notes?: string | null;
  }
) {
  // Normalize email if provided
  const normalizedEmail = data.email?.trim().toLowerCase() || null;

  const prisma = getPrisma();
  return await prisma.client.update({
    where: {
      id: clientId,
      ownerId: ownerUserId, // Ensure owner matches
    },
    data: {
      ...data,
      email: normalizedEmail,
      name: data.name?.trim(),
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      suburb: data.suburb?.trim() || null,
      state: data.state?.trim() || null,
      postcode: data.postcode?.trim() || null,
      tags: data.tags?.trim() || null,
      notes: data.notes?.trim() || null,
    },
  });
}

/**
 * Gets all jobs for a client (by clientId or email match)
 */
export async function getJobsForClient(
  clientId: string,
  clientEmail: string | null,
  ownerUserId: string
) {
  const { kv } = await import("./kv");
  const { getJobsForUser } = await import("./jobs");
  
  // Get all jobs for the owner
  const allJobs = await getJobsForUser(ownerUserId, false);
  
  // Filter jobs that match this client
  const clientJobs = allJobs.filter((job) => {
    // Match by clientId (newer jobs)
    if (job.clientId === clientId) {
      return true;
    }
    
    // Match by email (older jobs without clientId)
    if (clientEmail && job.clientEmail?.toLowerCase() === clientEmail.toLowerCase()) {
      return true;
    }
    
    return false;
  });
  
  // Sort by createdAt descending
  return clientJobs.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

