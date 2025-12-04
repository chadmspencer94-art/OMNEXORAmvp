/**
 * Email sending utilities for OMNEXORA
 * 
 * Uses Resend for production email delivery.
 */

import { Resend } from "resend";

// Initialize Resend with API key (if available)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Default sender address - use EMAIL_FROM env var or fallback to Resend's sandbox
const DEFAULT_FROM = process.env.EMAIL_FROM || "OMNEXORA <onboarding@resend.dev>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Result type for sendJobPackEmail
 */
export interface SendEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Sends a job pack email to a client via Resend.
 * 
 * If RESEND_API_KEY is not set, logs a warning and simulates success (for dev).
 * Returns a result object indicating success or failure with error details.
 */
export async function sendJobPackEmail(options: {
  jobId?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const { jobId, to, subject, html, text } = options;
  const logPrefix = jobId ? `[Job ${jobId}]` : "[JobPack]";

  console.log(`EMAIL_JOBPACK_ATTEMPT: ${logPrefix} Sending to ${to}...`);
  console.log(`EMAIL_JOBPACK_ATTEMPT: ${logPrefix} From: ${DEFAULT_FROM}`);
  console.log(`EMAIL_JOBPACK_ATTEMPT: ${logPrefix} Subject: ${subject}`);

  // If Resend is not configured, log warning and simulate success
  if (!resend) {
    console.warn(`EMAIL_JOBPACK_WARNING: ${logPrefix} RESEND_API_KEY not set, skipping real email send`);
    console.log(`EMAIL_JOBPACK_SIMULATED: ${logPrefix} Would have sent to ${to}`);
    console.log(`EMAIL_JOBPACK_SIMULATED: ${logPrefix} HTML length: ${html.length} chars`);
    if (text) {
      console.log(`EMAIL_JOBPACK_SIMULATED: ${logPrefix} Text length: ${text.length} chars`);
    }
    // Return success in dev mode so the flow continues
    return { success: true };
  }

  try {
    // Send real email via Resend
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error(`EMAIL_JOBPACK_ERROR: ${logPrefix} Resend API error:`, error);
      return { 
        success: false, 
        error: error.message || "Resend API returned an error" 
      };
    }

    console.log(`EMAIL_JOBPACK_SUCCESS: ${logPrefix} Email sent to ${to}`);
    console.log(`EMAIL_JOBPACK_SUCCESS: ${logPrefix} Resend ID: ${data?.id || "unknown"}`);
    return { success: true };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`EMAIL_JOBPACK_ERROR: ${logPrefix} Exception:`, errorMessage);
    console.error(`EMAIL_JOBPACK_ERROR: ${logPrefix} Full error:`, err);
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * Builds HTML email content for a job pack
 */
export function buildJobPackEmailHtml({
  clientName,
  title,
  address,
  summary,
  scopeOfWork,
  inclusions,
  exclusions,
  priceRange,
  clientNotes,
  aiMaterials,
  materialsOverrideText,
  materialsAreRoughEstimate,
  customMessage,
}: {
  clientName?: string;
  title: string;
  address?: string;
  summary?: string;
  scopeOfWork?: string;
  inclusions?: string;
  exclusions?: string;
  priceRange?: string;
  clientNotes?: string;
  aiMaterials?: string;
  materialsOverrideText?: string | null;
  materialsAreRoughEstimate?: boolean;
  customMessage?: string;
}): string {
  const greeting = clientName ? `Hi ${clientName},` : "Hi,";

  // Build scope as numbered list
  const scopeLines = scopeOfWork?.split("\n").filter((line) => line.trim()) || [];
  const scopeHtml = scopeLines.length > 0
    ? `<ol style="margin: 0; padding-left: 20px;">${scopeLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ol>`
    : "";

  // Build inclusions as bullet list
  const inclusionLines = inclusions?.split("\n").filter((line) => line.trim()) || [];
  const inclusionsHtml = inclusionLines.length > 0
    ? `<ul style="margin: 0; padding-left: 20px;">${inclusionLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : "";

  // Build exclusions as bullet list
  const exclusionLines = exclusions?.split("\n").filter((line) => line.trim()) || [];
  const exclusionsHtml = exclusionLines.length > 0
    ? `<ul style="margin: 0; padding-left: 20px;">${exclusionLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : "";

  const sections: string[] = [];

  sections.push(`
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <p style="font-size: 16px; margin-bottom: 16px;">${escapeHtml(greeting)}</p>
      ${customMessage ? `<p style="font-size: 16px; margin-bottom: 16px;">${escapeHtml(customMessage)}</p>` : ""}
      <p style="font-size: 16px; margin-bottom: 24px;">Please find below your painting quote for the following job:</p>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0; color: #0f172a;">${escapeHtml(title)}</h2>
        ${address ? `<p style="font-size: 14px; color: #64748b; margin: 0;">${escapeHtml(address)}</p>` : ""}
      </div>
  `);

  if (summary) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0;">Summary</h3>
        <p style="font-size: 16px; margin: 0; line-height: 1.5;">${escapeHtml(summary)}</p>
      </div>
    `);
  }

  if (scopeHtml) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0;">Scope of Work</h3>
        ${scopeHtml}
      </div>
    `);
  }

  if (inclusionsHtml) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0;">What's Included</h3>
        ${inclusionsHtml}
      </div>
    `);
  }

  if (exclusionsHtml) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0;">Not Included</h3>
        ${exclusionsHtml}
      </div>
    `);
  }

  if (priceRange) {
    sections.push(`
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; color: #92400e; margin: 0 0 8px 0;">Estimated Price</h3>
        <p style="font-size: 24px; font-weight: 700; color: #78350f; margin: 0;">${escapeHtml(priceRange)}</p>
      </div>
    `);
  }

  // Materials section
  const hasOverride = materialsOverrideText && materialsOverrideText.trim().length > 0;
  const showMaterialsDisclaimer = materialsAreRoughEstimate || !hasOverride;

  if (hasOverride) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0;">Materials</h3>
        <p style="font-size: 12px; color: #3b82f6; font-style: italic; margin: 0 0 8px 0;">Final materials notes</p>
        <p style="font-size: 14px; margin: 0; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(materialsOverrideText)}</p>
      </div>
    `);
  } else if (aiMaterials) {
    // Try to parse as JSON array
    try {
      const materials = JSON.parse(aiMaterials);
      if (Array.isArray(materials) && materials.length > 0) {
        const materialsHtml = materials.map((item: { item?: string; quantity?: string; estimatedCost?: string }) => 
          `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(item.item || "")}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(item.quantity || "-")}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${escapeHtml(item.estimatedCost || "-")}</td>
          </tr>`
        ).join("");

        sections.push(`
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0;">Materials</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Item</th>
                  <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0;">Qty</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 1px solid #e2e8f0;">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                ${materialsHtml}
              </tbody>
            </table>
          </div>
        `);
      }
    } catch {
      // If parsing fails, show as plain text
      sections.push(`
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0;">Materials</h3>
          <p style="font-size: 14px; margin: 0; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(aiMaterials)}</p>
        </div>
      `);
    }
  }

  // Materials disclaimer
  if ((hasOverride || aiMaterials) && showMaterialsDisclaimer) {
    sections.push(`
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 4px; padding: 12px; margin-bottom: 24px;">
        <p style="font-size: 12px; margin: 0; color: #92400e;">
          <strong>Note:</strong> Material prices are an estimate only and must be checked against current supplier pricing.
        </p>
      </div>
    `);
  }

  if (clientNotes) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; text-transform: uppercase; color: #64748b; margin: 0 0 8px 0;">Notes</h3>
        <p style="font-size: 14px; margin: 0; line-height: 1.5; color: #475569;">${escapeHtml(clientNotes)}</p>
      </div>
    `);
  }

  sections.push(`
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 14px; color: #64748b; margin: 0;">
        Please let me know if you have any questions or would like to proceed.
      </p>
      <p style="font-size: 14px; color: #64748b; margin-top: 16px;">Kind regards</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">
        Prepared with OMNEXORA – AI-assisted job packs for Australian trades.
      </p>
    </div>
  `);

  return sections.join("");
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Builds plain-text email content for a job pack
 */
export function buildJobPackEmailText({
  clientName,
  title,
  address,
  summary,
  scopeOfWork,
  inclusions,
  exclusions,
  priceRange,
  clientNotes,
  aiMaterials,
  materialsOverrideText,
  materialsAreRoughEstimate,
  customMessage,
}: {
  clientName?: string;
  title: string;
  address?: string;
  summary?: string;
  scopeOfWork?: string;
  inclusions?: string;
  exclusions?: string;
  priceRange?: string;
  clientNotes?: string;
  aiMaterials?: string;
  materialsOverrideText?: string | null;
  materialsAreRoughEstimate?: boolean;
  customMessage?: string;
}): string {
  const lines: string[] = [];
  const greeting = clientName ? `Hi ${clientName},` : "Hi,";

  lines.push(greeting);
  lines.push("");
  
  if (customMessage) {
    lines.push(customMessage);
    lines.push("");
  }

  lines.push("Please find below your painting quote for the following job:");
  lines.push("");
  lines.push(`📋 ${title}`);
  if (address) {
    lines.push(`📍 ${address}`);
  }
  lines.push("");

  if (summary) {
    lines.push("SUMMARY");
    lines.push("-------");
    lines.push(summary);
    lines.push("");
  }

  if (scopeOfWork) {
    const scopeLines = scopeOfWork.split("\n").filter((line) => line.trim());
    if (scopeLines.length > 0) {
      lines.push("SCOPE OF WORK");
      lines.push("-------------");
      scopeLines.forEach((line, i) => {
        lines.push(`${i + 1}. ${line}`);
      });
      lines.push("");
    }
  }

  if (inclusions) {
    const inclusionLines = inclusions.split("\n").filter((line) => line.trim());
    if (inclusionLines.length > 0) {
      lines.push("WHAT'S INCLUDED");
      lines.push("---------------");
      inclusionLines.forEach((line) => {
        lines.push(`• ${line}`);
      });
      lines.push("");
    }
  }

  if (exclusions) {
    const exclusionLines = exclusions.split("\n").filter((line) => line.trim());
    if (exclusionLines.length > 0) {
      lines.push("NOT INCLUDED");
      lines.push("------------");
      exclusionLines.forEach((line) => {
        lines.push(`• ${line}`);
      });
      lines.push("");
    }
  }

  if (priceRange) {
    lines.push("ESTIMATED PRICE");
    lines.push("---------------");
    lines.push(priceRange);
    lines.push("");
  }

  // Materials section
  const hasOverride = materialsOverrideText && materialsOverrideText.trim().length > 0;
  const showMaterialsDisclaimer = materialsAreRoughEstimate || !hasOverride;

  if (hasOverride) {
    lines.push("MATERIALS");
    lines.push("---------");
    lines.push("(Final materials notes)");
    lines.push(materialsOverrideText);
    lines.push("");
  } else if (aiMaterials) {
    try {
      const materials = JSON.parse(aiMaterials);
      if (Array.isArray(materials) && materials.length > 0) {
        lines.push("MATERIALS");
        lines.push("---------");
        materials.forEach((item: { item?: string; quantity?: string; estimatedCost?: string }) => {
          const qty = item.quantity || "-";
          const cost = item.estimatedCost || "-";
          lines.push(`• ${item.item || "Item"} - Qty: ${qty} - Est: ${cost}`);
        });
        lines.push("");
      }
    } catch {
      lines.push("MATERIALS");
      lines.push("---------");
      lines.push(aiMaterials);
      lines.push("");
    }
  }

  if ((hasOverride || aiMaterials) && showMaterialsDisclaimer) {
    lines.push("Note: Material prices are an estimate only and must be checked against current supplier pricing.");
    lines.push("");
  }

  if (clientNotes) {
    lines.push("NOTES");
    lines.push("-----");
    lines.push(clientNotes);
    lines.push("");
  }

  lines.push("---");
  lines.push("Please let me know if you have any questions or would like to proceed.");
  lines.push("");
  lines.push("Kind regards");
  lines.push("");
  lines.push("---");
  lines.push("Prepared with OMNEXORA – AI-assisted job packs for Australian trades.");

  return lines.join("\n");
}

