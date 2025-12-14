/**
 * Job Document Signature helpers
 * 
 * Manages client signatures for job documents (QUOTE, VARIATION, EOT, HANDOVER)
 */

import { getPrisma } from "./prisma";

export type JobDocumentType = "QUOTE" | "VARIATION" | "EOT" | "HANDOVER";

export interface JobDocumentSignature {
  id: string;
  jobId: string;
  signedById: string | null;
  signedName: string;
  role: string;
  docType: string;
  docKey: string | null;
  signatureImage: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  signedAt: Date;
  createdAt: Date;
}

export interface CreateJobDocumentSignatureOptions {
  jobId: string;
  userId?: string | null;
  role: string; // "CLIENT"
  docType: JobDocumentType;
  docKey?: string | null;
  signedName: string;
  signatureImage?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Creates a new job document signature
 * Deletes any previous signature for the same (jobId, docType, docKey) to ensure "last signature wins"
 */
export async function createJobDocumentSignature(
  options: CreateJobDocumentSignatureOptions
): Promise<JobDocumentSignature> {
  const {
    jobId,
    userId,
    role,
    docType,
    docKey,
    signedName,
    signatureImage,
    ipAddress,
    userAgent,
  } = options;

  const prisma = getPrisma();
  // Delete any existing signature for this document (last signature wins)
  await prisma.jobDocumentSignature.deleteMany({
    where: {
      jobId,
      docType,
      docKey: docKey || null,
    },
  });

  // Create new signature
  const signature = await prisma.jobDocumentSignature.create({
    data: {
      jobId,
      signedById: userId || null,
      role,
      docType,
      docKey: docKey || null,
      signedName,
      signatureImage: signatureImage || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });

  return signature;
}

/**
 * Gets the latest signature for a specific job document
 */
export async function getJobDocumentSignature(
  jobId: string,
  docType: JobDocumentType,
  docKey?: string | null
): Promise<JobDocumentSignature | null> {
  const prisma = getPrisma();
  const signature = await prisma.jobDocumentSignature.findFirst({
    where: {
      jobId,
      docType,
      docKey: docKey || null,
    },
    orderBy: {
      signedAt: "desc",
    },
  });

  return signature;
}

/**
 * Gets all signatures for a job (for trade view)
 */
export async function getJobDocumentSignatures(
  jobId: string
): Promise<JobDocumentSignature[]> {
  const prisma = getPrisma();
  const signatures = await prisma.jobDocumentSignature.findMany({
    where: {
      jobId,
    },
    orderBy: {
      signedAt: "desc",
    },
  });

  return signatures;
}

