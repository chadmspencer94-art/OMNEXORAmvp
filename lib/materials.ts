import { getPrisma } from "@/lib/prisma";
import { getJobById, saveJob } from "./jobs";

/**
 * R4: Totals reconciliation validation result
 */
export interface TotalsReconciliationResult {
  isValid: boolean;
  sumOfLineTotals: number;
  storedMaterialsTotal: number | null;
  difference: number;
  message?: string;
}

/**
 * R4: Validates that materials totals are reconciled before allowing export
 * 
 * Checks that the stored materialsTotal matches the sum of JobMaterial line totals.
 * This ensures data integrity in exports - no mismatched totals in client-facing documents.
 * 
 * @param jobId - The job ID to validate
 * @param userId - The user ID (materials are per-user)
 * @param storedMaterialsTotal - The materialsTotal value from the Job record
 * @returns Validation result with details about any mismatch
 */
export async function validateMaterialsTotalsForExport(
  jobId: string,
  userId: string,
  storedMaterialsTotal: number | null
): Promise<TotalsReconciliationResult> {
  const prisma = getPrisma();

  // Load all JobMaterial rows for this job/user
  const jobMaterials = await (prisma as any).jobMaterial.findMany({
    where: {
      jobId,
      userId,
    },
  });

  // If no materials exist, validation passes (nothing to reconcile)
  if (!jobMaterials || jobMaterials.length === 0) {
    return {
      isValid: true,
      sumOfLineTotals: 0,
      storedMaterialsTotal,
      difference: 0,
    };
  }

  // Calculate sum of line totals
  const sumOfLineTotals = jobMaterials.reduce((sum: number, m: any) => {
    return sum + (m.lineTotal ? Number(m.lineTotal) : 0);
  }, 0);

  // If no stored total, pass validation (total wasn't set yet)
  if (storedMaterialsTotal === null || storedMaterialsTotal === undefined) {
    return {
      isValid: true,
      sumOfLineTotals,
      storedMaterialsTotal: null,
      difference: 0,
      message: "No materials total stored - using calculated sum.",
    };
  }

  // Check if totals match (allow small floating point tolerance)
  const difference = Math.abs(sumOfLineTotals - storedMaterialsTotal);
  const tolerance = 0.01; // 1 cent tolerance for floating point rounding

  if (difference > tolerance) {
    return {
      isValid: false,
      sumOfLineTotals,
      storedMaterialsTotal,
      difference,
      message: `Materials total mismatch: stored total is $${storedMaterialsTotal.toFixed(2)} but sum of line items is $${sumOfLineTotals.toFixed(2)}. Please update the materials or recalculate totals before exporting.`,
    };
  }

  return {
    isValid: true,
    sumOfLineTotals,
    storedMaterialsTotal,
    difference: 0,
  };
}

/**
 * Recalculates materials totals for a job based on JobMaterial line items
 * Updates the Job record in KV with the new totals
 */
export async function recalcJobMaterialsTotals(jobId: string, userId: string): Promise<{
  materialsSubtotal: number;
  materialsMarkupTotal: number;
  materialsTotal: number;
}> {
  const prisma = getPrisma();
  // Load all JobMaterial rows for this job/user
  const jobMaterials = await (prisma as any).jobMaterial.findMany({
    where: {
      jobId,
      userId,
    },
  });

  let materialsSubtotal = 0;
  let materialsMarkupTotal = 0;
  let materialsTotal = 0;

  // Calculate line totals and update each line item
  for (const line of jobMaterials) {
    const unitCost = line.unitCost ? Number(line.unitCost) : 0;
    const quantity = line.quantity || 0;
    const markupPercent = line.markupPercent || 0;

    // Calculate base cost for this line
    const baseCost = unitCost * quantity;

    // Calculate markup amount
    const markupAmount = baseCost * (markupPercent / 100);

    // Calculate line total
    const lineTotal = baseCost + markupAmount;

    // Update lineTotal in database if it changed
    const currentLineTotal = line.lineTotal ? Number(line.lineTotal) : null;
    if (currentLineTotal !== lineTotal) {
      await (prisma as any).jobMaterial.update({
        where: { id: line.id },
        data: { lineTotal: lineTotal },
      });
    }

    // Accumulate totals
    materialsSubtotal += baseCost;
    materialsMarkupTotal += markupAmount;
    materialsTotal += lineTotal;
  }

  // Update the Job record in KV
  const job = await getJobById(jobId);
  if (job && job.userId === userId) {
    job.materialsSubtotal = materialsSubtotal;
    job.materialsMarkupTotal = materialsMarkupTotal;
    job.materialsTotal = materialsTotal;
    await saveJob(job);
  }

  return {
    materialsSubtotal,
    materialsMarkupTotal,
    materialsTotal,
  };
}

