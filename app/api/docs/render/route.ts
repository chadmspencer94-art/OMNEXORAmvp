import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { requireVerifiedEmail } from "@/lib/authChecks";
import { getJobById } from "@/lib/jobs";
import { loadTemplate } from "@/lib/docEngine/loadTemplate";
import { generateRenderModel } from "@/lib/docEngine/renderModel";
import { renderModelToPdf } from "@/lib/docEngine/renderPdf";
import type { DocType, DocumentAudience, IssuerProfile } from "@/lib/docEngine/types";
import { featureFlags } from "@/lib/featureFlags";
import { hasDocumentFeatureAccess } from "@/lib/documentAccess";
import { extractIssuerFromUser, validateIssuerForDoc } from "@/lib/docEngine/validateIssuer";

/**
 * POST /api/docs/render
 * 
 * Generates a PDF document from a template and job data.
 * 
 * Export Gates:
 * - Requires paid plan (hasDocumentFeatureAccess) for all PDF exports
 * - R3,R6: CLIENT audience requires document confirmation/approval
 * - AI warnings are shown for INTERNAL audience unless approved
 * - AI warnings are never shown for CLIENT audience (post-confirmation)
 * 
 * Requires DOC_ENGINE_V1 feature flag to be enabled.
 */
export async function POST(request: NextRequest) {
  // Check feature flag
  if (!featureFlags.DOC_ENGINE_V1) {
    return NextResponse.json(
      { error: "Document engine feature is not enabled" },
      { status: 403 }
    );
  }

  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Require verified email for document generation
    try {
      await requireVerifiedEmail(user);
    } catch (error) {
      return NextResponse.json(
        { error: "Email verification required. Please verify your email address to generate documents." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { jobId, docType, recordId, renderModel, audience = "INTERNAL" } = body;
    
    // Validate audience parameter
    const validAudiences: DocumentAudience[] = ["INTERNAL", "CLIENT"];
    if (!validAudiences.includes(audience)) {
      return NextResponse.json(
        { error: `Invalid audience. Must be one of: ${validAudiences.join(", ")}` },
        { status: 400 }
      );
    }

    if (!jobId || !docType) {
      return NextResponse.json(
        { error: "jobId and docType are required" },
        { status: 400 }
      );
    }

    // Validate docType
    const validDocTypes: DocType[] = [
      "SWMS",
      "PAYMENT_CLAIM_WA",
      "TOOLBOX_TALK",
      "VARIATION_CHANGE_ORDER",
      "EXTENSION_OF_TIME",
      "PROGRESS_CLAIM_TAX_INVOICE",
      "HANDOVER_PRACTICAL_COMPLETION",
      "MAINTENANCE_CARE_GUIDE",
    ];
    if (!validDocTypes.includes(docType)) {
      return NextResponse.json(
        { error: `Invalid docType. Must be one of: ${validDocTypes.join(", ")}` },
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

        // Verify user has access to this job
        if (user.role !== "admin" && job.userId !== user.id) {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 403 }
          );
        }

        // Get plan info for access control (for PDF export)
        let planTier = "FREE";
        let planStatus = "TRIAL";
        try {
          const { getPrisma } = await import("@/lib/prisma");
          const prisma = getPrisma();
          const prismaUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { planTier: true, planStatus: true },
          });
          if (prismaUser?.planTier) {
            planTier = prismaUser.planTier;
          }
          if (prismaUser?.planStatus) {
            planStatus = prismaUser.planStatus;
          }
        } catch (error) {
          console.warn("Failed to fetch plan info:", error);
        }

        // Check document feature access (for PDF export)
        if (!hasDocumentFeatureAccess(user, { planTier, planStatus, isAdmin: isAdmin(user) })) {
          return NextResponse.json(
            { error: "A paid plan or pilot program membership is required to download PDFs. Free users can create job packs only." },
            { status: 403 }
          );
        }

    // Load draft info and issuer data
    let isApproved = false;
    let draftStatus = "DRAFT";
    let issuedRecordId: string | null = null;
    let issuedAt: string | null = null;
    let issuerData: IssuerProfile | null = null;
    
    try {
      const { getPrisma } = await import("@/lib/prisma");
      const prisma = getPrisma();
      
      // Load draft with all lifecycle fields
      const draft = await prisma.documentDraft.findUnique({
        where: {
          jobId_docType: {
            jobId,
            docType,
          },
        },
        select: { 
          approved: true,
          status: true,
          issuedRecordId: true,
          issuedAt: true,
          issuerDataJson: true,
        },
      });
      
      if (draft) {
        isApproved = draft.approved ?? false;
        draftStatus = draft.status ?? "DRAFT";
        issuedRecordId = draft.issuedRecordId ?? null;
        issuedAt = draft.issuedAt?.toISOString() ?? null;
        
        // Parse issuer data if available
        if (draft.issuerDataJson) {
          try {
            issuerData = JSON.parse(draft.issuerDataJson);
          } catch {
            issuerData = null;
          }
        }
      }
      
      // R3,R6: For CLIENT audience, require document to be confirmed/approved first
      // This ensures AI warnings are only removed from client-facing exports after explicit user confirmation
      if (audience === "CLIENT" && !isApproved) {
        return NextResponse.json(
          {
            error: "Document must be confirmed before generating client-facing PDF. Please review and confirm the AI-generated content first.",
            code: "CONFIRMATION_REQUIRED",
            hint: "Confirm the document to remove AI warnings and enable client export.",
          },
          { status: 400 }
        );
      }

      // For CLIENT audience, require ISSUED status OR load issuer from user profile
      if (audience === "CLIENT") {
        if (draftStatus !== "ISSUED") {
          // If not issued, check if we can auto-issue (user has valid issuer profile)
          const prismaUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: {
              email: true,
              businessName: true,
              tradingName: true,
              abn: true,
              businessAddressLine1: true,
              businessAddressLine2: true,
              businessSuburb: true,
              businessState: true,
              businessPostcode: true,
              businessPhone: true,
              businessLogoUrl: true,
              gstRegistered: true,
              serviceArea: true,
            },
          });
          
          if (prismaUser) {
            const extractedIssuer = extractIssuerFromUser(prismaUser);
            const validation = validateIssuerForDoc(docType as DocType, extractedIssuer, false);
            
            if (validation.canIssue) {
              issuerData = extractedIssuer;
            } else {
              return NextResponse.json(
                { 
                  error: "Cannot generate client PDF: missing required business details",
                  validation: {
                    missingRequired: validation.missingRequired,
                    missingRecommended: validation.missingRecommended,
                  },
                  redirectTo: "/settings/business-profile",
                },
                { status: 400 }
              );
            }
          }
        }
      }
    } catch (error) {
      console.warn("[docs/render] Failed to check approval status:", error);
    }

    // Use provided renderModel if available (edited version), otherwise generate from template
    let finalRenderModel;
    
    if (renderModel) {
      // Use the edited render model from the client
      finalRenderModel = renderModel;
      // Ensure recordId matches
      if (recordId) {
        finalRenderModel.recordId = recordId;
      }
    } else {
      // Generate from template (legacy path)
      const template = loadTemplate(docType);

      // Prepare job data
      const jobData = {
        jobId: job.id,
        jobTitle: job.title || "",
        tradeType: job.tradeType || "",
        propertyType: job.propertyType || "",
        address: job.address || "",
        clientName: job.clientName || "",
        clientEmail: job.clientEmail || "",
        businessName: "", // Will be filled from user profile if available
        abn: "", // Will be filled from user profile if available
        createdAt: job.createdAt || new Date().toISOString(),
        notes: job.notes || "",
        // Add any template-specific data from job
        hazards: job.swmsText ? parseHazardsFromSwms(job.swmsText) : [],
        paymentItems: [], // Will be populated from job pricing if available
        attendees: [],
      };

      // Generate render model
      finalRenderModel = generateRenderModel(template, jobData);

      // Override record ID if provided
      if (recordId) {
        finalRenderModel.recordId = recordId;
      }
    }

    // Render to PDF with audience-based options
    const pdf = renderModelToPdf(finalRenderModel, {
      approved: isApproved,
      audience: audience as DocumentAudience,
      issuer: issuerData,
      issuedRecordId: issuedRecordId,
      issuedAt: issuedAt,
    });

    // Return PDF as blob
    const blob = pdf.getBlob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use issued record ID for filename if available (for client exports)
    const filenameId = (audience === "CLIENT" && issuedRecordId) 
      ? issuedRecordId 
      : finalRenderModel.recordId;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${docType.toLowerCase()}-${filenameId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[docs/render] Error generating PDF:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

/**
 * Helper to parse hazards from SWMS text (basic implementation)
 */
function parseHazardsFromSwms(swmsText: string): Array<Record<string, string>> {
  // This is a basic parser - in production, you'd want more sophisticated parsing
  // or store hazards in a structured format
  const hazards: Array<Record<string, string>> = [];
  
  // Try to extract hazard information from structured text
  // For now, return empty array - templates will handle empty state
  return hazards;
}

