/**
 * Plasterer Trade Profile Configuration for OMNEXORA
 * 
 * This module provides plasterer-specific configuration including:
 * - Default rates and pricing
 * - Common materials with Australian pricing
 * - Compliance and safety information
 * - Document templates and AI prompt enhancements
 * 
 * Compliance References:
 * - Building Code of Australia (BCA/NCC)
 * - Australian Standards AS 2589 (Gypsum linings)
 * - State-based SafeWork standards
 */

// ============================================================================
// PLASTERER DEFAULT RATES (Australian market rates 2024-2026)
// ============================================================================

export const PLASTERER_DEFAULT_RATES = {
  // Hourly rates
  hourlyRate: 85, // Standard hourly rate
  helperHourlyRate: 45, // Apprentice/helper rate
  dayRate: 650, // Full day rate
  
  // Per-square-metre rates
  ratePerM2NewPlasterboard: 28, // New plasterboard installation (supply + fix)
  ratePerM2Skim: 18, // Skim coat only
  ratePerM2Ceiling: 32, // Ceiling work (higher due to overhead work)
  ratePerM2Cornice: 12, // Per linear metre for cornice
  ratePerM2PatchRepair: 45, // Small patch repairs (per m²)
  
  // Minimum charges
  minCharge: 350, // Minimum call-out/job charge
  calloutFee: 85, // Call-out fee
  
  // Material markup
  materialMarkupPercent: 20, // Standard markup on materials
};

// ============================================================================
// COMMON PLASTERING MATERIALS (Australian pricing)
// ============================================================================

export interface PlasteringMaterial {
  name: string;
  category: string;
  supplier: string;
  unitLabel: string;
  unitCost: number;
  notes: string;
  coverage?: string; // Coverage information
}

export const PLASTERER_DEFAULT_MATERIALS: PlasteringMaterial[] = [
  // Plasterboard Sheets
  {
    name: "Standard Plasterboard 10mm (2400x1200)",
    category: "Plasterboard",
    supplier: "Bunnings/CSR",
    unitLabel: "Sheet",
    unitCost: 18.50,
    notes: "Standard interior walls",
    coverage: "2.88m² per sheet",
  },
  {
    name: "Standard Plasterboard 13mm (2400x1200)",
    category: "Plasterboard",
    supplier: "Bunnings/CSR",
    unitLabel: "Sheet",
    unitCost: 22.00,
    notes: "Standard walls and ceilings",
    coverage: "2.88m² per sheet",
  },
  {
    name: "Fire-Rated Plasterboard 13mm (2400x1200)",
    category: "Plasterboard",
    supplier: "Bunnings/CSR",
    unitLabel: "Sheet",
    unitCost: 32.00,
    notes: "Fire-rated applications (FRL required)",
    coverage: "2.88m² per sheet",
  },
  {
    name: "Moisture-Resistant Plasterboard 13mm (2400x1200)",
    category: "Plasterboard",
    supplier: "Bunnings/CSR",
    unitLabel: "Sheet",
    unitCost: 35.00,
    notes: "Wet areas - bathrooms, laundries",
    coverage: "2.88m² per sheet",
  },
  {
    name: "Acoustic Plasterboard 13mm (2400x1200)",
    category: "Plasterboard",
    supplier: "CSR/Knauf",
    unitLabel: "Sheet",
    unitCost: 45.00,
    notes: "Sound insulation applications",
    coverage: "2.88m² per sheet",
  },
  
  // Compounds and Fillers
  {
    name: "CSR Gyprock Base Coat Compound 20kg",
    category: "Compound",
    supplier: "Bunnings/CSR",
    unitLabel: "Bag",
    unitCost: 28.00,
    notes: "Base coat for joints and corners",
    coverage: "Approx 35-40m² of jointing",
  },
  {
    name: "CSR Gyprock Top Coat Compound 20kg",
    category: "Compound",
    supplier: "Bunnings/CSR",
    unitLabel: "Bag",
    unitCost: 32.00,
    notes: "Finishing coat for smooth finish",
    coverage: "Approx 35-40m² of jointing",
  },
  {
    name: "Cornice Adhesive 20kg",
    category: "Adhesive",
    supplier: "Bunnings/CSR",
    unitLabel: "Bag",
    unitCost: 25.00,
    notes: "For installing cornice/cove",
    coverage: "Approx 50-60 linear metres",
  },
  {
    name: "Patching Compound 1kg",
    category: "Compound",
    supplier: "Bunnings",
    unitLabel: "Tub",
    unitCost: 12.00,
    notes: "Small repairs and patches",
  },
  {
    name: "Ready-Mix Joint Compound 15L",
    category: "Compound",
    supplier: "Bunnings/USG",
    unitLabel: "Bucket",
    unitCost: 45.00,
    notes: "Pre-mixed for convenience",
    coverage: "Approx 25-30m² of jointing",
  },
  
  // Tape and Accessories
  {
    name: "Paper Jointing Tape 75m Roll",
    category: "Tape",
    supplier: "Bunnings/CSR",
    unitLabel: "Roll",
    unitCost: 8.50,
    notes: "Standard paper tape for joints",
  },
  {
    name: "Fibreglass Mesh Tape 50mm x 90m",
    category: "Tape",
    supplier: "Bunnings",
    unitLabel: "Roll",
    unitCost: 15.00,
    notes: "Self-adhesive mesh tape",
  },
  {
    name: "Corner Bead 3m (Metal)",
    category: "Accessories",
    supplier: "Bunnings/CSR",
    unitLabel: "Length",
    unitCost: 4.50,
    notes: "External corner protection",
  },
  {
    name: "Corner Bead 3m (Paper-Faced)",
    category: "Accessories",
    supplier: "Bunnings/CSR",
    unitLabel: "Length",
    unitCost: 6.00,
    notes: "Flexible paper-faced corner",
  },
  
  // Cornice and Trim
  {
    name: "Cove Cornice 55mm x 4.2m",
    category: "Cornice",
    supplier: "Bunnings/CSR",
    unitLabel: "Length",
    unitCost: 12.00,
    notes: "Standard cove profile",
  },
  {
    name: "Cove Cornice 75mm x 4.2m",
    category: "Cornice",
    supplier: "Bunnings/CSR",
    unitLabel: "Length",
    unitCost: 16.00,
    notes: "Medium cove profile",
  },
  {
    name: "Cove Cornice 90mm x 4.2m",
    category: "Cornice",
    supplier: "Bunnings/CSR",
    unitLabel: "Length",
    unitCost: 20.00,
    notes: "Large cove profile",
  },
  {
    name: "Decorative Cornice 4.2m",
    category: "Cornice",
    supplier: "CSR/Supplier",
    unitLabel: "Length",
    unitCost: 35.00,
    notes: "Ornate/decorative profiles",
  },
  
  // Screws and Fixings
  {
    name: "Plasterboard Screws 25mm (500 pack)",
    category: "Fixings",
    supplier: "Bunnings",
    unitLabel: "Box",
    unitCost: 18.00,
    notes: "For 10mm board to timber",
  },
  {
    name: "Plasterboard Screws 32mm (500 pack)",
    category: "Fixings",
    supplier: "Bunnings",
    unitLabel: "Box",
    unitCost: 22.00,
    notes: "For 13mm board to timber",
  },
  {
    name: "Metal Frame Screws 25mm (500 pack)",
    category: "Fixings",
    supplier: "Bunnings",
    unitLabel: "Box",
    unitCost: 25.00,
    notes: "For board to steel stud",
  },
  
  // Primers and Sealers
  {
    name: "Plasterboard Sealer 4L",
    category: "Primer",
    supplier: "Dulux/Bunnings",
    unitLabel: "Can",
    unitCost: 48.00,
    notes: "Seals new plasterboard before painting",
    coverage: "Approx 16-20m² per litre",
  },
];

// ============================================================================
// AUSTRALIAN COMPLIANCE INFORMATION
// ============================================================================

export const PLASTERER_COMPLIANCE = {
  // Building Code of Australia references
  bca: {
    standard: "Building Code of Australia (BCA/NCC)",
    relevantSections: [
      "Part 3.7.2 - Fire-resisting construction",
      "Part 3.8.6 - Sound insulation",
      "Specification C1.10 - Fire hazard properties",
    ],
    notes: "Plasterboard installations must comply with relevant BCA provisions for fire resistance, acoustic performance, and structural adequacy.",
  },
  
  // Australian Standards
  standards: [
    {
      code: "AS/NZS 2589",
      title: "Gypsum linings - Application and finishing",
      description: "Primary standard for plasterboard installation and finishing",
    },
    {
      code: "AS/NZS 2588",
      title: "Gypsum plasterboard",
      description: "Product standard for plasterboard sheets",
    },
    {
      code: "AS 2311",
      title: "Guide to the painting of buildings",
      description: "Relevant for surface preparation and finishing",
    },
    {
      code: "AS 1530.4",
      title: "Fire-resistance tests of elements of construction",
      description: "For fire-rated plasterboard systems",
    },
  ],
  
  // SafeWork requirements
  safeWork: {
    requirements: [
      "Manual handling risk assessment for sheet handling",
      "Respiratory protection when sanding (P2 minimum)",
      "Eye protection during cutting and sanding",
      "Dust extraction/suppression measures",
      "Working at heights protocols for ceiling work",
      "Electrical safety awareness (hidden cables)",
    ],
    ppe: [
      "P2/N95 dust mask (sanding operations)",
      "Safety glasses",
      "Work gloves",
      "Steel cap boots",
      "Hearing protection (power tools)",
    ],
  },
  
  // Wet area requirements
  wetAreas: {
    requirement: "Moisture-resistant plasterboard (green board) mandatory in wet areas",
    areas: ["Bathrooms", "Laundries", "Kitchens (splashback areas)"],
    notes: "Must comply with AS 3740 - Waterproofing of domestic wet areas",
  },
  
  // Fire rating information
  fireRating: {
    requirement: "Fire-rated plasterboard (pink board) required where FRL specified",
    commonApplications: [
      "Inter-tenancy walls (apartments/units)",
      "Garage walls adjoining habitable rooms",
      "Fire separation walls",
    ],
    notes: "Fire-rated systems must be installed exactly as per manufacturer specifications to maintain rating.",
  },
};

// ============================================================================
// AI PROMPT ENHANCEMENTS FOR PLASTERING
// ============================================================================

export const PLASTERER_AI_CONTEXT = {
  // Trade-specific context for AI document generation
  tradeDescription: "professional plastering contractor specializing in plasterboard installation, repairs, and finishing",
  
  // Common scope items for plastering
  commonScopeItems: [
    "Supply and install plasterboard to walls",
    "Supply and install plasterboard to ceilings",
    "Apply base coat compound to all joints",
    "Apply finishing coat for Level 4/5 finish",
    "Install cornice/cove to ceiling-wall junction",
    "Patch and repair existing plasterboard",
    "Skim coat existing surfaces",
    "Install corner beads to all external corners",
    "Sand and prepare surfaces for painting",
    "Remove and dispose of waste materials",
  ],
  
  // Standard inclusions for plastering quotes
  standardInclusions: [
    "Supply of all plasterboard materials",
    "Supply of compounds, tape, and fixings",
    "Supply and installation of cornice",
    "All joints taped and finished to Level 4",
    "Corner beads to all external corners",
    "Sanding and dust management",
    "Clean-up and waste removal",
    "Workmanship warranty (typically 2 years)",
  ],
  
  // Standard exclusions for plastering quotes
  standardExclusions: [
    "Painting (unless specified)",
    "Scaffolding hire (if required over 3m)",
    "Structural repairs or modifications",
    "Electrical or plumbing modifications",
    "Asbestos removal or testing",
    "Building permits (if required)",
    "Waterproofing (wet areas - by licensed waterproofer)",
  ],
  
  // Finish levels
  finishLevels: {
    level3: "Suitable for heavy texture or wallpaper",
    level4: "Standard finish for flat or low-sheen paint (most residential)",
    level5: "Premium finish for high-gloss paint or critical lighting",
  },
  
  // Safety considerations for SWMS
  safetyHazards: [
    "Manual handling - plasterboard sheets (up to 30kg)",
    "Silica dust exposure during sanding",
    "Working at heights - ceiling installation",
    "Sharp edges - cutting plasterboard",
    "Repetitive strain - hand finishing",
    "Electrical hazards - hidden cables in walls",
    "Slips/trips - compound spillage",
  ],
  
  // Maintenance guidance
  maintenanceGuidance: {
    cleaning: "Dust with dry cloth or vacuum. Avoid wet cleaning until painted.",
    touchUps: "Small cracks can be filled with ready-mix compound and sanded smooth.",
    inspection: "Check for cracks at joins annually, especially in new builds (settling).",
    warranty: "Workmanship typically warranted for 2 years. Cracking from building movement excluded.",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default rate template for plasterers
 */
export function getPlastererDefaultRateTemplate() {
  return {
    name: "Plasterer - Standard Rates",
    tradeType: "Plasterer",
    propertyType: null, // Works for all property types
    hourlyRate: PLASTERER_DEFAULT_RATES.hourlyRate,
    helperHourlyRate: PLASTERER_DEFAULT_RATES.helperHourlyRate,
    dayRate: PLASTERER_DEFAULT_RATES.dayRate,
    calloutFee: PLASTERER_DEFAULT_RATES.calloutFee,
    minCharge: PLASTERER_DEFAULT_RATES.minCharge,
    ratePerM2Interior: PLASTERER_DEFAULT_RATES.ratePerM2NewPlasterboard,
    ratePerM2Exterior: null, // Plasterers don't typically do exterior
    ratePerLmTrim: PLASTERER_DEFAULT_RATES.ratePerM2Cornice,
    materialMarkupPercent: PLASTERER_DEFAULT_RATES.materialMarkupPercent,
    isDefault: true,
  };
}

/**
 * Get plasterer-specific AI system prompt enhancement
 */
export function getPlastererSystemPromptContext(): string {
  return `
Trade-Specific Context (Plasterer):
- This is a plastering/plasterboard job in Australia
- Common work includes: plasterboard installation, cornice, repairs, skim coating
- Finish levels: Level 3 (texture), Level 4 (standard flat paint), Level 5 (premium gloss)
- Materials typically include: plasterboard sheets (10mm walls, 13mm ceilings), compounds, tape, screws, cornice
- Must comply with AS/NZS 2589 (Gypsum linings) and Building Code of Australia
- Wet areas require moisture-resistant (green) board per AS 3740
- Fire-rated areas require specific fire-rated (pink) board systems
- Standard warranty: 2 years workmanship (excludes building movement cracks)
- Safety: silica dust protection (P2 mask), manual handling for sheets, working at heights
`;
}

/**
 * Calculate estimated material quantities for plastering
 */
export function estimatePlasteringMaterials(params: {
  wallAreaM2?: number;
  ceilingAreaM2?: number;
  corniceLinearM?: number;
  isWetArea?: boolean;
  isFireRated?: boolean;
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  const sheetAreaM2 = 2.88; // Standard 2400x1200 sheet
  
  // Calculate wall sheets
  if (params.wallAreaM2) {
    const wallSheets = Math.ceil((params.wallAreaM2 * 1.1) / sheetAreaM2); // 10% wastage
    const boardType = params.isWetArea 
      ? "Moisture-Resistant Plasterboard 13mm" 
      : params.isFireRated 
        ? "Fire-Rated Plasterboard 13mm"
        : "Standard Plasterboard 10mm";
    materials.push({ item: boardType, quantity: wallSheets, unit: "sheets" });
  }
  
  // Calculate ceiling sheets
  if (params.ceilingAreaM2) {
    const ceilingSheets = Math.ceil((params.ceilingAreaM2 * 1.1) / sheetAreaM2);
    materials.push({ item: "Standard Plasterboard 13mm (ceilings)", quantity: ceilingSheets, unit: "sheets" });
  }
  
  // Calculate cornice
  if (params.corniceLinearM) {
    const corniceLength = Math.ceil(params.corniceLinearM * 1.05); // 5% wastage
    const cornicePerLength = 4.2; // metres per length
    materials.push({ item: "Cove Cornice 55mm", quantity: Math.ceil(corniceLength / cornicePerLength), unit: "lengths" });
  }
  
  // Estimate compound (approx 1 bag per 35m² of board area)
  const totalBoardArea = (params.wallAreaM2 || 0) + (params.ceilingAreaM2 || 0);
  if (totalBoardArea > 0) {
    const baseCoatBags = Math.ceil(totalBoardArea / 35);
    const topCoatBags = Math.ceil(totalBoardArea / 40);
    materials.push({ item: "Base Coat Compound 20kg", quantity: baseCoatBags, unit: "bags" });
    materials.push({ item: "Top Coat Compound 20kg", quantity: topCoatBags, unit: "bags" });
    
    // Tape (approx 1 roll per 25m² of board)
    const tapeRolls = Math.ceil(totalBoardArea / 25);
    materials.push({ item: "Paper Jointing Tape", quantity: tapeRolls, unit: "rolls" });
    
    // Screws (approx 1 box per 30m² of board)
    const screwBoxes = Math.ceil(totalBoardArea / 30);
    materials.push({ item: "Plasterboard Screws 32mm", quantity: screwBoxes, unit: "boxes" });
  }
  
  // Cornice adhesive
  if (params.corniceLinearM && params.corniceLinearM > 0) {
    const adhesiveBags = Math.ceil(params.corniceLinearM / 50);
    materials.push({ item: "Cornice Adhesive 20kg", quantity: adhesiveBags, unit: "bags" });
  }
  
  return materials;
}
