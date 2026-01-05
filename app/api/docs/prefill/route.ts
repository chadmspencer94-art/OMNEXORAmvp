/**
 * Document Prefill API Route
 * 
 * POST /api/docs/prefill
 * Generates a pre-filled document model from job data.
 * 
 * Requires DOC_ENGINE_V1 feature flag.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getJobById } from "@/lib/jobs";
import { getPrisma } from "@/lib/prisma";
import { featureFlags } from "@/lib/featureFlags";
import { loadTemplate } from "@/lib/docEngine/loadTemplate";
import { generateRenderModel } from "@/lib/docEngine/renderModel";
import type { DocType } from "@/lib/docEngine/types";
import {
  mapCommon,
  mapVariation,
  mapEot,
  mapInvoice,
  mapHandover,
  mapMaintenance,
} from "@/lib/docEngine/prefill";

export const dynamic = "force-dynamic";

/**
 * POST /api/docs/prefill
 * Generate pre-filled document model
 */
export async function POST(request: NextRequest) {
  if (!featureFlags.DOC_ENGINE_V1) {
    return NextResponse.json(
      { error: "Document engine V1 is not enabled" },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jobId, docType, includeMaterialsMarkup } = body; // Optional flag for including markup

    if (!jobId || !docType) {
      return NextResponse.json(
        { error: "jobId and docType are required" },
        { status: 400 }
      );
    }

    // Load job
    const job = await getJobById(jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Ensure job has materials pricing fields for invoice generation
    const jobWithMaterials: any = {
      ...job,
      materialsSubtotal: job.materialsSubtotal ?? null,
      materialsMarkupTotal: job.materialsMarkupTotal ?? null,
      materialsTotal: job.materialsTotal ?? null,
    };

    // Load company data from Prisma
    const prisma = getPrisma();
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        businessName: true,
        abn: true,
        serviceArea: true,
        email: true,
      },
    });

    const companyData = {
      legalName: prismaUser?.businessName || user.businessDetails?.businessName || "",
      abn: prismaUser?.abn || user.businessDetails?.abn || "",
      address: prismaUser?.serviceArea || user.businessDetails?.serviceArea || "",
      email: prismaUser?.email || user.email || "",
      phone: "",
    };

    // Load client data (if available)
    const clientData = {
      name: job.clientName || "",
      email: job.clientEmail || "",
      phone: "",
      billingAddress: job.address || "",
    };

    // Map common fields
    const commonData = mapCommon(jobWithMaterials, user, companyData, clientData);

    // Map doc-specific fields
    let prefillData: any = commonData;
    
    // Count existing documents for numbering
    const existingDocs = await prisma.documentDraft.findMany({
      where: { jobId },
      select: { docType: true },
    });
    
    const docTypeCount = existingDocs.filter((d) => d.docType === docType).length;

    switch (docType as DocType) {
      case "VARIATION_CHANGE_ORDER":
        prefillData = mapVariation(jobWithMaterials, commonData, docTypeCount);
        break;
      case "EXTENSION_OF_TIME":
        prefillData = mapEot(jobWithMaterials, commonData, docTypeCount);
        break;
      case "PROGRESS_CLAIM_TAX_INVOICE":
        prefillData = mapInvoice(jobWithMaterials, commonData, docTypeCount, includeMaterialsMarkup === true);
        break;
      case "HANDOVER_PRACTICAL_COMPLETION":
        prefillData = mapHandover(jobWithMaterials, commonData);
        break;
      case "MAINTENANCE_CARE_GUIDE":
        prefillData = mapMaintenance(jobWithMaterials, commonData);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported document type: ${docType}` },
          { status: 400 }
        );
    }

    // Load template
    const template = loadTemplate(docType as DocType);

    // Generate render model
    const model = generateRenderModel(template, prefillData);

    return NextResponse.json({
      success: true,
      model,
    });
  } catch (error: any) {
    console.error("[docs/prefill] Error:", error);
    
    // Provide more specific error messages
    let errorMessage = error?.message || "Failed to generate document";
    
    if (errorMessage.includes("Template not found")) {
      errorMessage = `Document template not found for type: ${docType}. Please contact support.`;
    } else if (errorMessage.includes("Template validation failed")) {
      errorMessage = `Document template validation failed. Please contact support.`;
    } else if (errorMessage.includes("Cannot read") || errorMessage.includes("undefined")) {
      errorMessage = "Failed to load document data. Please refresh and try again.";
    } else if (errorMessage.includes("Prisma") || errorMessage.includes("database")) {
      errorMessage = "Database error. Please try again or contact support.";
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

