/**
 * Tiler Trade Profile Configuration for OMNEXORA
 * 
 * This module provides tiling-specific configuration including:
 * - Default rates and pricing for wall and floor tiling
 * - Common materials with Australian pricing (Beaumont Tiles, National Tiles)
 * - Compliance and safety information (AS 3958, AS 3740 waterproofing, AS 4586 slip)
 * - Document templates and AI prompt enhancements
 * 
 * Compliance References:
 * - AS 3958.1 - Ceramic tiles - Guide to the installation of ceramic tiles
 * - AS 3740 - Waterproofing of domestic wet areas
 * - AS 4586 - Slip resistance classification of new pedestrian surface materials
 * - Building Code of Australia (BCA/NCC)
 * - State-based SafeWork regulations
 */

// ============================================================================
// TILER DEFAULT RATES (Australian market rates 2024-2026)
// ============================================================================

export const TILER_DEFAULT_RATES = {
  // Hourly rates
  hourlyRate: 75, // Qualified tiler hourly rate
  helperHourlyRate: 45, // Trade assistant rate
  dayRate: 580, // Full day rate
  
  // Floor tiling per m² (labour only)
  ratePerM2FloorStandard: 55, // Standard floor tiles (300x300, 450x450)
  ratePerM2FloorLargeFormat: 75, // Large format (600x600, 600x1200)
  ratePerM2FloorExtraLarge: 95, // Extra large format (900x900+, 600x1200+)
  ratePerM2FloorMosaic: 120, // Mosaic tiles (sheets)
  ratePerM2FloorHerringbone: 95, // Herringbone/chevron pattern
  ratePerM2FloorDiagonal: 75, // Diagonal layout
  ratePerM2FloorNaturalStone: 85, // Natural stone (slate, marble, travertine)
  
  // Wall tiling per m² (labour only)
  ratePerM2WallStandard: 50, // Standard wall tiles (300x600, 300x300)
  ratePerM2WallSubway: 65, // Subway tiles
  ratePerM2WallFeature: 85, // Feature walls, complex patterns
  ratePerM2WallMosaic: 110, // Mosaic/small format wall tiles
  ratePerM2WallNaturalStone: 80, // Natural stone wall tiles
  ratePerM2WallLargeFormat: 70, // Large format wall tiles
  
  // Supply + install per m² (materials included)
  ratePerM2SupplyInstallBasic: 120, // Basic ceramic supply + install
  ratePerM2SupplyInstallMid: 160, // Mid-range porcelain supply + install
  ratePerM2SupplyInstallPremium: 220, // Premium tiles supply + install
  ratePerM2SupplyInstallNaturalStone: 280, // Natural stone supply + install
  
  // Wet area tiling per m²
  ratePerM2BathroomComplete: 180, // Full bathroom tiling (labour, waterproofing extra)
  ratePerM2ShowerRecess: 200, // Shower recess (complex, cuts)
  ratePerM2Splashback: 120, // Kitchen/laundry splashback
  
  // Waterproofing per m²
  ratePerM2WaterproofingWalls: 45, // Wall waterproofing
  ratePerM2WaterproofingFloor: 55, // Floor waterproofing
  ratePerM2WaterproofingShower: 65, // Shower base/hob waterproofing
  
  // Per-lineal-metre rates
  ratePerLmBullnose: 35, // Bullnose edge tiles
  ratePerLmPencilTrim: 25, // Pencil/edge trim
  ratePerLmSkirtingTile: 28, // Tile skirting
  ratePerLmShowerScreen: 45, // Tile to shower screen edge
  ratePerLmStepNosing: 55, // Stair nosing tiles
  
  // Per-item rates
  ratePerNicheEach: 180, // Shower niche (tiled)
  ratePerCornerShelfEach: 120, // Corner shelf tile
  ratePerFloorWasteEach: 85, // Floor waste cut-in
  ratePerAccessPanelEach: 95, // Access panel tile surround
  
  // Preparation work per m²
  ratePerM2SubstratePrep: 25, // Substrate preparation
  ratePerM2Levelling: 35, // Self-levelling compound
  ratePerM2TileRemoval: 45, // Old tile removal
  ratePerM2RendererPrep: 55, // Render/scratch coat
  
  // Grouting and finishing
  ratePerM2Regrouting: 35, // Regrout existing tiles
  ratePerM2SiliconeSealing: 15, // Silicone sealing (wet areas)
  ratePerM2GroutSealing: 12, // Grout sealer application
  
  // Minimum charges
  minCharge: 450, // Minimum job charge
  calloutFee: 85, // Quote/measure fee
  smallAreaMinimum: 350, // Minimum for areas under 5m²
  
  // Material markup
  materialMarkupPercent: 25, // Standard markup on materials
};

// ============================================================================
// COMMON TILING MATERIALS (Australian pricing)
// ============================================================================

export interface TilingMaterial {
  name: string;
  category: string;
  supplier: string;
  unitLabel: string;
  unitCost: number;
  notes: string;
  size?: string;
  slipRating?: string;
}

export const TILER_DEFAULT_MATERIALS: TilingMaterial[] = [
  // Floor Tiles - Porcelain
  {
    name: "Porcelain Floor Tile 600x600 Matt",
    category: "Floor Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 45.00,
    notes: "Standard rectified porcelain",
    size: "600x600",
    slipRating: "P3/R10",
  },
  {
    name: "Porcelain Floor Tile 600x600 Polished",
    category: "Floor Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 55.00,
    notes: "Polished porcelain (not for wet areas)",
    size: "600x600",
    slipRating: "P2",
  },
  {
    name: "Porcelain Floor Tile 600x1200",
    category: "Floor Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 65.00,
    notes: "Large format rectified",
    size: "600x1200",
    slipRating: "P3/R10",
  },
  {
    name: "Porcelain Floor Tile 300x600",
    category: "Floor Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 42.00,
    notes: "Mid-size porcelain",
    size: "300x600",
    slipRating: "P3/R10",
  },
  {
    name: "Wood Look Porcelain Plank 200x1200",
    category: "Floor Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 55.00,
    notes: "Timber look plank tile",
    size: "200x1200",
    slipRating: "P3/R10",
  },
  {
    name: "Concrete Look Porcelain 600x600",
    category: "Floor Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 48.00,
    notes: "Industrial concrete look",
    size: "600x600",
    slipRating: "P3/R10",
  },
  {
    name: "Terrazzo Look Porcelain 600x600",
    category: "Floor Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 65.00,
    notes: "Terrazzo effect tile",
    size: "600x600",
    slipRating: "P3/R10",
  },
  
  // Floor Tiles - Ceramic
  {
    name: "Ceramic Floor Tile 300x300",
    category: "Floor Tiles",
    supplier: "Bunnings/Tile shops",
    unitLabel: "m²",
    unitCost: 28.00,
    notes: "Budget floor tile",
    size: "300x300",
    slipRating: "P3",
  },
  {
    name: "Ceramic Floor Tile 450x450",
    category: "Floor Tiles",
    supplier: "Bunnings/Tile shops",
    unitLabel: "m²",
    unitCost: 35.00,
    notes: "Standard ceramic",
    size: "450x450",
    slipRating: "P3",
  },
  
  // Floor Tiles - Natural Stone
  {
    name: "Travertine Tile 400x400 Filled",
    category: "Natural Stone",
    supplier: "Stone yards/Tile shops",
    unitLabel: "m²",
    unitCost: 85.00,
    notes: "Filled and honed travertine",
    size: "400x400",
    slipRating: "P3",
  },
  {
    name: "Marble Tile 600x600 Polished",
    category: "Natural Stone",
    supplier: "Stone yards",
    unitLabel: "m²",
    unitCost: 120.00,
    notes: "Premium polished marble",
    size: "600x600",
    slipRating: "P2",
  },
  {
    name: "Slate Tile 300x300 Natural",
    category: "Natural Stone",
    supplier: "Stone yards/Tile shops",
    unitLabel: "m²",
    unitCost: 65.00,
    notes: "Natural split slate",
    size: "300x300",
    slipRating: "P4",
  },
  {
    name: "Bluestone Tile 400x400 Honed",
    category: "Natural Stone",
    supplier: "Stone yards",
    unitLabel: "m²",
    unitCost: 95.00,
    notes: "Victorian bluestone",
    size: "400x400",
    slipRating: "P4",
  },
  {
    name: "Limestone Tile 600x400",
    category: "Natural Stone",
    supplier: "Stone yards",
    unitLabel: "m²",
    unitCost: 75.00,
    notes: "Natural limestone",
    size: "600x400",
    slipRating: "P3",
  },
  
  // Wall Tiles
  {
    name: "Ceramic Wall Tile 300x600 Gloss",
    category: "Wall Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 32.00,
    notes: "Standard gloss wall tile",
    size: "300x600",
  },
  {
    name: "Ceramic Wall Tile 300x600 Matt",
    category: "Wall Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 35.00,
    notes: "Matt finish wall tile",
    size: "300x600",
  },
  {
    name: "Subway Tile 75x150 Gloss",
    category: "Wall Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 38.00,
    notes: "Classic subway tile",
    size: "75x150",
  },
  {
    name: "Subway Tile 100x300 Gloss",
    category: "Wall Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 42.00,
    notes: "Large subway format",
    size: "100x300",
  },
  {
    name: "Feature Tile Patterned",
    category: "Wall Tiles",
    supplier: "Beaumont/Tile boutiques",
    unitLabel: "m²",
    unitCost: 85.00,
    notes: "Decorative/patterned tiles",
    size: "Various",
  },
  {
    name: "Porcelain Wall Tile 600x300",
    category: "Wall Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 45.00,
    notes: "Rectified porcelain wall",
    size: "600x300",
  },
  {
    name: "Large Format Wall Tile 600x1200",
    category: "Wall Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 75.00,
    notes: "Large format feature wall",
    size: "600x1200",
  },
  
  // Mosaic Tiles
  {
    name: "Glass Mosaic Sheet 300x300",
    category: "Mosaic",
    supplier: "Tile shops",
    unitLabel: "m²",
    unitCost: 95.00,
    notes: "Glass mosaic on mesh",
    size: "300x300 sheet",
  },
  {
    name: "Porcelain Mosaic Sheet 300x300",
    category: "Mosaic",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 65.00,
    notes: "Porcelain mosaic on mesh",
    size: "300x300 sheet",
  },
  {
    name: "Penny Round Mosaic Sheet",
    category: "Mosaic",
    supplier: "Tile shops",
    unitLabel: "m²",
    unitCost: 85.00,
    notes: "Penny round tiles on mesh",
    size: "300x300 sheet",
  },
  {
    name: "Hexagon Mosaic Sheet",
    category: "Mosaic",
    supplier: "Tile shops",
    unitLabel: "m²",
    unitCost: 75.00,
    notes: "Hexagonal mosaic",
    size: "300x300 sheet",
  },
  {
    name: "Natural Stone Mosaic Sheet",
    category: "Mosaic",
    supplier: "Stone yards/Tile shops",
    unitLabel: "m²",
    unitCost: 110.00,
    notes: "Stone mosaic on mesh",
    size: "300x300 sheet",
  },
  
  // Outdoor/Pool Tiles
  {
    name: "Pool Tile Ceramic 150x150",
    category: "Pool Tiles",
    supplier: "Pool tile suppliers",
    unitLabel: "m²",
    unitCost: 55.00,
    notes: "Frost-proof pool tile",
    size: "150x150",
    slipRating: "P5",
  },
  {
    name: "Pool Coping Tile 300x600 Bullnose",
    category: "Pool Tiles",
    supplier: "Pool tile suppliers",
    unitLabel: "Lin m",
    unitCost: 45.00,
    notes: "Pool edge coping",
    size: "300x600",
    slipRating: "P5",
  },
  {
    name: "Outdoor Porcelain 600x600 Anti-Slip",
    category: "Outdoor Tiles",
    supplier: "Beaumont/National Tiles",
    unitLabel: "m²",
    unitCost: 55.00,
    notes: "External anti-slip porcelain",
    size: "600x600",
    slipRating: "P5/R11",
  },
  
  // Trim and Edge Tiles
  {
    name: "Bullnose Edge Tile (per piece)",
    category: "Trims",
    supplier: "Tile shops",
    unitLabel: "Each",
    unitCost: 8.00,
    notes: "Rounded edge finish",
  },
  {
    name: "Pencil Liner Tile (per piece)",
    category: "Trims",
    supplier: "Tile shops",
    unitLabel: "Each",
    unitCost: 5.00,
    notes: "Decorative pencil edge",
  },
  {
    name: "Aluminium Tile Trim 2.5m",
    category: "Trims",
    supplier: "Bunnings/Tile shops",
    unitLabel: "Each",
    unitCost: 18.00,
    notes: "External corner trim",
  },
  {
    name: "Stainless Steel Tile Trim 2.5m",
    category: "Trims",
    supplier: "Tile shops",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Premium edge trim",
  },
  {
    name: "PVC Tile Trim 2.5m",
    category: "Trims",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 8.00,
    notes: "Budget edge trim",
  },
  {
    name: "Stair Nosing Aluminium 2.5m",
    category: "Trims",
    supplier: "Tile shops",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Stair edge protection",
  },
  
  // Adhesives
  {
    name: "Tile Adhesive Standard 20kg",
    category: "Adhesives",
    supplier: "Bunnings/Tile shops",
    unitLabel: "Bag",
    unitCost: 28.00,
    notes: "General purpose grey (~5m²)",
  },
  {
    name: "Tile Adhesive White 20kg",
    category: "Adhesives",
    supplier: "Tile shops",
    unitLabel: "Bag",
    unitCost: 35.00,
    notes: "White for light tiles/mosaics",
  },
  {
    name: "Tile Adhesive Flexible 20kg",
    category: "Adhesives",
    supplier: "Ardex/Mapei",
    unitLabel: "Bag",
    unitCost: 45.00,
    notes: "For natural stone, large format",
  },
  {
    name: "Tile Adhesive Rapid Set 20kg",
    category: "Adhesives",
    supplier: "Ardex/Mapei",
    unitLabel: "Bag",
    unitCost: 55.00,
    notes: "Fast setting (walk in 3hrs)",
  },
  {
    name: "Tile Adhesive External 20kg",
    category: "Adhesives",
    supplier: "Ardex/Mapei",
    unitLabel: "Bag",
    unitCost: 48.00,
    notes: "Outdoor/wet area adhesive",
  },
  {
    name: "Epoxy Tile Adhesive 15kg",
    category: "Adhesives",
    supplier: "Ardex/Mapei",
    unitLabel: "Kit",
    unitCost: 180.00,
    notes: "Chemical resistant, pools",
  },
  
  // Grouts
  {
    name: "Grout Unsanded 5kg",
    category: "Grouts",
    supplier: "Bunnings/Tile shops",
    unitLabel: "Bag",
    unitCost: 22.00,
    notes: "For joints up to 3mm",
  },
  {
    name: "Grout Sanded 5kg",
    category: "Grouts",
    supplier: "Bunnings/Tile shops",
    unitLabel: "Bag",
    unitCost: 25.00,
    notes: "For joints 3-12mm",
  },
  {
    name: "Grout Flexible 5kg",
    category: "Grouts",
    supplier: "Ardex/Mapei",
    unitLabel: "Bag",
    unitCost: 35.00,
    notes: "Premium flexible grout",
  },
  {
    name: "Grout Epoxy 5kg",
    category: "Grouts",
    supplier: "Ardex/Mapei",
    unitLabel: "Kit",
    unitCost: 120.00,
    notes: "Chemical/stain resistant",
  },
  {
    name: "Grout Additive Latex 1L",
    category: "Grouts",
    supplier: "Tile shops",
    unitLabel: "Bottle",
    unitCost: 25.00,
    notes: "Adds flexibility to grout",
  },
  
  // Waterproofing
  {
    name: "Waterproofing Membrane Liquid 15L",
    category: "Waterproofing",
    supplier: "Ardex/CSR",
    unitLabel: "Drum",
    unitCost: 195.00,
    notes: "Covers ~20m² at 2 coats",
  },
  {
    name: "Waterproofing Membrane 4L",
    category: "Waterproofing",
    supplier: "Bunnings/Tile shops",
    unitLabel: "Drum",
    unitCost: 65.00,
    notes: "Covers ~5m² at 2 coats",
  },
  {
    name: "Waterproofing Tape 10m Roll",
    category: "Waterproofing",
    supplier: "Waterproofing suppliers",
    unitLabel: "Roll",
    unitCost: 35.00,
    notes: "Reinforcing tape for corners",
  },
  {
    name: "Waterproofing Band/Cloth 100mm",
    category: "Waterproofing",
    supplier: "Waterproofing suppliers",
    unitLabel: "Lin m",
    unitCost: 4.50,
    notes: "Corner/joint reinforcement",
  },
  {
    name: "Shower Screen Channel Seal",
    category: "Waterproofing",
    supplier: "Waterproofing suppliers",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Pre-formed corner seal",
  },
  {
    name: "Floor Waste Puddle Flange",
    category: "Waterproofing",
    supplier: "Plumbing supplies",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Waterproofing to floor waste",
  },
  
  // Preparation Products
  {
    name: "Self-Levelling Compound 20kg",
    category: "Preparation",
    supplier: "Ardex/Mapei",
    unitLabel: "Bag",
    unitCost: 55.00,
    notes: "Covers ~4-5m² at 3mm",
  },
  {
    name: "Tile Primer 15L",
    category: "Preparation",
    supplier: "Ardex/Mapei",
    unitLabel: "Drum",
    unitCost: 95.00,
    notes: "Substrate primer",
  },
  {
    name: "Scratch Coat Render 20kg",
    category: "Preparation",
    supplier: "CSR/Boral",
    unitLabel: "Bag",
    unitCost: 18.00,
    notes: "Tile bed render",
  },
  {
    name: "Tile Backer Board 6mm (2400x600)",
    category: "Preparation",
    supplier: "Bunnings/Tile shops",
    unitLabel: "Sheet",
    unitCost: 35.00,
    notes: "Cement sheet substrate",
  },
  {
    name: "Decoupling Membrane (per m²)",
    category: "Preparation",
    supplier: "Schluter/similar",
    unitLabel: "m²",
    unitCost: 45.00,
    notes: "Anti-crack membrane",
  },
  
  // Silicone and Sealants
  {
    name: "Silicone Wet Area Clear 300ml",
    category: "Sealants",
    supplier: "Bunnings/Tile shops",
    unitLabel: "Tube",
    unitCost: 15.00,
    notes: "Mould-resistant silicone",
  },
  {
    name: "Silicone Wet Area White 300ml",
    category: "Sealants",
    supplier: "Bunnings/Tile shops",
    unitLabel: "Tube",
    unitCost: 15.00,
    notes: "White silicone sealant",
  },
  {
    name: "Silicone Colour Match 300ml",
    category: "Sealants",
    supplier: "Tile shops",
    unitLabel: "Tube",
    unitCost: 22.00,
    notes: "Grout colour match silicone",
  },
  {
    name: "Grout Sealer 1L",
    category: "Sealants",
    supplier: "Tile shops",
    unitLabel: "Bottle",
    unitCost: 35.00,
    notes: "Penetrating grout sealer",
  },
  {
    name: "Natural Stone Sealer 1L",
    category: "Sealants",
    supplier: "Stone suppliers",
    unitLabel: "Bottle",
    unitCost: 55.00,
    notes: "Impregnating stone sealer",
  },
  
  // Tools and Consumables
  {
    name: "Tile Spacers 3mm (1000 pack)",
    category: "Consumables",
    supplier: "Bunnings",
    unitLabel: "Pack",
    unitCost: 12.00,
    notes: "Standard 3mm spacers",
  },
  {
    name: "Tile Levelling System Clips",
    category: "Consumables",
    supplier: "Tile shops",
    unitLabel: "Box (100)",
    unitCost: 25.00,
    notes: "Lippage-free system",
  },
  {
    name: "Tile Levelling System Wedges",
    category: "Consumables",
    supplier: "Tile shops",
    unitLabel: "Box (100)",
    unitCost: 18.00,
    notes: "Reusable wedges",
  },
  {
    name: "Diamond Blade 180mm",
    category: "Consumables",
    supplier: "Tool shops",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Wet saw blade",
  },
  {
    name: "Diamond Core Bit 65mm",
    category: "Consumables",
    supplier: "Tool shops",
    unitLabel: "Each",
    unitCost: 55.00,
    notes: "For tap holes",
  },
  {
    name: "Grout Float Rubber",
    category: "Tools",
    supplier: "Bunnings/Tile shops",
    unitLabel: "Each",
    unitCost: 18.00,
    notes: "Rubber grout float",
  },
  {
    name: "Notched Trowel 12mm",
    category: "Tools",
    supplier: "Bunnings/Tile shops",
    unitLabel: "Each",
    unitCost: 25.00,
    notes: "Large format trowel",
  },
];

// ============================================================================
// AUSTRALIAN COMPLIANCE INFORMATION
// ============================================================================

export const TILER_COMPLIANCE = {
  // AS 3958.1 - Tile Installation
  tileInstallation: {
    standard: "AS 3958.1 - Ceramic tiles - Guide to the installation of ceramic tiles",
    requirements: [
      "Appropriate substrate preparation",
      "Correct adhesive selection for tile type and application",
      "Adequate adhesive coverage (minimum 80% standard, 100% wet areas)",
      "Appropriate joint widths for tile size and application",
      "Movement joints at perimeters and large areas",
      "Expansion joints for external applications",
    ],
    adhesiveCoverage: {
      standard: "Minimum 80% contact for standard areas",
      wetAreas: "Minimum 100% contact for wet areas (no voids)",
      largeFormat: "Back-buttering recommended for large format tiles",
    },
    jointWidths: {
      rectified: "Minimum 2mm (typically 3mm)",
      nonRectified: "Minimum 3mm",
      naturalStone: "3-5mm depending on size",
      external: "5-10mm to allow for movement",
    },
  },

  // AS 3740 - Waterproofing
  waterproofing: {
    standard: "AS 3740 - Waterproofing of domestic wet areas",
    wetAreas: [
      "Shower recesses",
      "Bathroom floors",
      "Laundry floors",
      "WC (water closet) floors with floor waste",
      "Kitchen floors (if required by BCA)",
    ],
    requirements: {
      showerFloor: "Entire floor to be waterproofed, including 25mm up hob",
      showerWalls: "1800mm above finished floor level minimum",
      showerDoor: "Waterproofing must extend under shower screen",
      bathroomFloor: "Entire floor if floor waste present, or within 1.5m of shower",
      bathWall: "300mm above bath rim height",
      upturns: "150mm upturn at wall/floor junction (minimum)",
    },
    inspection: {
      requirement: "Waterproofing inspection required before tiling in many jurisdictions",
      certificate: "Certificate of waterproofing compliance may be required",
      testMethods: "Flood testing may be required (minimum 24 hours)",
    },
    licensing: "Licensed waterproofer may be required in some states (e.g., NSW, QLD)",
    notes: "Critical that waterproofing is completed before tiling commences",
  },

  // AS 4586 - Slip Resistance
  slipResistance: {
    standard: "AS 4586 - Slip resistance classification of new pedestrian surface materials",
    requirement: "Floor tiles must meet minimum slip resistance for application",
    ratings: {
      P3: {
        application: "Dry internal floors, offices, retail",
        angle: "12-19° ramp test",
      },
      P4: {
        application: "Commercial kitchens, change rooms, entries",
        angle: "19-27° ramp test",
      },
      P5: {
        application: "Pool surrounds, showers, external ramps",
        angle: "27-35° ramp test",
      },
    },
    rRatings: {
      R9: "Level internal areas, low slip risk",
      R10: "Toilets, bathrooms, kitchens",
      R11: "Commercial kitchens, external areas",
      R12: "Industrial, external ramps",
      R13: "High risk industrial",
    },
    bcaRequirements: {
      bathrooms: "Minimum P3 for domestic bathrooms",
      showers: "Minimum P4 for shower floors",
      pools: "Minimum P5 for pool surrounds",
      commercial: "Check specific BCA requirements",
    },
    notes: "Polished tiles generally not suitable for wet areas",
  },

  // Large Format Tile Requirements
  largeFormat: {
    definition: "Tiles 600x600mm or larger, or with any dimension over 600mm",
    requirements: [
      "Flexible adhesive essential",
      "Back-buttering recommended",
      "100% adhesive coverage required",
      "Levelling system recommended",
      "Movement joints more critical",
      "Substrate flatness critical (3mm in 3m)",
    ],
    substrate: "Must be flat, stable, and suitable for thin-bed adhesive",
  },

  // Natural Stone Requirements
  naturalStone: {
    requirements: [
      "White/flexible adhesive required",
      "Pre-sealing before grouting recommended",
      "Test for moisture sensitivity",
      "Consider thermal movement (external)",
    ],
    sealing: {
      before: "Pre-seal porous stones before grouting",
      after: "Apply impregnating sealer after grouting/installation",
      maintenance: "Re-seal every 1-5 years depending on use",
    },
  },

  // SafeWork Requirements
  safeWork: {
    requirements: [
      "Manual handling (heavy tiles, materials)",
      "Silica dust exposure (cutting, grinding)",
      "Knee injuries (prolonged kneeling)",
      "Chemical exposure (adhesives, sealers)",
      "Electrical safety (wet tile saw)",
      "Eye injuries (tile cutting, grinding)",
      "Noise exposure (cutting equipment)",
    ],
    ppe: [
      "P2/N95 respirator (cutting, grinding)",
      "Safety glasses",
      "Knee pads",
      "Gloves",
      "Hearing protection",
      "Steel-capped boots",
    ],
    silicaDust: {
      hazard: "Crystalline silica in tiles, adhesives, grouts is a serious health risk",
      controls: [
        "Wet cutting ALWAYS (never dry cut tiles)",
        "Local exhaust ventilation",
        "P2/N95 respirator minimum",
        "Good housekeeping (no dry sweeping)",
      ],
      reference: "SafeWork Australia - Working with silica and silica containing products",
    },
  },

  // Warranty
  warranty: {
    workmanship: "Standard 5-7 years workmanship warranty",
    waterproofing: "Typically matched to membrane manufacturer warranty (often 10+ years)",
    tiles: "Manufacturer warranty varies - typically covers defects, not installation",
    exclusions: [
      "Movement/structural cracks",
      "Substrate failure",
      "Lack of maintenance",
      "Damage from impact or abuse",
      "Normal wear in high traffic areas",
    ],
  },
};

// ============================================================================
// AI PROMPT ENHANCEMENTS FOR TILING
// ============================================================================

export const TILER_AI_CONTEXT = {
  // Trade-specific context for AI document generation
  tradeDescription: "qualified tiler specialising in wall and floor tiling, waterproofing, and natural stone installation",
  
  // Common scope items for tiling work
  commonScopeItems: [
    "Supply and install floor tiles",
    "Supply and install wall tiles",
    "Bathroom tiling (floor and walls)",
    "Shower recess tiling",
    "Kitchen splashback tiling",
    "Laundry tiling",
    "Outdoor/alfresco tiling",
    "Pool tiling",
    "Waterproofing wet areas",
    "Substrate preparation",
    "Remove existing tiles",
    "Install shower niche",
    "Install tile trim/edging",
    "Grout sealing",
    "Natural stone sealing",
    "Large format tile installation",
    "Mosaic tile installation",
    "Feature wall tiling",
    "Regrout existing tiles",
    "Tile repairs",
  ],
  
  // Standard inclusions for tiling quotes
  standardInclusions: [
    "Supply of specified tiles (if supply + install)",
    "Adhesive, grout, and silicone",
    "Tile spacers and levelling system",
    "Standard tile cuts and drilling",
    "Grouting and cleaning",
    "Silicone to perimeter and junctions",
    "Clean-up of work areas",
    "Workmanship warranty",
  ],
  
  // Standard exclusions for tiling quotes
  standardExclusions: [
    "Waterproofing (unless specified)",
    "Substrate preparation/levelling (unless specified)",
    "Removal of existing tiles (unless specified)",
    "Tile trim/edging (unless specified)",
    "Grout/stone sealing (unless specified)",
    "Plumbing/electrical work",
    "Supply of tiles (if labour only)",
    "Shower screens, tapware, fixtures",
    "Complex patterns (herringbone, etc.) without premium",
    "Waste allowance beyond 10%",
  ],
  
  // Tile types and applications
  tileTypes: {
    porcelain: "Dense, low absorption, suitable for floors and wet areas",
    ceramic: "More porous, generally wall tiles or light traffic floors",
    naturalStone: "Marble, travertine, slate - requires sealing, flexible adhesive",
    mosaic: "Small tiles on mesh - feature walls, shower floors",
    terracotta: "Rustic clay tiles - requires sealing",
    glass: "Splashbacks, feature walls - requires white adhesive",
  },
  
  // Safety considerations for SWMS
  safetyHazards: [
    "Silica dust (cutting/grinding tiles - serious lung hazard)",
    "Manual handling (heavy tiles, adhesive bags)",
    "Knee injuries (prolonged kneeling)",
    "Eye injuries (tile cutting, grinding)",
    "Cuts from sharp tile edges",
    "Chemical exposure (adhesives, waterproofing)",
    "Electrical hazards (wet saw)",
    "Slips on wet surfaces",
    "Noise exposure",
  ],
  
  // Safety controls required
  safetyControls: [
    "WET CUTTING ONLY - never dry cut tiles",
    "P2/N95 respirator for cutting/grinding",
    "Safety glasses at all times",
    "Knee pads for all kneeling work",
    "Gloves for chemical handling",
    "RCD protection for wet saw",
    "No dry sweeping - wet mop or vacuum",
    "Hearing protection when cutting",
  ],
  
  // Maintenance guidance
  maintenanceGuidance: {
    cleaning: {
      regular: "Mop with pH-neutral tile cleaner",
      grout: "Scrub grout lines with soft brush if discoloured",
      avoid: "Avoid acidic cleaners on natural stone or grout",
    },
    sealing: {
      grout: "Seal grout every 1-2 years in wet areas",
      naturalStone: "Re-seal natural stone every 1-5 years",
      test: "Water droplet test - if absorbs, re-seal required",
    },
    silicone: {
      inspection: "Check silicone annually for cracks/mould",
      replacement: "Replace silicone every 3-5 years or when failing",
      mould: "Mould in silicone = replace, cannot be cleaned effectively",
    },
    repairs: {
      cracks: "Hairline cracks in grout can be regrouted",
      chippedTiles: "Individual tiles can be replaced if spares available",
      looseTiles: "Re-adhered if caught early, investigate cause",
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default rate template for tilers
 */
export function getTilerDefaultRateTemplate() {
  return {
    name: "Tiler - Standard Rates",
    tradeType: "Tiler",
    propertyType: null,
    hourlyRate: TILER_DEFAULT_RATES.hourlyRate,
    helperHourlyRate: TILER_DEFAULT_RATES.helperHourlyRate,
    dayRate: TILER_DEFAULT_RATES.dayRate,
    calloutFee: TILER_DEFAULT_RATES.calloutFee,
    minCharge: TILER_DEFAULT_RATES.minCharge,
    ratePerM2Interior: TILER_DEFAULT_RATES.ratePerM2WallStandard,
    ratePerM2Exterior: TILER_DEFAULT_RATES.ratePerM2FloorStandard,
    ratePerLmTrim: TILER_DEFAULT_RATES.ratePerLmBullnose,
    materialMarkupPercent: TILER_DEFAULT_RATES.materialMarkupPercent,
    isDefault: true,
  };
}

/**
 * Get tiler-specific AI system prompt enhancement
 */
export function getTilerSystemPromptContext(): string {
  return `
Trade-Specific Context (Tiler):
- This is tiling work in Australia
- Must comply with AS 3958.1 (Tile installation)
- Waterproofing must comply with AS 3740 (critical in wet areas)
- Slip resistance must meet AS 4586 (P3 bathroom, P4 shower, P5 pool)
- Tile types: porcelain, ceramic, natural stone, mosaic, glass
- Suppliers: Beaumont Tiles, National Tiles, Amber Tiles
- Key requirements:
  - 80% adhesive coverage standard, 100% wet areas
  - Waterproofing BEFORE tiling in wet areas
  - Wet cutting ONLY (silica dust hazard)
  - Movement joints at perimeters
  - Large format needs flexible adhesive, back-butter
- CRITICAL: Waterproofing inspection may be required
- SAFETY: Silica dust is serious lung hazard - wet cut only
`;
}

/**
 * Calculate tiling materials
 */
export function calculateTilingMaterials(params: {
  areaM2: number;
  tileType: "porcelain" | "ceramic" | "naturalStone" | "mosaic";
  isWetArea: boolean;
  includeWaterproofing?: boolean;
  jointWidthMM?: number;
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  // Tiles with waste factor
  const wasteFactor = params.tileType === "naturalStone" ? 1.15 : 1.10;
  const tileArea = Math.ceil(params.areaM2 * wasteFactor);
  
  const tileItem = {
    porcelain: "Porcelain Tile 600x600 Matt",
    ceramic: "Ceramic Wall Tile 300x600 Matt",
    naturalStone: "Travertine Tile 400x400 Filled",
    mosaic: "Porcelain Mosaic Sheet 300x300",
  }[params.tileType];
  
  materials.push({ item: tileItem, quantity: tileArea, unit: "m²" });
  
  // Adhesive (20kg bag covers ~5m²)
  const adhesiveType = params.tileType === "naturalStone" || params.isWetArea
    ? "Tile Adhesive Flexible 20kg"
    : "Tile Adhesive Standard 20kg";
  const adhesiveBags = Math.ceil(params.areaM2 / 4); // Conservative estimate
  materials.push({ item: adhesiveType, quantity: adhesiveBags, unit: "bags" });
  
  // Grout (5kg bag covers ~8-10m² depending on tile size)
  const groutBags = Math.ceil(params.areaM2 / 8);
  materials.push({ item: "Grout Flexible 5kg", quantity: groutBags, unit: "bags" });
  
  // Waterproofing
  if (params.includeWaterproofing) {
    const membraneArea = Math.ceil(params.areaM2 * 1.2); // 20% overlap
    const membraneDrums = Math.ceil(membraneArea / 20); // 15L covers ~20m²
    materials.push({ item: "Waterproofing Membrane Liquid 15L", quantity: membraneDrums, unit: "drums" });
    materials.push({ item: "Waterproofing Band/Cloth 100mm", quantity: Math.ceil(params.areaM2 * 0.5), unit: "lin m" });
  }
  
  // Silicone for wet areas
  if (params.isWetArea) {
    const siliconetubes = Math.ceil(params.areaM2 / 10);
    materials.push({ item: "Silicone Wet Area Clear 300ml", quantity: siliconetubes, unit: "tubes" });
  }
  
  // Primer
  materials.push({ item: "Tile Primer 15L", quantity: Math.ceil(params.areaM2 / 50), unit: "drums" });
  
  // Spacers
  materials.push({ item: "Tile Spacers 3mm (1000 pack)", quantity: Math.ceil(params.areaM2 / 15), unit: "packs" });
  
  // Sealer for natural stone
  if (params.tileType === "naturalStone") {
    materials.push({ item: "Natural Stone Sealer 1L", quantity: Math.ceil(params.areaM2 / 10), unit: "bottles" });
  }
  
  return materials;
}

/**
 * Get slip resistance requirement for tiling applications
 */
export function getTileSlipResistanceRequirement(application: string): {
  pRating: string;
  rRating: string;
  notes: string;
} {
  const appLower = application.toLowerCase();
  
  if (appLower.includes("pool") || appLower.includes("outdoor ramp") || appLower.includes("wet deck")) {
    return {
      pRating: "P5",
      rRating: "R11-R12",
      notes: "High slip risk - pool surrounds, outdoor wet areas require P5 minimum",
    };
  }
  
  if (appLower.includes("shower") || appLower.includes("commercial kitchen")) {
    return {
      pRating: "P4",
      rRating: "R10-R11",
      notes: "Wet area with water on floor - shower floors, commercial kitchens require P4 minimum",
    };
  }
  
  if (appLower.includes("bathroom") || appLower.includes("laundry") || appLower.includes("entry")) {
    return {
      pRating: "P3",
      rRating: "R10",
      notes: "Domestic wet area - bathrooms, laundries require P3 minimum",
    };
  }
  
  if (appLower.includes("kitchen") || appLower.includes("living") || appLower.includes("bedroom")) {
    return {
      pRating: "P3",
      rRating: "R9-R10",
      notes: "Standard internal area - P3 acceptable, polished tiles OK",
    };
  }
  
  return {
    pRating: "P3",
    rRating: "R10",
    notes: "General recommendation - check specific BCA requirements for your application",
  };
}

/**
 * Check waterproofing requirements
 */
export function checkWaterproofingRequirements(area: string): {
  required: boolean;
  floorRequired: boolean;
  wallRequired: boolean;
  wallHeightMM: number;
  notes: string[];
} {
  const areaLower = area.toLowerCase();
  const notes: string[] = [];
  
  if (areaLower.includes("shower")) {
    return {
      required: true,
      floorRequired: true,
      wallRequired: true,
      wallHeightMM: 1800,
      notes: [
        "Full shower floor must be waterproofed",
        "Walls to 1800mm minimum above finished floor",
        "Waterproofing must extend under shower screen",
        "Hob to be waterproofed (25mm minimum upturn)",
        "Waterproofing inspection likely required",
      ],
    };
  }
  
  if (areaLower.includes("bathroom") && areaLower.includes("floor")) {
    return {
      required: true,
      floorRequired: true,
      wallRequired: false,
      wallHeightMM: 150,
      notes: [
        "Floor waterproofing required if floor waste present",
        "Or within 1.5m of shower if no floor waste",
        "150mm upturn at walls",
        "Around bath - 300mm above rim",
      ],
    };
  }
  
  if (areaLower.includes("bath")) {
    return {
      required: true,
      floorRequired: false,
      wallRequired: true,
      wallHeightMM: 300,
      notes: [
        "Wall waterproofing to 300mm above bath rim height",
        "Floor around bath as per bathroom floor requirements",
      ],
    };
  }
  
  if (areaLower.includes("laundry")) {
    return {
      required: true,
      floorRequired: true,
      wallRequired: false,
      wallHeightMM: 150,
      notes: [
        "Floor waterproofing required",
        "150mm upturn at walls",
        "Behind washing machine/tub areas",
      ],
    };
  }
  
  if (areaLower.includes("splashback") || areaLower.includes("kitchen")) {
    return {
      required: false,
      floorRequired: false,
      wallRequired: false,
      wallHeightMM: 0,
      notes: [
        "Kitchen splashback typically does not require waterproofing",
        "Ensure silicone seal at benchtop junction",
      ],
    };
  }
  
  return {
    required: false,
    floorRequired: false,
    wallRequired: false,
    wallHeightMM: 0,
    notes: ["Standard dry area - waterproofing not required unless specified"],
  };
}

/**
 * Estimate adhesive coverage based on tile size
 */
export function estimateAdhesiveCoverage(params: {
  tileSizeMM: string;
  backButter: boolean;
  isWetArea: boolean;
}): {
  trowelSize: string;
  coverageM2PerBag: number;
  notes: string[];
} {
  const notes: string[] = [];
  
  // Parse tile size
  const [width, height] = params.tileSizeMM.split("x").map(Number);
  const maxDimension = Math.max(width || 300, height || 300);
  
  let trowelSize: string;
  let coverage: number;
  
  if (maxDimension >= 600) {
    trowelSize = "12mm notched";
    coverage = 3.5; // m² per 20kg bag
    notes.push("Large format tile - 12mm notched trowel required");
    notes.push("Back-buttering recommended");
  } else if (maxDimension >= 300) {
    trowelSize = "10mm notched";
    coverage = 4.5;
    notes.push("Standard format - 10mm notched trowel");
  } else {
    trowelSize = "6mm notched";
    coverage = 5.5;
    notes.push("Small format/mosaic - 6mm notched trowel");
  }
  
  if (params.backButter) {
    coverage *= 0.7; // Use more adhesive when back-buttering
    notes.push("Back-buttering reduces coverage by ~30%");
  }
  
  if (params.isWetArea) {
    notes.push("100% adhesive coverage required in wet areas");
  } else {
    notes.push("Minimum 80% adhesive coverage required");
  }
  
  return {
    trowelSize,
    coverageM2PerBag: Math.round(coverage * 10) / 10,
    notes,
  };
}

/**
 * Calculate bathroom tiling estimate
 */
export function calculateBathroomTiling(params: {
  floorAreaM2: number;
  wallAreaM2: number;
  showerAreaM2: number;
  includeWaterproofing: boolean;
  tileType: "ceramic" | "porcelain";
}): { item: string; quantity: number; unit: string; section: string }[] {
  const materials: { item: string; quantity: number; unit: string; section: string }[] = [];
  
  // Floor tiles
  const floorTileArea = Math.ceil(params.floorAreaM2 * 1.10);
  materials.push({ 
    item: params.tileType === "porcelain" ? "Porcelain Floor Tile 600x600 Matt" : "Ceramic Floor Tile 450x450", 
    quantity: floorTileArea, 
    unit: "m²",
    section: "Floor Tiles",
  });
  
  // Wall tiles
  const wallTileArea = Math.ceil(params.wallAreaM2 * 1.10);
  materials.push({ 
    item: params.tileType === "porcelain" ? "Porcelain Wall Tile 600x300" : "Ceramic Wall Tile 300x600 Matt", 
    quantity: wallTileArea, 
    unit: "m²",
    section: "Wall Tiles",
  });
  
  // Shower feature/mosaic (optional)
  if (params.showerAreaM2 > 0) {
    materials.push({ 
      item: "Glass Mosaic Sheet 300x300", 
      quantity: Math.ceil(params.showerAreaM2 * 0.3 * 1.15), // 30% of shower as feature
      unit: "m²",
      section: "Feature Tiles",
    });
  }
  
  // Waterproofing
  if (params.includeWaterproofing) {
    const waterproofArea = params.floorAreaM2 + params.showerAreaM2 + (params.wallAreaM2 * 0.3); // Estimate
    materials.push({ 
      item: "Waterproofing Membrane Liquid 15L", 
      quantity: Math.ceil(waterproofArea / 20), 
      unit: "drums",
      section: "Waterproofing",
    });
    materials.push({ 
      item: "Waterproofing Band/Cloth 100mm", 
      quantity: Math.ceil((params.floorAreaM2 + params.showerAreaM2) * 2), 
      unit: "lin m",
      section: "Waterproofing",
    });
    materials.push({ 
      item: "Floor Waste Puddle Flange", 
      quantity: 1, 
      unit: "each",
      section: "Waterproofing",
    });
  }
  
  // Adhesive
  const totalArea = params.floorAreaM2 + params.wallAreaM2;
  materials.push({ 
    item: "Tile Adhesive Flexible 20kg", 
    quantity: Math.ceil(totalArea / 4), 
    unit: "bags",
    section: "Adhesives & Grout",
  });
  
  // Grout
  materials.push({ 
    item: "Grout Flexible 5kg", 
    quantity: Math.ceil(totalArea / 8), 
    unit: "bags",
    section: "Adhesives & Grout",
  });
  
  // Silicone
  materials.push({ 
    item: "Silicone Wet Area Clear 300ml", 
    quantity: Math.ceil(totalArea / 8), 
    unit: "tubes",
    section: "Sealants",
  });
  
  // Consumables
  materials.push({ 
    item: "Tile Spacers 3mm (1000 pack)", 
    quantity: Math.ceil(totalArea / 15), 
    unit: "packs",
    section: "Consumables",
  });
  materials.push({ 
    item: "Tile Levelling System Clips", 
    quantity: Math.ceil(totalArea / 3), 
    unit: "boxes",
    section: "Consumables",
  });
  
  return materials;
}
