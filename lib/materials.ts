import { getPrisma } from "@/lib/prisma";
import { getJobById, saveJob } from "./jobs";

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

