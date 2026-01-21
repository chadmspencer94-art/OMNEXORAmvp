import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isClient } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

interface ImportedMaterial {
  name: string;
  category?: string;
  supplier?: string;
  unitLabel: string;
  unitCost?: number;
  notes?: string;
}

/**
 * Parse CSV content into material objects
 */
function parseCSV(csvContent: string): ImportedMaterial[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error("CSV must have a header row and at least one data row");
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  // Find column indices (flexible column naming)
  const nameIdx = headers.findIndex(h => h === "name" || h === "material" || h === "item" || h === "product");
  const categoryIdx = headers.findIndex(h => h === "category" || h === "type" || h === "group");
  const supplierIdx = headers.findIndex(h => h === "supplier" || h === "vendor" || h === "brand" || h === "manufacturer");
  const unitLabelIdx = headers.findIndex(h => h === "unitlabel" || h === "unit" || h === "unit_label" || h === "uom");
  const unitCostIdx = headers.findIndex(h => h === "unitcost" || h === "cost" || h === "price" || h === "unit_cost" || h === "unit_price");
  const notesIdx = headers.findIndex(h => h === "notes" || h === "description" || h === "details" || h === "comments");

  if (nameIdx === -1) {
    throw new Error("CSV must have a 'Name' or 'Material' or 'Item' column");
  }
  if (unitLabelIdx === -1) {
    throw new Error("CSV must have a 'Unit' or 'UnitLabel' or 'UOM' column");
  }

  const materials: ImportedMaterial[] = [];
  const errors: string[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line);
      
      const name = values[nameIdx]?.trim();
      const unitLabel = values[unitLabelIdx]?.trim();

      if (!name) {
        errors.push(`Row ${i + 1}: Missing name`);
        continue;
      }
      if (!unitLabel) {
        errors.push(`Row ${i + 1}: Missing unit label`);
        continue;
      }

      const material: ImportedMaterial = {
        name,
        unitLabel,
      };

      if (categoryIdx !== -1 && values[categoryIdx]?.trim()) {
        material.category = values[categoryIdx].trim();
      }
      if (supplierIdx !== -1 && values[supplierIdx]?.trim()) {
        material.supplier = values[supplierIdx].trim();
      }
      if (notesIdx !== -1 && values[notesIdx]?.trim()) {
        material.notes = values[notesIdx].trim();
      }
      if (unitCostIdx !== -1 && values[unitCostIdx]?.trim()) {
        const costStr = values[unitCostIdx].trim().replace(/[^0-9.-]/g, "");
        const cost = parseFloat(costStr);
        if (!isNaN(cost) && cost >= 0) {
          material.unitCost = cost;
        }
      }

      materials.push(material);
    } catch (err) {
      errors.push(`Row ${i + 1}: Failed to parse`);
    }
  }

  if (materials.length === 0) {
    throw new Error(errors.length > 0 
      ? `No valid materials found. Errors: ${errors.slice(0, 5).join("; ")}` 
      : "No valid materials found in CSV"
    );
  }

  return materials;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);

  return values;
}

/**
 * POST /api/materials/import
 * Bulk import materials from CSV
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (isClient(user)) {
      return NextResponse.json(
        { error: "Clients cannot manage materials library" },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let csvContent: string;

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      
      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      // Check file type
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith(".csv")) {
        return NextResponse.json(
          { error: "Only CSV files are supported. Please upload a .csv file." },
          { status: 400 }
        );
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 5MB." },
          { status: 400 }
        );
      }

      csvContent = await file.text();
    } else {
      // Handle JSON body with CSV content
      const body = await request.json();
      csvContent = body.csvContent;

      if (!csvContent) {
        return NextResponse.json(
          { error: "No CSV content provided" },
          { status: 400 }
        );
      }
    }

    // Parse CSV
    let materials: ImportedMaterial[];
    try {
      materials = parseCSV(csvContent);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to parse CSV" },
        { status: 400 }
      );
    }

    // Limit bulk import to 500 items at a time
    if (materials.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 materials can be imported at once. Please split your file." },
        { status: 400 }
      );
    }

    // Import materials
    const prisma = getPrisma();
    const createdMaterials = await (prisma as any).materialItem.createMany({
      data: materials.map(m => ({
        userId: user.id,
        name: m.name,
        category: m.category || null,
        supplier: m.supplier || null,
        unitLabel: m.unitLabel,
        unitCost: m.unitCost ?? null,
        notes: m.notes || null,
        isArchived: false,
      })),
      skipDuplicates: false,
    });

    return NextResponse.json({
      success: true,
      imported: createdMaterials.count,
      message: `Successfully imported ${createdMaterials.count} materials`,
    });
  } catch (error) {
    console.error("Error importing materials:", error);
    return NextResponse.json(
      { error: "Failed to import materials. Please check your file format." },
      { status: 500 }
    );
  }
}
