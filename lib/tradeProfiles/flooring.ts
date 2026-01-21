/**
 * Flooring Installer Trade Profile Configuration for OMNEXORA
 * 
 * This module provides flooring-specific configuration including:
 * - Default rates and pricing for flooring installation
 * - Common materials with Australian pricing (Quick-Step, Godfrey Hirst, timber, vinyl, carpet)
 * - Compliance and safety information (AS 1884, AS 4586)
 * - Document templates and AI prompt enhancements
 * 
 * Compliance References:
 * - AS 1884 - Floor coverings - Resilient sheet and tiles
 * - AS 4586 - Slip resistance classification of new pedestrian surface materials
 * - AS/NZS 2455 - Textile floor coverings
 * - Building Code of Australia (BCA/NCC)
 * - State-based SafeWork regulations
 */

// ============================================================================
// FLOORING DEFAULT RATES (Australian market rates 2024-2026)
// ============================================================================

export const FLOORING_DEFAULT_RATES = {
  // Hourly rates
  hourlyRate: 70, // Flooring installer hourly rate
  helperHourlyRate: 45, // Trade assistant rate
  dayRate: 550, // Full day rate
  
  // Timber/Laminate flooring per m²
  ratePerM2TimberSupplyInstall: 130, // Engineered timber supply + install
  ratePerM2TimberLabourOnly: 45, // Timber flooring labour only
  ratePerM2LaminateSupplyInstall: 75, // Laminate supply + install
  ratePerM2LaminateLabourOnly: 35, // Laminate labour only
  ratePerM2SolidTimberSupplyInstall: 180, // Solid timber supply + install
  ratePerM2SolidTimberLabourOnly: 65, // Solid timber labour only (sand/polish included)
  
  // Vinyl/LVP flooring per m²
  ratePerM2LVPSupplyInstall: 95, // Luxury Vinyl Plank supply + install
  ratePerM2LVPLabourOnly: 35, // LVP labour only
  ratePerM2VinylSheetSupplyInstall: 75, // Vinyl sheet supply + install
  ratePerM2VinylSheetLabourOnly: 30, // Vinyl sheet labour only
  ratePerM2CommercialVinyl: 120, // Commercial grade vinyl
  
  // Carpet per m²
  ratePerM2CarpetSupplyInstall: 85, // Standard carpet supply + install
  ratePerM2CarpetLabourOnly: 25, // Carpet labour only (incl. underlay)
  ratePerM2PremiumCarpet: 140, // Premium/wool carpet supply + install
  ratePerM2CarpetTiles: 95, // Carpet tiles supply + install
  
  // Tiles per m²
  ratePerM2TilesSupplyInstall: 120, // Floor tiles supply + install
  ratePerM2TilesLabourOnly: 65, // Tile laying labour only
  ratePerM2LargeFormatTiles: 85, // Large format (600x600+) labour premium
  ratePerM2Herringbone: 95, // Herringbone/parquetry pattern labour
  
  // Preparation work per m²
  ratePerM2SubfloorPrep: 25, // Subfloor preparation
  ratePerM2Levelling: 35, // Self-levelling compound
  ratePerM2MoistureBarrier: 12, // Moisture barrier installation
  ratePerM2UnderlayInstall: 8, // Underlay installation
  ratePerM2FurnitureMove: 15, // Furniture moving (per m² of floor area)
  
  // Per-lineal-metre rates
  ratePerLmSkirting: 18, // Skirting supply + install
  ratePerLmSkirtingLabourOnly: 12, // Skirting labour only
  ratePerLmScotia: 8, // Scotia/quadrant moulding
  ratePerLmThreshold: 45, // Threshold/transition strip
  ratePerLmStairNosing: 65, // Stair nosing per tread
  
  // Floor sanding and polishing per m²
  ratePerM2SandPolish: 55, // Sand and 3-coat polyurethane
  ratePerM2SandOnly: 35, // Sanding only
  ratePerM2RecoatOnly: 25, // Recoat (light sand + 1 coat)
  ratePerM2StainFinish: 15, // Stain application (additional)
  
  // Removal/disposal per m²
  ratePerM2CarpetRemoval: 12, // Old carpet removal and disposal
  ratePerM2TileRemoval: 35, // Tile removal
  ratePerM2TimberRemoval: 25, // Timber floor removal
  ratePerM2VinylRemoval: 15, // Vinyl removal
  
  // Minimum charges
  minCharge: 450, // Minimum job charge
  calloutFee: 85, // Measure/quote fee (often deducted from job)
  smallRoomMinimum: 250, // Minimum charge for rooms under 10m²
  
  // Material markup
  materialMarkupPercent: 25, // Standard markup on materials
};

// ============================================================================
// COMMON FLOORING MATERIALS (Australian pricing)
// ============================================================================

export interface FlooringMaterial {
  name: string;
  category: string;
  supplier: string;
  unitLabel: string;
  unitCost: number;
  notes: string;
  thickness?: string;
  wearLayer?: string;
  warranty?: string;
}

export const FLOORING_DEFAULT_MATERIALS: FlooringMaterial[] = [
  // Laminate Flooring
  {
    name: "Quick-Step Eligna 8mm",
    category: "Laminate",
    supplier: "Quick-Step",
    unitLabel: "m²",
    unitCost: 38.00,
    notes: "Entry-level laminate, AC4 rating",
    thickness: "8mm",
    warranty: "20 years residential",
  },
  {
    name: "Quick-Step Impressive 8mm",
    category: "Laminate",
    supplier: "Quick-Step",
    unitLabel: "m²",
    unitCost: 48.00,
    notes: "Popular mid-range, wide plank",
    thickness: "8mm",
    warranty: "25 years residential",
  },
  {
    name: "Quick-Step Majestic 9.5mm",
    category: "Laminate",
    supplier: "Quick-Step",
    unitLabel: "m²",
    unitCost: 65.00,
    notes: "Premium laminate, long planks",
    thickness: "9.5mm",
    warranty: "Lifetime residential",
  },
  {
    name: "Krono Original 8mm",
    category: "Laminate",
    supplier: "Krono",
    unitLabel: "m²",
    unitCost: 32.00,
    notes: "Budget laminate, AC4",
    thickness: "8mm",
    warranty: "15 years residential",
  },
  {
    name: "Pergo Sensation 9mm",
    category: "Laminate",
    supplier: "Pergo",
    unitLabel: "m²",
    unitCost: 55.00,
    notes: "Premium European laminate",
    thickness: "9mm",
    warranty: "Lifetime residential",
  },
  
  // Engineered Timber
  {
    name: "Oakdale Engineered Oak 14mm",
    category: "Engineered Timber",
    supplier: "Oakdale",
    unitLabel: "m²",
    unitCost: 85.00,
    notes: "3mm oak veneer, click lock",
    thickness: "14mm",
    wearLayer: "3mm",
    warranty: "25 years structural",
  },
  {
    name: "Quick-Step Palazzo Oak 14mm",
    category: "Engineered Timber",
    supplier: "Quick-Step",
    unitLabel: "m²",
    unitCost: 110.00,
    notes: "Premium engineered oak",
    thickness: "14mm",
    wearLayer: "3.5mm",
    warranty: "Lifetime structural",
  },
  {
    name: "Embelton Bamboo Strand 14mm",
    category: "Engineered Timber",
    supplier: "Embelton",
    unitLabel: "m²",
    unitCost: 75.00,
    notes: "Strand woven bamboo",
    thickness: "14mm",
    warranty: "25 years",
  },
  {
    name: "Australian Species Engineered 15mm",
    category: "Engineered Timber",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 120.00,
    notes: "Spotted Gum, Blackbutt, Jarrah",
    thickness: "15mm",
    wearLayer: "4mm",
    warranty: "25 years structural",
  },
  {
    name: "European Oak Herringbone 15mm",
    category: "Engineered Timber",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 140.00,
    notes: "Herringbone/parquetry pattern",
    thickness: "15mm",
    wearLayer: "4mm",
    warranty: "25 years structural",
  },
  
  // Solid Timber
  {
    name: "Solid Blackbutt 19mm",
    category: "Solid Timber",
    supplier: "Boral/Various",
    unitLabel: "m²",
    unitCost: 95.00,
    notes: "Australian hardwood, T&G",
    thickness: "19mm",
    warranty: "Lifetime (structural)",
  },
  {
    name: "Solid Spotted Gum 19mm",
    category: "Solid Timber",
    supplier: "Boral/Various",
    unitLabel: "m²",
    unitCost: 105.00,
    notes: "Premium Australian hardwood",
    thickness: "19mm",
    warranty: "Lifetime (structural)",
  },
  {
    name: "Solid Jarrah 19mm",
    category: "Solid Timber",
    supplier: "WA suppliers",
    unitLabel: "m²",
    unitCost: 120.00,
    notes: "WA premium hardwood",
    thickness: "19mm",
    warranty: "Lifetime (structural)",
  },
  {
    name: "Solid Tasmanian Oak 19mm",
    category: "Solid Timber",
    supplier: "Tas suppliers",
    unitLabel: "m²",
    unitCost: 85.00,
    notes: "Popular solid timber",
    thickness: "19mm",
    warranty: "Lifetime (structural)",
  },
  
  // Luxury Vinyl Plank (LVP/SPC/WPC)
  {
    name: "Hybrid/SPC 6.5mm Click",
    category: "Vinyl Plank",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 45.00,
    notes: "Stone core, waterproof",
    thickness: "6.5mm",
    wearLayer: "0.5mm",
    warranty: "20 years residential",
  },
  {
    name: "Quick-Step Alpha 5mm",
    category: "Vinyl Plank",
    supplier: "Quick-Step",
    unitLabel: "m²",
    unitCost: 55.00,
    notes: "Premium LVP, waterproof",
    thickness: "5mm",
    wearLayer: "0.55mm",
    warranty: "25 years residential",
  },
  {
    name: "Karndean LooseLay 4.5mm",
    category: "Vinyl Plank",
    supplier: "Karndean",
    unitLabel: "m²",
    unitCost: 75.00,
    notes: "Premium loose lay vinyl",
    thickness: "4.5mm",
    wearLayer: "0.5mm",
    warranty: "20 years residential",
  },
  {
    name: "Polyflor Expona 2.5mm",
    category: "Vinyl Plank",
    supplier: "Polyflor",
    unitLabel: "m²",
    unitCost: 65.00,
    notes: "Commercial grade glue-down",
    thickness: "2.5mm",
    wearLayer: "0.7mm",
    warranty: "15 years commercial",
  },
  {
    name: "Gerflor Senso Lock 4mm",
    category: "Vinyl Plank",
    supplier: "Gerflor",
    unitLabel: "m²",
    unitCost: 48.00,
    notes: "Mid-range click vinyl",
    thickness: "4mm",
    wearLayer: "0.3mm",
    warranty: "15 years residential",
  },
  
  // Vinyl Sheet
  {
    name: "Tarkett Cushion Vinyl 2mm",
    category: "Vinyl Sheet",
    supplier: "Tarkett",
    unitLabel: "m²",
    unitCost: 28.00,
    notes: "Budget cushioned vinyl",
    thickness: "2mm",
    warranty: "10 years",
  },
  {
    name: "Armstrong Accolade 2.5mm",
    category: "Vinyl Sheet",
    supplier: "Armstrong",
    unitLabel: "m²",
    unitCost: 42.00,
    notes: "Mid-range sheet vinyl",
    thickness: "2.5mm",
    warranty: "15 years",
  },
  {
    name: "Polyflor Polysafe 2mm",
    category: "Vinyl Sheet",
    supplier: "Polyflor",
    unitLabel: "m²",
    unitCost: 55.00,
    notes: "Commercial safety flooring",
    thickness: "2mm",
    wearLayer: "0.7mm",
    warranty: "15 years commercial",
  },
  
  // Carpet
  {
    name: "Godfrey Hirst Hycraft Nylon",
    category: "Carpet",
    supplier: "Godfrey Hirst",
    unitLabel: "m²",
    unitCost: 45.00,
    notes: "Quality solution-dyed nylon",
    warranty: "15 years residential",
  },
  {
    name: "Godfrey Hirst Eco+ Range",
    category: "Carpet",
    supplier: "Godfrey Hirst",
    unitLabel: "m²",
    unitCost: 38.00,
    notes: "Recycled content, budget",
    warranty: "10 years residential",
  },
  {
    name: "Feltex Awaken Plush",
    category: "Carpet",
    supplier: "Feltex",
    unitLabel: "m²",
    unitCost: 55.00,
    notes: "Premium plush carpet",
    warranty: "15 years residential",
  },
  {
    name: "Cavalier Bremworth Wool",
    category: "Carpet",
    supplier: "Cavalier Bremworth",
    unitLabel: "m²",
    unitCost: 95.00,
    notes: "NZ wool premium carpet",
    warranty: "20 years residential",
  },
  {
    name: "Shaw Commercial Loop Pile",
    category: "Carpet",
    supplier: "Shaw",
    unitLabel: "m²",
    unitCost: 48.00,
    notes: "Commercial grade loop",
    warranty: "10 years commercial",
  },
  {
    name: "Interface Carpet Tiles",
    category: "Carpet Tiles",
    supplier: "Interface",
    unitLabel: "m²",
    unitCost: 65.00,
    notes: "Premium carpet tiles",
    warranty: "15 years",
  },
  
  // Floor Tiles
  {
    name: "Porcelain Tile 600x600",
    category: "Floor Tiles",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 45.00,
    notes: "Standard rectified porcelain",
  },
  {
    name: "Porcelain Tile 600x1200",
    category: "Floor Tiles",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 55.00,
    notes: "Large format porcelain",
  },
  {
    name: "Ceramic Floor Tile 300x300",
    category: "Floor Tiles",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 28.00,
    notes: "Budget ceramic tile",
  },
  {
    name: "Natural Stone Tile",
    category: "Floor Tiles",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 85.00,
    notes: "Travertine, marble, slate",
  },
  {
    name: "Terrazzo Look Porcelain",
    category: "Floor Tiles",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 65.00,
    notes: "Terrazzo effect tiles",
  },
  
  // Underlay
  {
    name: "Foam Underlay 2mm",
    category: "Underlay",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 3.50,
    notes: "Basic foam for laminate",
  },
  {
    name: "Foam Underlay 3mm",
    category: "Underlay",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 5.00,
    notes: "Standard laminate underlay",
  },
  {
    name: "Acoustic Underlay 5mm",
    category: "Underlay",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 12.00,
    notes: "Sound reduction underlay",
  },
  {
    name: "Rubber Underlay 10mm",
    category: "Underlay",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 18.00,
    notes: "Premium carpet underlay",
  },
  {
    name: "Plywood Underlay 6mm",
    category: "Underlay",
    supplier: "Bunnings/timber",
    unitLabel: "m²",
    unitCost: 15.00,
    notes: "For uneven subfloors",
  },
  {
    name: "Cork Underlay 2mm",
    category: "Underlay",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 8.00,
    notes: "Natural cork underlay",
  },
  
  // Moisture Barriers
  {
    name: "Polyethylene Moisture Barrier 200um",
    category: "Moisture Barrier",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 2.50,
    notes: "Standard concrete barrier",
  },
  {
    name: "Combined Underlay + Moisture Barrier",
    category: "Moisture Barrier",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 8.00,
    notes: "2-in-1 product",
  },
  {
    name: "Epoxy Moisture Barrier",
    category: "Moisture Barrier",
    supplier: "Various",
    unitLabel: "m²",
    unitCost: 35.00,
    notes: "High moisture situations",
  },
  
  // Preparation Products
  {
    name: "Self-Levelling Compound 20kg",
    category: "Preparation",
    supplier: "Ardex/Mapei",
    unitLabel: "Bag",
    unitCost: 55.00,
    notes: "Covers approx 4-5m² at 3mm",
  },
  {
    name: "Floor Primer 15L",
    category: "Preparation",
    supplier: "Ardex/Mapei",
    unitLabel: "Drum",
    unitCost: 85.00,
    notes: "Subfloor primer",
  },
  {
    name: "Patching Compound 5kg",
    category: "Preparation",
    supplier: "Various",
    unitLabel: "Tub",
    unitCost: 28.00,
    notes: "Filling holes/cracks",
  },
  {
    name: "Concrete Grinder Hire (per day)",
    category: "Equipment Hire",
    supplier: "Hire shops",
    unitLabel: "Day",
    unitCost: 180.00,
    notes: "For grinding high spots",
  },
  
  // Adhesives
  {
    name: "Vinyl Adhesive 15L",
    category: "Adhesives",
    supplier: "Various",
    unitLabel: "Drum",
    unitCost: 120.00,
    notes: "Covers approx 40-50m²",
  },
  {
    name: "Carpet Adhesive 15L",
    category: "Adhesives",
    supplier: "Various",
    unitLabel: "Drum",
    unitCost: 95.00,
    notes: "Direct stick carpet",
  },
  {
    name: "Timber Flooring Adhesive 16kg",
    category: "Adhesives",
    supplier: "Bona/Sika",
    unitLabel: "Pail",
    unitCost: 180.00,
    notes: "Flexible timber adhesive",
  },
  {
    name: "Tile Adhesive 20kg",
    category: "Adhesives",
    supplier: "Ardex/Mapei",
    unitLabel: "Bag",
    unitCost: 45.00,
    notes: "Flexible floor tile adhesive",
  },
  
  // Finishing
  {
    name: "Polyurethane Floor Finish 10L",
    category: "Finishes",
    supplier: "Bona/Polycure",
    unitLabel: "Drum",
    unitCost: 280.00,
    notes: "Water-based poly, 3 coats",
  },
  {
    name: "Timber Floor Stain 4L",
    category: "Finishes",
    supplier: "Feast Watson/Intergrain",
    unitLabel: "Can",
    unitCost: 85.00,
    notes: "Various colours available",
  },
  {
    name: "Hardwax Oil 2.5L",
    category: "Finishes",
    supplier: "Osmo/Rubio",
    unitLabel: "Can",
    unitCost: 165.00,
    notes: "Natural oil finish",
  },
  {
    name: "Tile Grout 5kg",
    category: "Finishes",
    supplier: "Ardex/Mapei",
    unitLabel: "Bag",
    unitCost: 35.00,
    notes: "Flexible floor grout",
  },
  
  // Trims and Accessories
  {
    name: "Skirting MDF 90mm (per lm)",
    category: "Trims",
    supplier: "Bunnings",
    unitLabel: "Lin m",
    unitCost: 4.50,
    notes: "Pre-primed MDF",
  },
  {
    name: "Scotia/Quadrant (per lm)",
    category: "Trims",
    supplier: "Various",
    unitLabel: "Lin m",
    unitCost: 2.50,
    notes: "Quarter round moulding",
  },
  {
    name: "Transition Strip Aluminium",
    category: "Trims",
    supplier: "Various",
    unitLabel: "Each (900mm)",
    unitCost: 25.00,
    notes: "Same level transition",
  },
  {
    name: "Reducer Strip",
    category: "Trims",
    supplier: "Various",
    unitLabel: "Each (900mm)",
    unitCost: 28.00,
    notes: "Height transition strip",
  },
  {
    name: "Stair Nosing Aluminium",
    category: "Trims",
    supplier: "Various",
    unitLabel: "Each (900mm)",
    unitCost: 45.00,
    notes: "Stair edge protection",
  },
  {
    name: "Carpet Gripper (per lm)",
    category: "Carpet Installation",
    supplier: "Various",
    unitLabel: "Lin m",
    unitCost: 2.00,
    notes: "Tack strip for carpet",
  },
  {
    name: "Carpet Door Bar",
    category: "Carpet Installation",
    supplier: "Various",
    unitLabel: "Each",
    unitCost: 18.00,
    notes: "Carpet threshold bar",
  },
];

// ============================================================================
// AUSTRALIAN COMPLIANCE INFORMATION
// ============================================================================

export const FLOORING_COMPLIANCE = {
  // Australian Standards
  standards: [
    {
      code: "AS 1884",
      title: "Floor coverings - Resilient sheet and tiles - Laying and maintenance",
      description: "Installation standards for vinyl and resilient flooring",
      mandatory: true,
    },
    {
      code: "AS/NZS 2455.1",
      title: "Textile floor coverings - Installation practice",
      description: "Carpet installation standards",
      mandatory: true,
    },
    {
      code: "AS 4586",
      title: "Slip resistance classification of new pedestrian surface materials",
      description: "Slip rating requirements (P rating, R rating)",
      mandatory: true,
    },
    {
      code: "AS/NZS 4858",
      title: "Wet area membranes - Installation",
      description: "Waterproofing before tiling in wet areas",
      mandatory: true,
    },
    {
      code: "AS 3958.1",
      title: "Ceramic tiles - Guide to the installation",
      description: "Floor and wall tile installation",
      mandatory: true,
    },
    {
      code: "AS 1905.1",
      title: "Components for the protection of openings in fire-resistant walls",
      description: "Fire door thresholds and floor requirements",
      mandatory: false,
    },
  ],

  // Slip Resistance Requirements
  slipResistance: {
    classification: "Floors must meet slip resistance requirements per AS 4586",
    ratings: [
      {
        rating: "P3",
        description: "Dry internal floors, offices, retail",
        rampAngle: "12-19°",
      },
      {
        rating: "P4",
        description: "Commercial kitchens, change rooms, entries",
        rampAngle: "19-27°",
      },
      {
        rating: "P5",
        description: "External areas, pool surrounds, showers",
        rampAngle: "27-35°",
      },
    ],
    rRatings: [
      { rating: "R9", description: "Level internal areas, low slip risk" },
      { rating: "R10", description: "Toilets, bathrooms, kitchens" },
      { rating: "R11", description: "Commercial kitchens, entries" },
      { rating: "R12", description: "Industrial areas, external ramps" },
      { rating: "R13", description: "High slip risk industrial" },
    ],
    notes: "Check BCA requirements for specific applications. Aged care, hospitals, and public buildings have strict requirements.",
  },

  // Subfloor Requirements
  subfloorRequirements: {
    moisture: {
      requirement: "Concrete subfloors must meet moisture requirements before flooring",
      testMethods: [
        "Relative Humidity (RH) test - max 75% typically",
        "Moisture meter reading",
        "Plastic sheet test (48 hours)",
      ],
      solutions: [
        "Wait for slab to dry (1 month per 25mm)",
        "Apply moisture barrier",
        "Use appropriate adhesive",
        "Install floating system",
      ],
    },
    flatness: {
      requirement: "Subfloor must be flat and level within tolerances",
      tolerance: "3mm in 3 metres typical for floating floors",
      preparation: [
        "Grinding high spots",
        "Self-levelling compound for low areas",
        "Plywood overlay for timber subfloors",
      ],
    },
    dryness: {
      timber: "Timber subfloors must be dry (moisture content below 14%)",
      concrete: "Concrete must be cured (minimum 28 days, typically 60-90 days)",
    },
  },

  // Expansion and Contraction
  movement: {
    requirement: "All timber and laminate floors must have expansion gaps",
    gapSize: "Minimum 10mm at walls, doorways, and fixed objects",
    reasons: [
      "Timber expands and contracts with humidity changes",
      "Prevents buckling and damage",
      "Covered by skirting/scotia",
    ],
    largeAreas: "Expansion joints required for areas over 10m in any direction",
  },

  // Underlay Requirements
  underlay: {
    timber: "Underlay required for floating timber/laminate floors",
    vinyl: "Vinyl requires smooth, clean subfloor - plywood may be needed",
    carpet: "Underlay improves comfort, insulation, and carpet life",
    acoustic: "Acoustic underlay may be required for apartments/multi-storey",
    moistureBarrier: "Required over concrete slabs - can be combined with underlay",
  },

  // SafeWork Requirements
  safeWork: {
    requirements: [
      "Manual handling (heavy rolls, materials)",
      "Knee protection (kneeling work)",
      "Respiratory protection (adhesives, dust)",
      "Skin protection (adhesives, chemicals)",
      "Tool safety (power tools, cutting equipment)",
      "Ergonomic considerations (repetitive movements)",
    ],
    ppe: [
      "Knee pads (essential)",
      "Safety glasses",
      "Dust mask/respirator",
      "Work gloves",
      "Safety boots",
    ],
    adhesives: {
      hazard: "Adhesives and sealers may contain VOCs and solvents",
      controls: [
        "Adequate ventilation",
        "Respiratory protection",
        "Avoid skin contact",
        "Follow SDS recommendations",
        "Consider low-VOC products",
      ],
    },
    asbestos: {
      warning: "Older vinyl, carpet glue, and levelling may contain asbestos",
      requirement: "Test before removing old flooring in pre-1990 buildings",
      action: "Licensed asbestos removalist required if positive",
    },
  },

  // Warranty Considerations
  warranty: {
    manufacturer: [
      "Product warranty requires installation per manufacturer specs",
      "Acclimatisation requirements (48-72 hours typically)",
      "Subfloor preparation requirements",
      "Expansion gap requirements",
    ],
    workmanship: "Standard 2-5 years workmanship warranty",
    exclusions: [
      "Damage from moisture (if no barrier installed)",
      "Damage from furniture/heavy objects",
      "Normal wear and tear",
      "Fading from sun exposure",
      "Scratches and dents",
    ],
  },
};

// ============================================================================
// AI PROMPT ENHANCEMENTS FOR FLOORING
// ============================================================================

export const FLOORING_AI_CONTEXT = {
  // Trade-specific context for AI document generation
  tradeDescription: "professional flooring installer specialising in timber, laminate, vinyl, carpet, and tile flooring installation",
  
  // Common scope items for flooring work
  commonScopeItems: [
    "Supply and install laminate flooring",
    "Supply and install engineered timber flooring",
    "Supply and install solid timber flooring",
    "Supply and install luxury vinyl plank (LVP)",
    "Supply and install vinyl sheet flooring",
    "Supply and install carpet",
    "Supply and install floor tiles",
    "Floor preparation and levelling",
    "Install moisture barrier",
    "Install underlay",
    "Sand and polish timber floors",
    "Recoat existing timber floors",
    "Remove existing flooring",
    "Install skirting/scotia",
    "Install transition strips",
    "Repair damaged flooring",
    "Stain timber floors",
    "Install stair nosings",
  ],
  
  // Standard inclusions for flooring quotes
  standardInclusions: [
    "Supply of specified flooring materials",
    "Professional installation",
    "Underlay/moisture barrier (as specified)",
    "Standard expansion gaps at walls",
    "Transition strips at doorways (standard)",
    "Clean-up of work areas",
    "Removal of packaging/waste",
    "Workmanship warranty",
  ],
  
  // Standard exclusions for flooring quotes
  standardExclusions: [
    "Removal of existing flooring (unless specified)",
    "Furniture moving (unless specified)",
    "Subfloor repairs beyond minor levelling",
    "Asbestos testing/removal",
    "Skirting boards (unless specified)",
    "Painting of skirting",
    "Door trimming/adjustment",
    "Heating/cooling duct modifications",
    "Complex patterns (herringbone, etc.) without premium",
  ],
  
  // Flooring types and applications
  flooringTypes: {
    laminate: "Budget-friendly, DIY-friendly, not suitable for wet areas",
    engineeredTimber: "Real wood veneer, more stable than solid, can be floated or glued",
    solidTimber: "Premium, can be sanded multiple times, requires skilled install",
    lvp: "Waterproof, durable, good for kitchens/bathrooms, easy maintenance",
    vinylSheet: "Seamless, waterproof, commercial/residential, cost-effective",
    carpet: "Comfort, insulation, noise reduction, not for wet areas",
    tiles: "Durable, waterproof, many design options, requires tiling skills",
  },
  
  // Safety considerations for SWMS
  safetyHazards: [
    "Manual handling (heavy materials, rolls)",
    "Knee injuries (prolonged kneeling)",
    "Respiratory hazards (dust, adhesive fumes)",
    "Cuts from cutting tools (knives, saws)",
    "Skin contact with adhesives/chemicals",
    "Tripping on materials/cables",
    "Eye injuries from dust/debris",
    "Asbestos exposure (old flooring)",
  ],
  
  // Safety controls required
  safetyControls: [
    "Use knee pads at all times",
    "Team lifting for heavy materials",
    "Adequate ventilation when using adhesives",
    "Dust extraction when cutting",
    "PPE - glasses, gloves, mask",
    "Asbestos testing before removal of old floors",
    "Clear work area of hazards",
    "Take regular breaks",
  ],
  
  // Maintenance guidance
  maintenanceGuidance: {
    timber: {
      cleaning: "Sweep/vacuum regularly, damp mop only (not wet)",
      protection: "Use furniture pads, mats at entries, avoid high heels",
      refinishing: "Professional sand and polish every 7-15 years",
      humidity: "Maintain 40-60% relative humidity",
    },
    laminate: {
      cleaning: "Sweep/vacuum, damp mop, no excessive water",
      protection: "Furniture pads, wipe spills immediately",
      caution: "Cannot be sanded or refinished",
    },
    vinyl: {
      cleaning: "Sweep/vacuum, mop with pH-neutral cleaner",
      protection: "Furniture pads, avoid rubber-backed mats",
      polish: "Some vinyls can be polished for extra shine",
    },
    carpet: {
      vacuuming: "Weekly minimum, high-traffic areas more often",
      cleaning: "Professional steam clean every 12-18 months",
      spots: "Treat spills immediately, blot don't rub",
    },
    tiles: {
      cleaning: "Sweep/mop, pH-neutral cleaner",
      grout: "Seal grout initially, re-seal every 1-2 years",
      chips: "Individual tiles can be replaced if damaged",
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default rate template for flooring installers
 */
export function getFlooringDefaultRateTemplate() {
  return {
    name: "Flooring Installer - Standard Rates",
    tradeType: "Flooring",
    propertyType: null,
    hourlyRate: FLOORING_DEFAULT_RATES.hourlyRate,
    helperHourlyRate: FLOORING_DEFAULT_RATES.helperHourlyRate,
    dayRate: FLOORING_DEFAULT_RATES.dayRate,
    calloutFee: FLOORING_DEFAULT_RATES.calloutFee,
    minCharge: FLOORING_DEFAULT_RATES.minCharge,
    ratePerM2Interior: FLOORING_DEFAULT_RATES.ratePerM2LaminateLabourOnly,
    ratePerM2Exterior: FLOORING_DEFAULT_RATES.ratePerM2LVPLabourOnly,
    ratePerLmTrim: FLOORING_DEFAULT_RATES.ratePerLmSkirting,
    materialMarkupPercent: FLOORING_DEFAULT_RATES.materialMarkupPercent,
    isDefault: true,
  };
}

/**
 * Get flooring-specific AI system prompt enhancement
 */
export function getFlooringSystemPromptContext(): string {
  return `
Trade-Specific Context (Flooring Installer):
- This is flooring installation work in Australia
- Must comply with AS 1884 (resilient flooring), AS 2455 (carpet), AS 4586 (slip resistance)
- Flooring types: laminate, engineered timber, solid timber, LVP/vinyl, carpet, tiles
- Major brands: Quick-Step, Godfrey Hirst, Karndean, Polyflor, Feltex
- Key requirements:
  - Moisture testing required on concrete slabs
  - Expansion gaps (min 10mm) for timber/laminate
  - Underlay required for floating floors
  - Subfloor must be flat (3mm in 3m tolerance)
  - Slip ratings (P/R ratings) for commercial/wet areas
- Pricing typically per m² (labour only or supply + install)
- SAFETY: Knee protection essential, adhesive fumes, asbestos in old flooring
- Warranty requires acclimatisation (48-72 hours) before installation
`;
}

/**
 * Calculate flooring materials for a room
 */
export function calculateFlooringMaterials(params: {
  areaM2: number;
  flooringType: "laminate" | "engineeredTimber" | "solidTimber" | "lvp" | "vinylSheet" | "carpet" | "tiles";
  includeUnderlay?: boolean;
  includeMoistureBarrier?: boolean;
  perimeterM?: number; // For skirting calculation
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  // Add waste factor
  const wasteFactor = params.flooringType === "tiles" ? 1.15 : 1.10; // 10-15% waste
  const flooringArea = Math.ceil(params.areaM2 * wasteFactor);
  
  // Flooring material
  const flooringItem = {
    laminate: "Laminate Flooring",
    engineeredTimber: "Engineered Timber Flooring",
    solidTimber: "Solid Timber Flooring",
    lvp: "Luxury Vinyl Plank (LVP)",
    vinylSheet: "Vinyl Sheet Flooring",
    carpet: "Carpet",
    tiles: "Floor Tiles",
  }[params.flooringType];
  
  materials.push({ item: flooringItem, quantity: flooringArea, unit: "m²" });
  
  // Underlay (for laminate, engineered timber, LVP, carpet)
  if (params.includeUnderlay !== false) {
    if (["laminate", "engineeredTimber", "lvp"].includes(params.flooringType)) {
      materials.push({ item: "Foam Underlay 3mm", quantity: Math.ceil(params.areaM2), unit: "m²" });
    } else if (params.flooringType === "carpet") {
      materials.push({ item: "Rubber Underlay 10mm", quantity: Math.ceil(params.areaM2), unit: "m²" });
    }
  }
  
  // Moisture barrier (for floating floors on concrete)
  if (params.includeMoistureBarrier) {
    materials.push({ item: "Polyethylene Moisture Barrier 200um", quantity: Math.ceil(params.areaM2), unit: "m²" });
  }
  
  // Skirting (if perimeter provided)
  if (params.perimeterM) {
    const skirtingLength = Math.ceil(params.perimeterM * 1.1); // 10% waste
    materials.push({ item: "Skirting MDF 90mm", quantity: skirtingLength, unit: "lin m" });
  }
  
  // Additional items by flooring type
  if (params.flooringType === "tiles") {
    const adhesiveBags = Math.ceil(params.areaM2 / 5); // ~5m² per 20kg bag
    materials.push({ item: "Tile Adhesive 20kg", quantity: adhesiveBags, unit: "bags" });
    const groutBags = Math.ceil(params.areaM2 / 10); // ~10m² per 5kg bag
    materials.push({ item: "Tile Grout 5kg", quantity: groutBags, unit: "bags" });
  }
  
  if (params.flooringType === "carpet") {
    materials.push({ item: "Carpet Gripper", quantity: Math.ceil((params.perimeterM || Math.sqrt(params.areaM2) * 4) * 1.1), unit: "lin m" });
  }
  
  if (["vinylSheet", "lvp"].includes(params.flooringType) && params.flooringType === "vinylSheet") {
    materials.push({ item: "Vinyl Adhesive 15L", quantity: Math.ceil(params.areaM2 / 45), unit: "drums" });
  }
  
  return materials;
}

/**
 * Check slip resistance requirements
 */
export function getSlipResistanceRequirement(application: string): {
  pRating: string;
  rRating: string;
  notes: string;
} {
  const appLower = application.toLowerCase();
  
  if (appLower.includes("pool") || appLower.includes("shower") || appLower.includes("external ramp")) {
    return {
      pRating: "P5",
      rRating: "R11-R12",
      notes: "High slip risk area - requires higher slip resistance rating",
    };
  }
  
  if (appLower.includes("commercial kitchen") || appLower.includes("change room") || appLower.includes("entry")) {
    return {
      pRating: "P4",
      rRating: "R10-R11",
      notes: "Wet/contaminated area - moderate-high slip resistance required",
    };
  }
  
  if (appLower.includes("bathroom") || appLower.includes("laundry") || appLower.includes("toilet")) {
    return {
      pRating: "P3-P4",
      rRating: "R10",
      notes: "Residential wet area - moderate slip resistance required",
    };
  }
  
  if (appLower.includes("office") || appLower.includes("retail") || appLower.includes("residential")) {
    return {
      pRating: "P3",
      rRating: "R9",
      notes: "Standard dry internal area - basic slip resistance acceptable",
    };
  }
  
  return {
    pRating: "P3-P4",
    rRating: "R10",
    notes: "General recommendation - check specific BCA requirements for your application",
  };
}

/**
 * Calculate sand and polish materials
 */
export function calculateSandPolishMaterials(params: {
  areaM2: number;
  includeStain?: boolean;
  coatType?: "polyurethane" | "hardwaxOil";
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  // Sanding supplies (calculated per m²)
  materials.push({ item: "Sanding paper (various grits)", quantity: 1, unit: "set per 20m²" });
  
  // Stain (if required)
  if (params.includeStain) {
    const stainCans = Math.ceil(params.areaM2 / 15); // ~15m² per 4L can
    materials.push({ item: "Timber Floor Stain 4L", quantity: stainCans, unit: "cans" });
  }
  
  // Finish (3 coats typically)
  const coatType = params.coatType || "polyurethane";
  if (coatType === "polyurethane") {
    const polyDrums = Math.ceil(params.areaM2 / 30); // ~30m² per 10L for 3 coats
    materials.push({ item: "Polyurethane Floor Finish 10L", quantity: polyDrums, unit: "drums" });
  } else {
    const oilCans = Math.ceil(params.areaM2 / 12); // ~12m² per 2.5L
    materials.push({ item: "Hardwax Oil 2.5L", quantity: oilCans, unit: "cans" });
  }
  
  return materials;
}

/**
 * Estimate subfloor preparation needs
 */
export function estimateSubfloorPrep(params: {
  subfloorType: "concrete" | "timber" | "particleboard";
  condition: "good" | "average" | "poor";
  areaM2: number;
}): {
  levellingRequired: boolean;
  moistureBarrierRequired: boolean;
  estimatedPrepCost: number;
  notes: string[];
} {
  const notes: string[] = [];
  let levellingRequired = false;
  let moistureBarrierRequired = false;
  let prepCost = 0;
  
  // Concrete-specific
  if (params.subfloorType === "concrete") {
    moistureBarrierRequired = true;
    notes.push("Moisture testing recommended before installation");
    prepCost += params.areaM2 * FLOORING_DEFAULT_RATES.ratePerM2MoistureBarrier;
  }
  
  // Condition assessment
  if (params.condition === "poor") {
    levellingRequired = true;
    prepCost += params.areaM2 * FLOORING_DEFAULT_RATES.ratePerM2Levelling;
    notes.push("Self-levelling compound likely required for poor condition subfloor");
  } else if (params.condition === "average") {
    prepCost += params.areaM2 * FLOORING_DEFAULT_RATES.ratePerM2SubfloorPrep;
    notes.push("Minor levelling/preparation may be required");
  }
  
  // Timber subfloor notes
  if (params.subfloorType === "timber" || params.subfloorType === "particleboard") {
    notes.push("Check for squeaky boards and secure before installation");
    notes.push("Ensure adequate ventilation under subfloor");
    if (params.subfloorType === "particleboard" && params.condition !== "good") {
      notes.push("Consider plywood overlay for damaged particleboard");
      prepCost += params.areaM2 * 15; // Plywood overlay cost
    }
  }
  
  return {
    levellingRequired,
    moistureBarrierRequired,
    estimatedPrepCost: Math.round(prepCost),
    notes,
  };
}
