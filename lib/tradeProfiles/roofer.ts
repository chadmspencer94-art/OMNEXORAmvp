/**
 * Roofer Trade Profile Configuration for OMNEXORA
 * 
 * This module provides roofer-specific configuration including:
 * - Default rates and pricing for roofing work
 * - Common materials with Australian pricing (Colorbond, tiles, etc.)
 * - Compliance and safety information (working at heights critical)
 * - Document templates and AI prompt enhancements
 * 
 * Compliance References:
 * - Building Code of Australia (BCA/NCC)
 * - AS 4200.2 - Pliable building membranes and underlays
 * - AS 1562 - Design and installation of sheet roof and wall cladding
 * - State-based SafeWork - Working at Heights regulations
 */

// ============================================================================
// ROOFER DEFAULT RATES (Australian market rates 2024-2026)
// ============================================================================

export const ROOFER_DEFAULT_RATES = {
  // Hourly rates
  hourlyRate: 95, // Standard hourly rate (higher due to heights/risk)
  helperHourlyRate: 50, // Labourer/helper rate
  dayRate: 750, // Full day rate
  
  // Per-square-metre rates (roofing)
  ratePerM2MetalRoofReroof: 85, // Colorbond re-roof (remove old + install new)
  ratePerM2MetalRoofNew: 65, // New Colorbond installation
  ratePerM2TileReroof: 95, // Tile re-roof (remove + install)
  ratePerM2TileRepoint: 25, // Tile repointing/rebedding
  ratePerM2GutterReplace: 45, // Gutter replacement per linear metre
  ratePerM2Flashing: 55, // Flashing installation per linear metre
  
  // Repair rates
  ratePerLeakRepair: 350, // Standard leak repair (investigation + fix)
  ratePerTileReplacement: 25, // Per tile replacement
  ratePerRidgeCapRepair: 35, // Per metre ridge cap repair
  
  // Minimum charges
  minCharge: 450, // Minimum call-out/job charge (higher due to setup)
  calloutFee: 150, // Call-out fee (includes ladder/safety setup)
  
  // Material markup
  materialMarkupPercent: 25, // Standard markup on materials
};

// ============================================================================
// COMMON ROOFING MATERIALS (Australian pricing)
// ============================================================================

export interface RoofingMaterial {
  name: string;
  category: string;
  supplier: string;
  unitLabel: string;
  unitCost: number;
  notes: string;
  coverage?: string;
}

export const ROOFER_DEFAULT_MATERIALS: RoofingMaterial[] = [
  // Colorbond/Metal Roofing
  {
    name: "Colorbond Corrugated Roofing (Custom Orb)",
    category: "Metal Roofing",
    supplier: "BlueScope/Stratco",
    unitLabel: "Lin m",
    unitCost: 28.00,
    notes: "Standard corrugated profile, various colours",
    coverage: "762mm cover width",
  },
  {
    name: "Colorbond Klip-Lok 700",
    category: "Metal Roofing",
    supplier: "BlueScope/Lysaght",
    unitLabel: "Lin m",
    unitCost: 35.00,
    notes: "Concealed fix panel, commercial grade",
    coverage: "700mm cover width",
  },
  {
    name: "Colorbond Trimdek",
    category: "Metal Roofing",
    supplier: "BlueScope/Lysaght",
    unitLabel: "Lin m",
    unitCost: 32.00,
    notes: "Popular residential/commercial profile",
    coverage: "762mm cover width",
  },
  {
    name: "Zincalume Corrugated Roofing",
    category: "Metal Roofing",
    supplier: "BlueScope",
    unitLabel: "Lin m",
    unitCost: 22.00,
    notes: "Unpainted zinc/aluminium coating",
    coverage: "762mm cover width",
  },
  
  // Roof Tiles
  {
    name: "Concrete Roof Tile (Standard Profile)",
    category: "Tiles",
    supplier: "Boral/Monier",
    unitLabel: "Each",
    unitCost: 2.80,
    notes: "Standard concrete tile",
    coverage: "Approx 10 tiles per m²",
  },
  {
    name: "Terracotta Roof Tile",
    category: "Tiles",
    supplier: "Boral/Monier",
    unitLabel: "Each",
    unitCost: 4.50,
    notes: "Premium terracotta tile",
    coverage: "Approx 10 tiles per m²",
  },
  {
    name: "Ridge Cap (Concrete)",
    category: "Tiles",
    supplier: "Boral/Monier",
    unitLabel: "Each",
    unitCost: 8.00,
    notes: "Ridge capping tile",
  },
  {
    name: "Ridge Cap (Terracotta)",
    category: "Tiles",
    supplier: "Boral/Monier",
    unitLabel: "Each",
    unitCost: 12.00,
    notes: "Premium terracotta ridge cap",
  },
  
  // Guttering and Downpipes
  {
    name: "Colorbond Quad Gutter 115mm",
    category: "Guttering",
    supplier: "Lysaght/Stratco",
    unitLabel: "Lin m",
    unitCost: 18.00,
    notes: "Standard quad profile gutter",
  },
  {
    name: "Colorbond Fascia Gutter 125mm",
    category: "Guttering",
    supplier: "Lysaght/Stratco",
    unitLabel: "Lin m",
    unitCost: 22.00,
    notes: "Fascia-mounted gutter profile",
  },
  {
    name: "Colorbond Square Downpipe 100x75mm",
    category: "Downpipes",
    supplier: "Lysaght/Stratco",
    unitLabel: "Lin m",
    unitCost: 15.00,
    notes: "Standard square downpipe",
  },
  {
    name: "Colorbond Round Downpipe 90mm",
    category: "Downpipes",
    supplier: "Lysaght/Stratco",
    unitLabel: "Lin m",
    unitCost: 12.00,
    notes: "Round profile downpipe",
  },
  {
    name: "Gutter Bracket/Clip",
    category: "Guttering",
    supplier: "Bunnings/Stratco",
    unitLabel: "Each",
    unitCost: 3.50,
    notes: "Gutter fixing bracket",
  },
  {
    name: "Downpipe Bracket",
    category: "Downpipes",
    supplier: "Bunnings/Stratco",
    unitLabel: "Each",
    unitCost: 4.00,
    notes: "Downpipe fixing bracket",
  },
  
  // Flashings
  {
    name: "Colorbond Barge Flashing",
    category: "Flashings",
    supplier: "Lysaght/Custom",
    unitLabel: "Lin m",
    unitCost: 25.00,
    notes: "Barge/verge flashing",
  },
  {
    name: "Colorbond Apron Flashing",
    category: "Flashings",
    supplier: "Lysaght/Custom",
    unitLabel: "Lin m",
    unitCost: 22.00,
    notes: "Wall-to-roof apron flashing",
  },
  {
    name: "Colorbond Valley Gutter",
    category: "Flashings",
    supplier: "Lysaght/Custom",
    unitLabel: "Lin m",
    unitCost: 28.00,
    notes: "Valley gutter flashing",
  },
  {
    name: "Lead Flashing 300mm",
    category: "Flashings",
    supplier: "Bunnings/Trade",
    unitLabel: "Lin m",
    unitCost: 35.00,
    notes: "Traditional lead flashing",
  },
  
  // Sarking and Underlays
  {
    name: "Sisalation Reflective Sarking",
    category: "Sarking",
    supplier: "CSR/Bunnings",
    unitLabel: "Roll (60m²)",
    unitCost: 120.00,
    notes: "Reflective foil sarking",
    coverage: "60m² per roll",
  },
  {
    name: "Anticon Roof Blanket (R1.8)",
    category: "Sarking",
    supplier: "CSR/Bradford",
    unitLabel: "Roll (20m²)",
    unitCost: 180.00,
    notes: "Insulated sarking blanket",
    coverage: "20m² per roll",
  },
  {
    name: "Pliable Building Membrane",
    category: "Sarking",
    supplier: "CSR/Bradford",
    unitLabel: "Roll (30m²)",
    unitCost: 85.00,
    notes: "Breathable wall wrap/sarking",
    coverage: "30m² per roll",
  },
  
  // Fixings
  {
    name: "Tek Screws 12g x 50mm (Box 500)",
    category: "Fixings",
    supplier: "Buildex/Bunnings",
    unitLabel: "Box",
    unitCost: 85.00,
    notes: "Self-drilling roof screws with seal",
  },
  {
    name: "Roof Nails 75mm Gal (Box 5kg)",
    category: "Fixings",
    supplier: "Non Brands/Trade",
    unitLabel: "Box",
    unitCost: 45.00,
    notes: "Galvanised roofing nails",
  },
  {
    name: "Silicone Roof Sealant 300ml",
    category: "Sealants",
    supplier: "Soudal/Bunnings",
    unitLabel: "Tube",
    unitCost: 12.00,
    notes: "UV-resistant roof sealant",
  },
  {
    name: "Flexi Point Pointing Compound 20kg",
    category: "Sealants",
    supplier: "Davco/Bunnings",
    unitLabel: "Bucket",
    unitCost: 65.00,
    notes: "Flexible pointing for ridge caps",
    coverage: "Approx 15-20 lm of ridge",
  },
  {
    name: "Roof & Gutter Silicone Clear 300ml",
    category: "Sealants",
    supplier: "Selleys/Bunnings",
    unitLabel: "Tube",
    unitCost: 15.00,
    notes: "Clear silicone for gutter joins",
  },
  
  // Roof Accessories
  {
    name: "Whirlybird Roof Ventilator",
    category: "Ventilation",
    supplier: "CSR/Bunnings",
    unitLabel: "Each",
    unitCost: 85.00,
    notes: "Wind-powered roof ventilator",
  },
  {
    name: "Roof Cowl Vent 150mm",
    category: "Ventilation",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Static roof vent cowl",
  },
  {
    name: "Skylight 600x600 Fixed",
    category: "Skylights",
    supplier: "Velux/CSR",
    unitLabel: "Each",
    unitCost: 450.00,
    notes: "Fixed skylight unit",
  },
];

// ============================================================================
// AUSTRALIAN COMPLIANCE INFORMATION
// ============================================================================

export const ROOFER_COMPLIANCE = {
  // Building Code of Australia references
  bca: {
    standard: "Building Code of Australia (BCA/NCC)",
    relevantSections: [
      "Part 3.5.1 - Roof and wall cladding",
      "Part 3.5.2 - Roof plumbing (gutters, downpipes)",
      "Part 3.5.3 - Sarking",
      "Part 3.8.1 - Wet areas",
      "Specification P2.1 - Weatherproofing",
    ],
    notes: "Roof installations must comply with BCA requirements for weatherproofing, structural adequacy, and bushfire ratings where applicable.",
  },
  
  // Australian Standards
  standards: [
    {
      code: "AS 1562.1",
      title: "Design and installation of sheet roof and wall cladding - Metal",
      description: "Primary standard for metal roofing installation",
    },
    {
      code: "AS 1562.2",
      title: "Design and installation of sheet roof and wall cladding - Corrugated fibre-cement",
      description: "Standard for fibre-cement roofing",
    },
    {
      code: "AS 4200.2",
      title: "Pliable building membranes and underlays - Installation",
      description: "Standard for sarking installation",
    },
    {
      code: "AS 3959",
      title: "Construction of buildings in bushfire-prone areas",
      description: "Bushfire Attack Level (BAL) requirements for roofing",
    },
    {
      code: "AS/NZS 3500.3",
      title: "Plumbing and drainage - Stormwater drainage",
      description: "Standard for roof drainage systems",
    },
  ],
  
  // SafeWork requirements - CRITICAL for roofing
  safeWork: {
    requirements: [
      "Working at Heights permit/procedures (mandatory above 2m)",
      "Fall protection systems (guardrails, harnesses, anchor points)",
      "Edge protection during installation",
      "Fragile roof procedures (skylights, old fibro)",
      "Weather monitoring (no work in high winds/rain)",
      "Tool tethering to prevent falling objects",
      "Emergency rescue plan",
      "Asbestos awareness (older roof removal)",
    ],
    ppe: [
      "Safety harness and lanyard (when required)",
      "Non-slip safety footwear",
      "Hard hat",
      "Safety glasses",
      "Work gloves",
      "High-visibility clothing",
      "Sun protection (hat, sunscreen)",
    ],
    certifications: [
      "Working at Heights certification",
      "Confined Space (if roof void work)",
      "Asbestos Awareness (for removal work)",
      "First Aid",
    ],
  },
  
  // Bushfire requirements
  bushfire: {
    requirement: "Roofing must comply with AS 3959 in designated bushfire-prone areas",
    balRatings: [
      "BAL-LOW: Standard construction",
      "BAL-12.5: Basic protection measures",
      "BAL-19: Increased protection",
      "BAL-29: Enhanced protection required",
      "BAL-40: Significant protection",
      "BAL-FZ: Flame Zone - specialist construction",
    ],
    notes: "Check local council for Bushfire Attack Level designation. Metal roofing generally suitable to BAL-40.",
  },
  
  // Warranty requirements
  warranty: {
    manufacturer: [
      "BlueScope Colorbond: 36 years (non-coastal), varies by environment",
      "Boral Tiles: 50+ year structural warranty",
      "Monier Tiles: 50 year warranty",
    ],
    workmanship: "Typical 10-15 years for metal, 20+ years for tiles (when professionally installed)",
    voidConditions: [
      "Incorrect fastener type or spacing",
      "Incompatible metals causing corrosion",
      "Inadequate fall/drainage",
      "Improper flashing installation",
    ],
  },
};

// ============================================================================
// AI PROMPT ENHANCEMENTS FOR ROOFING
// ============================================================================

export const ROOFER_AI_CONTEXT = {
  // Trade-specific context for AI document generation
  tradeDescription: "professional roofing contractor specializing in roof installation, repairs, replacement, guttering, and waterproofing",
  
  // Common scope items for roofing
  commonScopeItems: [
    "Remove existing roof sheeting/tiles",
    "Install new Colorbond/metal roofing",
    "Install new roof tiles",
    "Replace sarking/underlay",
    "Install valley gutters",
    "Install barge and apron flashings",
    "Replace gutters and downpipes",
    "Install ridge capping",
    "Repoint and rebed ridge caps",
    "Repair roof leaks",
    "Install whirlybird ventilators",
    "Install skylights",
    "Dispose of old roofing materials",
  ],
  
  // Standard inclusions for roofing quotes
  standardInclusions: [
    "Supply of all roofing materials (as specified)",
    "Removal of existing roofing (if applicable)",
    "Installation of sarking/underlay",
    "All necessary flashings",
    "Gutters and downpipes (as specified)",
    "All fixings and sealants",
    "Waste removal and site cleanup",
    "Working at Heights safety equipment",
    "Workmanship warranty (typically 10 years)",
    "Manufacturer warranty registration",
  ],
  
  // Standard exclusions for roofing quotes
  standardExclusions: [
    "Structural repairs to roof framing",
    "Fascia and soffit replacement (unless specified)",
    "Electrical work (solar, antennas)",
    "Ceiling repairs (access damage)",
    "Asbestos removal (specialist required)",
    "Building permit (if required)",
    "Scaffolding (if extensive - priced separately)",
    "Painting of new gutters/flashings",
    "Stormwater drainage below ground",
  ],
  
  // Roofing types
  roofingTypes: {
    colorbondCorrugated: "Most common residential, cost-effective, 762mm cover",
    colorbondTrimdek: "Popular for residential and commercial, clean lines",
    colorbondKlipLok: "Concealed fix, commercial grade, no exposed fasteners",
    concreteTiles: "Durable, traditional look, heavier (requires structural adequacy)",
    terracottaTiles: "Premium appearance, long lifespan, requires periodic maintenance",
    metalDecking: "Commercial/industrial, spans greater distances",
  },
  
  // Safety considerations for SWMS - CRITICAL
  safetyHazards: [
    "Falls from height (primary hazard - above 2m requires controls)",
    "Fragile roofing materials (skylights, old fibro)",
    "Falling objects (tools, materials)",
    "Manual handling - roofing sheets and tiles",
    "Heat stress - working on hot roof surfaces",
    "Electrical hazards - overhead powerlines, solar panels",
    "Unstable work surfaces (steep pitch, wet surfaces)",
    "Weather conditions (wind, rain, storms)",
    "Asbestos exposure (older roof removal)",
    "Sharp edges - metal sheeting",
  ],
  
  // Safety controls required
  safetyControls: [
    "Fall arrest systems (harness, anchor points) above 2m",
    "Edge protection/guardrails where practical",
    "Scaffold or EWP for access where appropriate",
    "Tool tethering to prevent drops",
    "Exclusion zones below work area",
    "Weather monitoring - cease work in unsafe conditions",
    "Adequate hydration and rest breaks",
    "Emergency rescue plan and equipment",
  ],
  
  // Maintenance guidance
  maintenanceGuidance: {
    metalRoofing: {
      inspection: "Annual visual inspection for loose screws, rust spots, debris",
      cleaning: "Remove debris from valleys and gutters twice yearly",
      repairs: "Address rust spots early with rust converter and touch-up paint",
      recoating: "Consider recoating after 15-20 years if coating degraded",
    },
    tiledRoofing: {
      inspection: "Annual inspection for cracked/broken tiles, pointing condition",
      cleaning: "Remove moss/lichen buildup (can use low-pressure wash)",
      repointing: "Ridge caps typically need repointing every 15-25 years",
      replacement: "Replace broken tiles promptly to prevent water ingress",
    },
    gutters: {
      cleaning: "Clean gutters minimum twice yearly (more near trees)",
      inspection: "Check for rust, sagging, leaking joints",
      repairs: "Reseal joints as needed, replace rusted sections",
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default rate template for roofers
 */
export function getRooferDefaultRateTemplate() {
  return {
    name: "Roofer - Standard Rates",
    tradeType: "Roofer",
    propertyType: null,
    hourlyRate: ROOFER_DEFAULT_RATES.hourlyRate,
    helperHourlyRate: ROOFER_DEFAULT_RATES.helperHourlyRate,
    dayRate: ROOFER_DEFAULT_RATES.dayRate,
    calloutFee: ROOFER_DEFAULT_RATES.calloutFee,
    minCharge: ROOFER_DEFAULT_RATES.minCharge,
    ratePerM2Interior: null, // Not applicable
    ratePerM2Exterior: ROOFER_DEFAULT_RATES.ratePerM2MetalRoofNew,
    ratePerLmTrim: ROOFER_DEFAULT_RATES.ratePerM2GutterReplace,
    materialMarkupPercent: ROOFER_DEFAULT_RATES.materialMarkupPercent,
    isDefault: true,
  };
}

/**
 * Get roofer-specific AI system prompt enhancement
 */
export function getRooferSystemPromptContext(): string {
  return `
Trade-Specific Context (Roofer):
- This is a roofing job in Australia
- Common work includes: metal roofing (Colorbond), tile roofing, repairs, guttering, flashings
- SAFETY CRITICAL: Working at heights regulations apply - fall protection mandatory above 2m
- Materials: Colorbond (corrugated, Trimdek, Klip-Lok), concrete tiles, terracotta tiles
- Must comply with AS 1562 (Sheet roofing) and Building Code of Australia Part 3.5
- Sarking requirements: AS 4200.2 for pliable membranes
- Bushfire areas: May require BAL-rated roofing per AS 3959
- Guttering must comply with AS/NZS 3500.3 for stormwater drainage
- Manufacturer warranties (e.g., Colorbond 36 years) require correct installation
- Standard workmanship warranty: 10-15 years for metal, 20+ years for tiles
- Working at Heights certification required for installers
`;
}

/**
 * Calculate estimated roofing materials
 */
export function estimateRoofingMaterials(params: {
  roofAreaM2?: number;
  gutterLinearM?: number;
  downpipeCount?: number;
  ridgeLinearM?: number;
  valleyLinearM?: number;
  roofType?: "metal" | "tile";
  isReroof?: boolean;
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  // Calculate roofing sheets/tiles
  if (params.roofAreaM2) {
    const wastage = params.isReroof ? 1.15 : 1.1; // 15% for re-roof, 10% new
    
    if (params.roofType === "tile") {
      const tilesPerM2 = 10;
      const tileCount = Math.ceil(params.roofAreaM2 * tilesPerM2 * wastage);
      materials.push({ item: "Concrete Roof Tile", quantity: tileCount, unit: "tiles" });
    } else {
      // Metal roofing - estimate by area (sheets vary in length)
      const sheetCoverWidth = 0.762; // metres
      const avgSheetLength = 6; // assume 6m average
      const sheetArea = sheetCoverWidth * avgSheetLength;
      const sheetCount = Math.ceil((params.roofAreaM2 * wastage) / sheetArea);
      materials.push({ item: "Colorbond Corrugated Roofing", quantity: sheetCount * avgSheetLength, unit: "lin m" });
    }
    
    // Sarking
    const sarkingRollM2 = 60;
    const sarkingRolls = Math.ceil((params.roofAreaM2 * wastage) / sarkingRollM2);
    materials.push({ item: "Sisalation Reflective Sarking", quantity: sarkingRolls, unit: "rolls" });
    
    // Screws for metal (approx 8 per m²)
    if (params.roofType !== "tile") {
      const screwBoxes = Math.ceil((params.roofAreaM2 * 8) / 500);
      materials.push({ item: "Tek Screws 12g x 50mm", quantity: screwBoxes, unit: "boxes" });
    }
  }
  
  // Guttering
  if (params.gutterLinearM) {
    const gutterLength = Math.ceil(params.gutterLinearM * 1.05);
    materials.push({ item: "Colorbond Quad Gutter 115mm", quantity: gutterLength, unit: "lin m" });
    
    // Brackets (every 900mm)
    const brackets = Math.ceil(params.gutterLinearM / 0.9);
    materials.push({ item: "Gutter Bracket/Clip", quantity: brackets, unit: "each" });
  }
  
  // Downpipes
  if (params.downpipeCount) {
    const avgDownpipeLength = 4; // metres average
    materials.push({ item: "Colorbond Square Downpipe 100x75mm", quantity: params.downpipeCount * avgDownpipeLength, unit: "lin m" });
    materials.push({ item: "Downpipe Bracket", quantity: params.downpipeCount * 3, unit: "each" });
  }
  
  // Ridge capping
  if (params.ridgeLinearM) {
    const ridgeLength = Math.ceil(params.ridgeLinearM * 1.1);
    if (params.roofType === "tile") {
      materials.push({ item: "Ridge Cap (Concrete)", quantity: Math.ceil(ridgeLength * 3), unit: "each" });
      materials.push({ item: "Flexi Point Pointing Compound", quantity: Math.ceil(ridgeLength / 15), unit: "buckets" });
    } else {
      materials.push({ item: "Colorbond Ridge Capping", quantity: ridgeLength, unit: "lin m" });
    }
  }
  
  // Valley gutters
  if (params.valleyLinearM) {
    materials.push({ item: "Colorbond Valley Gutter", quantity: Math.ceil(params.valleyLinearM * 1.1), unit: "lin m" });
  }
  
  // Sealant
  materials.push({ item: "Silicone Roof Sealant 300ml", quantity: Math.max(2, Math.ceil((params.roofAreaM2 || 0) / 50)), unit: "tubes" });
  
  return materials;
}

/**
 * Get Bushfire Attack Level requirements
 */
export function getBushfireRequirements(balRating: string): {
  roofingRequirements: string[];
  allowedMaterials: string[];
} {
  const requirements: Record<string, { roofingRequirements: string[]; allowedMaterials: string[] }> = {
    "BAL-LOW": {
      roofingRequirements: ["Standard construction methods"],
      allowedMaterials: ["Any roofing material complying with BCA"],
    },
    "BAL-12.5": {
      roofingRequirements: [
        "Roof covering must be non-combustible or bushfire-resisting timber",
        "All gaps > 3mm in roof covering must be sealed",
      ],
      allowedMaterials: ["Metal roofing (Colorbond, Zincalume)", "Concrete tiles", "Terracotta tiles"],
    },
    "BAL-19": {
      roofingRequirements: [
        "Roof covering must be non-combustible",
        "All gaps > 3mm sealed",
        "Sarking must be non-combustible where exposed",
      ],
      allowedMaterials: ["Metal roofing", "Concrete tiles", "Terracotta tiles"],
    },
    "BAL-29": {
      roofingRequirements: [
        "Roof covering must be non-combustible",
        "All gaps sealed",
        "Sarking must be non-combustible",
        "Valleys/gutters must prevent debris accumulation",
      ],
      allowedMaterials: ["Metal roofing", "Concrete tiles", "Terracotta tiles"],
    },
    "BAL-40": {
      roofingRequirements: [
        "Roof covering must be non-combustible",
        "All openings protected with ember guards",
        "Non-combustible sarking required",
        "Specific gutter mesh requirements",
      ],
      allowedMaterials: ["Metal roofing (0.42mm BMT minimum)", "Concrete tiles", "Terracotta tiles"],
    },
    "BAL-FZ": {
      roofingRequirements: [
        "Full compliance with AS 3959 Section 9",
        "Heavy-duty non-combustible construction",
        "Specialist design certification required",
      ],
      allowedMaterials: ["Metal roofing (0.42mm BMT minimum)", "Specific compliant tiles only"],
    },
  };
  
  return requirements[balRating] || requirements["BAL-LOW"];
}
