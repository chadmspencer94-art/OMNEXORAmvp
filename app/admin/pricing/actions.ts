"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function toCents(value: number | string | undefined | null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export type PriceListType = "TRADE" | "SHELF";

export interface PriceListItem {
  id?: string;
  name: string;
  sku?: string;
  unit?: string;
  tradePrice?: number;
  shelfPrice?: number;
  cost?: number;
  notes?: string;
}

export interface PriceList {
  id: string;
  name: string;
  type: PriceListType; // Maps to pricingType in Prisma
  description?: string; // Maps to locationLabel or supplier in Prisma (for display purposes)
  createdAt: Date;
  updatedAt: Date;
  items: PriceListItem[];
}

/**
 * Get all price lists
 */
export async function getPriceLists(): Promise<PriceList[]> {
  try {
    const lists = await (prisma as any).priceList.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          orderBy: { skuName: "asc" },
        },
      },
    });

    return lists.map((list: any) => ({
      id: list.id,
      name: list.name,
      type: list.pricingType as PriceListType,
      description: list.locationLabel || list.supplier || undefined,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      items: list.items.map((item: any) => ({
        id: item.id,
        name: item.skuName,
        sku: item.brand || undefined,
        unit: item.unit || undefined,
        tradePrice: list.pricingType === "TRADE" ? Number(item.priceExGstCents) / 100 : undefined,
        shelfPrice: list.pricingType === "SHELF" ? Number(item.priceExGstCents) / 100 : undefined,
        cost: undefined, // Not stored separately in schema
        notes: item.notes || undefined,
      })),
    }));
  } catch (error) {
    console.error("[pricing] Error fetching price lists:", error);
    throw new Error("Failed to fetch price lists");
  }
}

/**
 * Get a single price list by ID
 */
export async function getPriceListById(listId: string): Promise<PriceList | null> {
  try {
    const list = await (prisma as any).priceList.findUnique({
      where: { id: listId },
      include: {
        items: {
          orderBy: { skuName: "asc" },
        },
      },
    });

    if (!list) {
      return null;
    }

    return {
      id: list.id,
      name: list.name,
      type: list.pricingType as PriceListType,
      description: list.locationLabel || list.supplier || undefined,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      items: list.items.map((item: any) => ({
        id: item.id,
        name: item.skuName,
        sku: item.brand || undefined,
        unit: item.unit || undefined,
        tradePrice: list.pricingType === "TRADE" ? Number(item.priceExGstCents) / 100 : undefined,
        shelfPrice: list.pricingType === "SHELF" ? Number(item.priceExGstCents) / 100 : undefined,
        cost: undefined, // Not stored separately in schema
        notes: item.notes || undefined,
      })),
    };
  } catch (error) {
    console.error("[pricing] Error fetching price list:", error);
    throw new Error("Failed to fetch price list");
  }
}

/**
 * Create a new price list
 */
export async function createPriceList(
  name: string,
  type: PriceListType,
  description?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!name || name.trim() === "") {
      return { success: false, error: "Name is required" };
    }

    // For admin/demo purposes, use a placeholder orgId
    // In production, this should come from the authenticated user's organization
    const orgId = process.env.NODE_ENV === "development" ? "admin-demo" : "admin";

    const list = await (prisma as any).priceList.create({
      data: {
        orgId,
        name: name.trim(),
        pricingType: type,
        locationLabel: description?.trim() || null,
      },
    });

    revalidatePath("/admin/pricing");
    return { success: true, id: list.id };
  } catch (error) {
    console.error("[pricing] Error creating price list:", error);
    return { success: false, error: "Failed to create price list" };
  }
}

/**
 * Update a price list
 */
export async function updatePriceList(
  listId: string,
  name: string,
  type: PriceListType,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!name || name.trim() === "") {
      return { success: false, error: "Name is required" };
    }

    await (prisma as any).priceList.update({
      where: { id: listId },
      data: {
        name: name.trim(),
        pricingType: type,
        locationLabel: description?.trim() || null,
      },
    });

    revalidatePath("/admin/pricing");
    revalidatePath(`/admin/pricing/${listId}`);
    return { success: true };
  } catch (error) {
    console.error("[pricing] Error updating price list:", error);
    return { success: false, error: "Failed to update price list" };
  }
}

/**
 * Delete a price list
 */
export async function deletePriceList(listId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await (prisma as any).priceList.delete({
      where: { id: listId },
    });

    revalidatePath("/admin/pricing");
    return { success: true };
  } catch (error) {
    console.error("[pricing] Error deleting price list:", error);
    return { success: false, error: "Failed to delete price list" };
  }
}

/**
 * Add an item to a price list (manual entry)
 */
export async function addPriceListItem(
  listId: string,
  item: Omit<PriceListItem, "id">
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!item.name || item.name.trim() === "") {
      return { success: false, error: "Item name is required" };
    }

    const createdItem = await (prisma as any).priceListItem.create({
      data: {
        priceListId: listId,
        skuName: item.name.trim(),
        unit: item.unit?.trim() || null,
        priceExGstCents: toCents(item.tradePrice ?? item.shelfPrice ?? item.cost),
        notes: item.notes?.trim() || null,
      },
    });

    revalidatePath(`/admin/pricing/${listId}`);
    revalidatePath("/admin/pricing");
    return { success: true, id: createdItem.id };
  } catch (error) {
    console.error("[pricing] Error adding price list item:", error);
    return { success: false, error: "Failed to add item" };
  }
}

/**
 * Update a price list item
 */
export async function updatePriceListItem(
  itemId: string,
  item: Omit<PriceListItem, "id">
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!item.name || item.name.trim() === "") {
      return { success: false, error: "Item name is required" };
    }

    const existingItem = await (prisma as any).priceListItem.findUnique({
      where: { id: itemId },
      select: { priceListId: true },
    });

    if (!existingItem) {
      return { success: false, error: "Item not found" };
    }

    await (prisma as any).priceListItem.update({
      where: { id: itemId },
      data: {
        skuName: item.name.trim(),
        unit: item.unit?.trim() || null,
        priceExGstCents: toCents(item.tradePrice ?? item.shelfPrice ?? item.cost),
        notes: item.notes?.trim() || null,
      },
    });

    revalidatePath(`/admin/pricing/${existingItem.priceListId}`);
    revalidatePath("/admin/pricing");
    return { success: true };
  } catch (error) {
    console.error("[pricing] Error updating price list item:", error);
    return { success: false, error: "Failed to update item" };
  }
}

/**
 * Delete a price list item
 */
export async function deletePriceListItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const existingItem = await (prisma as any).priceListItem.findUnique({
      where: { id: itemId },
      select: { priceListId: true },
    });

    if (!existingItem) {
      return { success: false, error: "Item not found" };
    }

    await (prisma as any).priceListItem.delete({
      where: { id: itemId },
    });

    revalidatePath(`/admin/pricing/${existingItem.priceListId}`);
    revalidatePath("/admin/pricing");
    return { success: true };
  } catch (error) {
    console.error("[pricing] Error deleting price list item:", error);
    return { success: false, error: "Failed to delete item" };
  }
}

/**
 * Import items from CSV
 */
export async function importPriceListItemsFromCSV(
  listId: string,
  csvContent: string
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  try {
    const lines = csvContent.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) {
      return { success: false, imported: 0, errors: ["CSV file is empty"] };
    }

    // Parse header row
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIndex = header.findIndex((h) => h === "name" || h === "product name" || h === "item name");
    const skuIndex = header.findIndex((h) => h === "sku" || h === "product code" || h === "code");
    const unitIndex = header.findIndex((h) => h === "unit" || h === "uom" || h === "unit of measure");
    const tradePriceIndex = header.findIndex(
      (h) => h === "trade price" || h === "trade" || h === "wholesale" || h === "wholesale price"
    );
    const shelfPriceIndex = header.findIndex(
      (h) => h === "shelf price" || h === "retail" || h === "retail price" || h === "shelf"
    );
    const costIndex = header.findIndex((h) => h === "cost" || h === "cost price");
    const notesIndex = header.findIndex((h) => h === "notes" || h === "description" || h === "note");

    if (nameIndex === -1) {
      return { success: false, imported: 0, errors: ["CSV must contain a 'name' column"] };
    }

    const errors: string[] = [];
    let imported = 0;

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const name = values[nameIndex]?.trim();

      if (!name || name === "") {
        errors.push(`Row ${i + 1}: Missing name, skipped`);
        continue;
      }

      try {
        const tradePrice = tradePriceIndex >= 0 && values[tradePriceIndex]
          ? parseFloat(values[tradePriceIndex].replace(/[^0-9.-]/g, ""))
          : undefined;
        const shelfPrice = shelfPriceIndex >= 0 && values[shelfPriceIndex]
          ? parseFloat(values[shelfPriceIndex].replace(/[^0-9.-]/g, ""))
          : undefined;
        const cost = costIndex >= 0 && values[costIndex]
          ? parseFloat(values[costIndex].replace(/[^0-9.-]/g, ""))
          : undefined;

        await (prisma as any).priceListItem.create({
          data: {
            priceListId: listId,
            skuName: name,
            unit: unitIndex >= 0 && values[unitIndex] ? values[unitIndex] : null,
            priceExGstCents: toCents(
              tradePrice && !isNaN(tradePrice) ? tradePrice :
              shelfPrice && !isNaN(shelfPrice) ? shelfPrice :
              cost && !isNaN(cost) ? cost : undefined
            ),
            notes: notesIndex >= 0 && values[notesIndex] ? values[notesIndex] : null,
          },
        });

        imported++;
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Failed to import"}`);
      }
    }

    revalidatePath(`/admin/pricing/${listId}`);
    revalidatePath("/admin/pricing");

    return {
      success: imported > 0,
      imported,
      errors,
    };
  } catch (error) {
    console.error("[pricing] Error importing CSV:", error);
    return {
      success: false,
      imported: 0,
      errors: [error instanceof Error ? error.message : "Failed to import CSV"],
    };
  }
}

