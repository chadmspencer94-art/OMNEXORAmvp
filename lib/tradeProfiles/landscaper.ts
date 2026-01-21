/**
 * Landscaper Trade Profile Configuration for OMNEXORA
 * 
 * This module provides landscaping-specific configuration including:
 * - Default rates and pricing for landscaping work
 * - Common materials with Australian pricing (plants, pavers, retaining walls, irrigation)
 * - Compliance and safety information (pool fencing, retaining walls, drainage)
 * - Document templates and AI prompt enhancements
 * 
 * Compliance References:
 * - Building Code of Australia (BCA/NCC) - Pool fencing, retaining walls
 * - AS 1926.1 - Swimming pool safety - Safety barriers
 * - AS 4678 - Earth-retaining structures
 * - Local council planning regulations (tree removal, development)
 * - State-based SafeWork regulations
 */

// ============================================================================
// LANDSCAPER DEFAULT RATES (Australian market rates 2024-2026)
// ============================================================================

export const LANDSCAPER_DEFAULT_RATES = {
  // Hourly/daily rates
  hourlyRate: 65, // Landscaper hourly rate
  helperHourlyRate: 40, // Labourer rate
  dayRate: 500, // Full day rate (landscaper)
  dayRateLabourer: 320, // Full day rate (labourer)
  
  // Paving per m²
  ratePerM2ConcretePavers: 95, // Supply + install concrete pavers
  ratePerM2NaturalStone: 180, // Supply + install natural stone
  ratePerM2Bluestone: 220, // Supply + install bluestone
  ratePerM2Granite: 250, // Supply + install granite pavers
  ratePerM2BrickPavers: 110, // Supply + install brick pavers
  ratePerM2PaversLabourOnly: 55, // Paving labour only
  
  // Retaining walls per m²
  ratePerM2TimberRetaining: 280, // Timber sleeper retaining (face m²)
  ratePerM2ConcreteBlockRetaining: 350, // Concrete block retaining
  ratePerM2SandstoneRetaining: 450, // Sandstone retaining wall
  ratePerM2GabionWall: 320, // Gabion basket wall
  ratePerLmRetaining: 180, // Per lineal metre (to 600mm height)
  
  // Turf and lawn per m²
  ratePerM2TurfSupplyInstall: 28, // Supply + install turf
  ratePerM2TurfLabourOnly: 12, // Turf laying labour only
  ratePerM2LawnPrep: 18, // Soil prep, level, fertilise
  ratePerM2SeedingLawn: 15, // Lawn seeding
  ratePerM2SyntheticTurf: 95, // Synthetic turf supply + install
  
  // Garden beds per m²
  ratePerM2GardenBedPrep: 45, // Prepare garden bed (dig, improve soil)
  ratePerM2Mulching: 18, // Supply + spread mulch
  ratePerM2PlantingMassPlanting: 35, // Mass planting (labour per m²)
  
  // Edging per lineal metre
  ratePerLmSteelEdging: 45, // Steel garden edging
  ratePerLmConcreteEdging: 35, // Concrete edge/mowing strip
  ratePerLmTimberEdging: 28, // Timber edge
  ratePerLmBrickEdging: 55, // Brick border edging
  
  // Fencing per lineal metre
  ratePerLmColourbondFencing: 180, // 1.8m Colorbond fence
  ratePerLmTimberFencing: 220, // 1.8m timber paling fence
  ratePerLmPoolFencing: 350, // Glass/aluminium pool fence
  ratePerLmGateSingle: 450, // Single pedestrian gate
  ratePerLmGateDouble: 850, // Double driveway gate
  
  // Irrigation per point
  ratePerIrrigationPoint: 65, // Per sprinkler/dripper zone point
  ratePerIrrigationZone: 350, // Per zone (controller, valve, etc.)
  ratePerDripperLineLm: 8, // Dripper line per metre
  
  // Drainage
  ratePerAgDrainLm: 45, // Ag drain per lineal metre
  ratePerStormwaterPitEach: 280, // Stormwater pit installation
  ratePerFrenchDrainLm: 85, // French drain per lineal metre
  
  // Excavation
  ratePerM3Excavation: 85, // Hand excavation per m³
  ratePerM3MachineExcavation: 55, // Bobcat/excavator per m³
  ratePerM3SoilRemoval: 120, // Soil removal and disposal per m³
  
  // Feature items
  ratePerWaterFeatureSmall: 1500, // Small water feature (supply + install)
  ratePerFirePit: 1200, // Fire pit (supply + install)
  ratePerPergolaPer: 4500, // Standard pergola
  ratePerDeckingM2: 450, // Hardwood deck per m²
  
  // Planting rates
  ratePerTreePlanting: 85, // Tree planting (up to 45L pot)
  ratePerShrubPlanting: 25, // Shrub planting (up to 200mm pot)
  ratePerGroundcoverPlanting: 8, // Groundcover (tube stock)
  
  // Minimum charges
  minCharge: 450, // Minimum job charge
  calloutFee: 85, // Site visit/quote fee
  designFee: 350, // Landscape design fee (deducted if proceed)
  
  // Material markup
  materialMarkupPercent: 30, // Standard markup on materials
};

// ============================================================================
// COMMON LANDSCAPING MATERIALS (Australian pricing)
// ============================================================================

export interface LandscapingMaterial {
  name: string;
  category: string;
  supplier: string;
  unitLabel: string;
  unitCost: number;
  notes: string;
}

export const LANDSCAPER_DEFAULT_MATERIALS: LandscapingMaterial[] = [
  // Paving - Concrete Pavers
  {
    name: "Concrete Paver 400x400 Standard",
    category: "Pavers",
    supplier: "Bunnings/Landscape supplies",
    unitLabel: "m²",
    unitCost: 35.00,
    notes: "Budget concrete paver",
  },
  {
    name: "Concrete Paver 400x400 Exposed",
    category: "Pavers",
    supplier: "Adbri/Boral",
    unitLabel: "m²",
    unitCost: 48.00,
    notes: "Exposed aggregate finish",
  },
  {
    name: "Charcoal Concrete Paver 500x500",
    category: "Pavers",
    supplier: "Adbri/Boral",
    unitLabel: "m²",
    unitCost: 55.00,
    notes: "Large format charcoal",
  },
  
  // Paving - Natural Stone
  {
    name: "Sandstone Paver 400x400 Natural",
    category: "Natural Stone",
    supplier: "Stone yards",
    unitLabel: "m²",
    unitCost: 85.00,
    notes: "Natural sandstone, varied colours",
  },
  {
    name: "Bluestone Paver Sawn 400x400",
    category: "Natural Stone",
    supplier: "Stone yards",
    unitLabel: "m²",
    unitCost: 120.00,
    notes: "Premium Victorian bluestone",
  },
  {
    name: "Granite Paver 600x300 Flamed",
    category: "Natural Stone",
    supplier: "Stone yards",
    unitLabel: "m²",
    unitCost: 145.00,
    notes: "Flamed finish, slip-resistant",
  },
  {
    name: "Travertine Paver 600x400",
    category: "Natural Stone",
    supplier: "Stone yards",
    unitLabel: "m²",
    unitCost: 95.00,
    notes: "Tumbled travertine",
  },
  {
    name: "Limestone Paver 500x500",
    category: "Natural Stone",
    supplier: "Stone yards",
    unitLabel: "m²",
    unitCost: 75.00,
    notes: "Natural limestone",
  },
  
  // Paving - Brick
  {
    name: "Clay Brick Paver Standard",
    category: "Brick Pavers",
    supplier: "Austral Bricks/PGH",
    unitLabel: "m²",
    unitCost: 55.00,
    notes: "Standard clay paver",
  },
  {
    name: "Clay Brick Paver Premium",
    category: "Brick Pavers",
    supplier: "Austral Bricks",
    unitLabel: "m²",
    unitCost: 75.00,
    notes: "Premium colours/finishes",
  },
  
  // Paving Base Materials
  {
    name: "Road Base 20mm (per tonne)",
    category: "Base Materials",
    supplier: "Landscape supplies",
    unitLabel: "Tonne",
    unitCost: 55.00,
    notes: "Compacted base layer",
  },
  {
    name: "Paver Sand (per m³)",
    category: "Base Materials",
    supplier: "Landscape supplies",
    unitLabel: "m³",
    unitCost: 85.00,
    notes: "Bedding sand for pavers",
  },
  {
    name: "Polymeric Joint Sand 20kg",
    category: "Base Materials",
    supplier: "Landscape supplies",
    unitLabel: "Bag",
    unitCost: 45.00,
    notes: "Lock-in joint sand",
  },
  
  // Retaining Wall Materials
  {
    name: "Hardwood Sleeper 200x50x2400",
    category: "Retaining",
    supplier: "Timber yards",
    unitLabel: "Each",
    unitCost: 65.00,
    notes: "Hardwood railway sleeper",
  },
  {
    name: "Treated Pine Sleeper 200x75x2400",
    category: "Retaining",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Each",
    unitCost: 48.00,
    notes: "H4 treated pine sleeper",
  },
  {
    name: "Concrete Retaining Block 400x200x200",
    category: "Retaining",
    supplier: "Adbri/Boral",
    unitLabel: "Each",
    unitCost: 12.00,
    notes: "Interlocking retaining block",
  },
  {
    name: "Besser Block 390x190x190",
    category: "Retaining",
    supplier: "Masonry supplies",
    unitLabel: "Each",
    unitCost: 4.50,
    notes: "Standard concrete block",
  },
  {
    name: "Sandstone Block 500x300x200",
    category: "Retaining",
    supplier: "Stone yards",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Natural sandstone block",
  },
  {
    name: "Gabion Cage 2000x1000x500",
    category: "Retaining",
    supplier: "Landscape supplies",
    unitLabel: "Each",
    unitCost: 85.00,
    notes: "Wire gabion basket",
  },
  {
    name: "Gabion Fill Stone (per tonne)",
    category: "Retaining",
    supplier: "Quarry",
    unitLabel: "Tonne",
    unitCost: 65.00,
    notes: "River rock or similar",
  },
  {
    name: "Geotextile Fabric (per m²)",
    category: "Retaining",
    supplier: "Landscape supplies",
    unitLabel: "m²",
    unitCost: 3.50,
    notes: "Behind retaining walls",
  },
  {
    name: "Ag Pipe 100mm (per m)",
    category: "Drainage",
    supplier: "Bunnings/Plumbing",
    unitLabel: "Lin m",
    unitCost: 8.00,
    notes: "Slotted drainage pipe",
  },
  
  // Turf and Lawn
  {
    name: "Buffalo Turf (Sir Walter/Sapphire)",
    category: "Turf",
    supplier: "Turf farms",
    unitLabel: "m²",
    unitCost: 14.00,
    notes: "Premium soft-leaf buffalo",
  },
  {
    name: "Kikuyu Turf",
    category: "Turf",
    supplier: "Turf farms",
    unitLabel: "m²",
    unitCost: 9.00,
    notes: "Hardy, fast-growing",
  },
  {
    name: "Couch Turf",
    category: "Turf",
    supplier: "Turf farms",
    unitLabel: "m²",
    unitCost: 8.00,
    notes: "Fine leaf, full sun",
  },
  {
    name: "Zoysia Turf",
    category: "Turf",
    supplier: "Turf farms",
    unitLabel: "m²",
    unitCost: 12.00,
    notes: "Shade tolerant, slow growing",
  },
  {
    name: "Synthetic Turf 35mm",
    category: "Synthetic",
    supplier: "Synthetic turf suppliers",
    unitLabel: "m²",
    unitCost: 45.00,
    notes: "Mid-range synthetic grass",
  },
  {
    name: "Synthetic Turf 40mm Premium",
    category: "Synthetic",
    supplier: "Synthetic turf suppliers",
    unitLabel: "m²",
    unitCost: 65.00,
    notes: "Premium realistic synthetic",
  },
  {
    name: "Turf Underlay/Weed Mat",
    category: "Turf",
    supplier: "Bunnings",
    unitLabel: "m²",
    unitCost: 2.50,
    notes: "For synthetic turf",
  },
  
  // Soil and Amendments
  {
    name: "Garden Mix Soil (per m³)",
    category: "Soil",
    supplier: "Landscape supplies",
    unitLabel: "m³",
    unitCost: 75.00,
    notes: "Blended garden soil",
  },
  {
    name: "Premium Topsoil (per m³)",
    category: "Soil",
    supplier: "Landscape supplies",
    unitLabel: "m³",
    unitCost: 95.00,
    notes: "Screened topsoil",
  },
  {
    name: "Turf Underlay Soil (per m³)",
    category: "Soil",
    supplier: "Landscape supplies",
    unitLabel: "m³",
    unitCost: 65.00,
    notes: "Sandy loam for turf",
  },
  {
    name: "Compost (per m³)",
    category: "Soil",
    supplier: "Landscape supplies",
    unitLabel: "m³",
    unitCost: 55.00,
    notes: "Organic compost",
  },
  {
    name: "Gypite/Soil Conditioner (per m³)",
    category: "Soil",
    supplier: "Landscape supplies",
    unitLabel: "m³",
    unitCost: 45.00,
    notes: "Clay breaker",
  },
  {
    name: "Starter Fertiliser 25kg",
    category: "Soil",
    supplier: "Bunnings/Rural",
    unitLabel: "Bag",
    unitCost: 45.00,
    notes: "Turf/garden starter",
  },
  
  // Mulch
  {
    name: "Pine Bark Mulch (per m³)",
    category: "Mulch",
    supplier: "Landscape supplies",
    unitLabel: "m³",
    unitCost: 65.00,
    notes: "Standard pine bark",
  },
  {
    name: "Hardwood Chip Mulch (per m³)",
    category: "Mulch",
    supplier: "Landscape supplies",
    unitLabel: "m³",
    unitCost: 55.00,
    notes: "Recycled hardwood",
  },
  {
    name: "Red Gum Mulch (per m³)",
    category: "Mulch",
    supplier: "Landscape supplies",
    unitLabel: "m³",
    unitCost: 75.00,
    notes: "Premium red gum",
  },
  {
    name: "Black Mulch (per m³)",
    category: "Mulch",
    supplier: "Landscape supplies",
    unitLabel: "m³",
    unitCost: 85.00,
    notes: "Dyed black mulch",
  },
  {
    name: "Pebble Mulch 20mm (per tonne)",
    category: "Mulch",
    supplier: "Landscape supplies",
    unitLabel: "Tonne",
    unitCost: 145.00,
    notes: "Decorative pebbles",
  },
  {
    name: "White Marble Chip (per tonne)",
    category: "Mulch",
    supplier: "Landscape supplies",
    unitLabel: "Tonne",
    unitCost: 195.00,
    notes: "White decorative stone",
  },
  
  // Edging
  {
    name: "Steel Garden Edging 150mm (per m)",
    category: "Edging",
    supplier: "FormBoss/similar",
    unitLabel: "Lin m",
    unitCost: 18.00,
    notes: "Black steel edging",
  },
  {
    name: "Aluminium Edging 100mm (per m)",
    category: "Edging",
    supplier: "Landscape supplies",
    unitLabel: "Lin m",
    unitCost: 12.00,
    notes: "Flexible aluminium",
  },
  {
    name: "Concrete Mowing Strip (per m)",
    category: "Edging",
    supplier: "Ready-mix",
    unitLabel: "Lin m",
    unitCost: 15.00,
    notes: "Poured concrete edge",
  },
  {
    name: "Timber Edging Treated Pine (per m)",
    category: "Edging",
    supplier: "Bunnings",
    unitLabel: "Lin m",
    unitCost: 8.00,
    notes: "100x25 treated pine",
  },
  
  // Fencing
  {
    name: "Colorbond Fence Sheet 1.8m",
    category: "Fencing",
    supplier: "Steel suppliers",
    unitLabel: "Sheet",
    unitCost: 38.00,
    notes: "Standard Colorbond panel",
  },
  {
    name: "Colorbond Post 50x50x2400",
    category: "Fencing",
    supplier: "Steel suppliers",
    unitLabel: "Each",
    unitCost: 28.00,
    notes: "Fence post",
  },
  {
    name: "Fence Rail Colorbond",
    category: "Fencing",
    supplier: "Steel suppliers",
    unitLabel: "Each",
    unitCost: 18.00,
    notes: "Top/bottom rail",
  },
  {
    name: "Treated Pine Paling 1800x75x19",
    category: "Fencing",
    supplier: "Timber yards",
    unitLabel: "Each",
    unitCost: 3.50,
    notes: "Fence paling",
  },
  {
    name: "Hardwood Post 100x100x2700",
    category: "Fencing",
    supplier: "Timber yards",
    unitLabel: "Each",
    unitCost: 55.00,
    notes: "Fence/gate post",
  },
  {
    name: "Pool Fence Glass Panel 1200x",
    category: "Pool Fencing",
    supplier: "Pool fence suppliers",
    unitLabel: "Panel",
    unitCost: 180.00,
    notes: "12mm toughened glass",
  },
  {
    name: "Pool Fence Aluminium Post",
    category: "Pool Fencing",
    supplier: "Pool fence suppliers",
    unitLabel: "Each",
    unitCost: 85.00,
    notes: "Spigot or post",
  },
  {
    name: "Pool Gate Self-Closing",
    category: "Pool Fencing",
    supplier: "Pool fence suppliers",
    unitLabel: "Each",
    unitCost: 450.00,
    notes: "Compliant pool gate",
  },
  
  // Irrigation
  {
    name: "Irrigation Controller 6 Zone",
    category: "Irrigation",
    supplier: "Irrigation supplies/Bunnings",
    unitLabel: "Each",
    unitCost: 180.00,
    notes: "Smart controller",
  },
  {
    name: "Irrigation Controller 12 Zone",
    category: "Irrigation",
    supplier: "Irrigation supplies",
    unitLabel: "Each",
    unitCost: 350.00,
    notes: "Large smart controller",
  },
  {
    name: "Solenoid Valve 25mm",
    category: "Irrigation",
    supplier: "Irrigation supplies",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Zone valve",
  },
  {
    name: "Pop-up Sprinkler MP Rotator",
    category: "Irrigation",
    supplier: "Irrigation supplies",
    unitLabel: "Each",
    unitCost: 28.00,
    notes: "Efficient rotary nozzle",
  },
  {
    name: "Pop-up Sprinkler Standard",
    category: "Irrigation",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 12.00,
    notes: "Standard spray head",
  },
  {
    name: "Poly Pipe 25mm (per m)",
    category: "Irrigation",
    supplier: "Irrigation supplies",
    unitLabel: "Lin m",
    unitCost: 2.50,
    notes: "Main line pipe",
  },
  {
    name: "Drip Line 13mm (per m)",
    category: "Irrigation",
    supplier: "Irrigation supplies",
    unitLabel: "Lin m",
    unitCost: 1.80,
    notes: "Inline dripper tube",
  },
  {
    name: "Irrigation Valve Box",
    category: "Irrigation",
    supplier: "Irrigation supplies",
    unitLabel: "Each",
    unitCost: 25.00,
    notes: "Underground valve box",
  },
  
  // Drainage
  {
    name: "Ag Pipe 65mm Slotted (per m)",
    category: "Drainage",
    supplier: "Plumbing/Bunnings",
    unitLabel: "Lin m",
    unitCost: 5.00,
    notes: "Small drain pipe",
  },
  {
    name: "Ag Pipe 100mm Slotted (per m)",
    category: "Drainage",
    supplier: "Plumbing/Bunnings",
    unitLabel: "Lin m",
    unitCost: 8.00,
    notes: "Standard drain pipe",
  },
  {
    name: "Grate Drain 100mm (per m)",
    category: "Drainage",
    supplier: "Drainage supplies",
    unitLabel: "Lin m",
    unitCost: 45.00,
    notes: "Channel drain with grate",
  },
  {
    name: "Stormwater Pit 300x300",
    category: "Drainage",
    supplier: "Drainage supplies",
    unitLabel: "Each",
    unitCost: 85.00,
    notes: "Junction pit with grate",
  },
  {
    name: "20mm Drainage Gravel (per tonne)",
    category: "Drainage",
    supplier: "Landscape supplies",
    unitLabel: "Tonne",
    unitCost: 55.00,
    notes: "Drainage aggregate",
  },
  
  // Plants (indicative pricing)
  {
    name: "Advanced Tree 45L",
    category: "Plants",
    supplier: "Wholesale nurseries",
    unitLabel: "Each",
    unitCost: 120.00,
    notes: "Established tree",
  },
  {
    name: "Advanced Tree 100L",
    category: "Plants",
    supplier: "Wholesale nurseries",
    unitLabel: "Each",
    unitCost: 280.00,
    notes: "Large feature tree",
  },
  {
    name: "Shrub 200mm Pot",
    category: "Plants",
    supplier: "Wholesale nurseries",
    unitLabel: "Each",
    unitCost: 12.00,
    notes: "Standard shrub",
  },
  {
    name: "Shrub 300mm Pot",
    category: "Plants",
    supplier: "Wholesale nurseries",
    unitLabel: "Each",
    unitCost: 25.00,
    notes: "Established shrub",
  },
  {
    name: "Groundcover Tube Stock",
    category: "Plants",
    supplier: "Wholesale nurseries",
    unitLabel: "Each",
    unitCost: 3.50,
    notes: "Tube stock groundcover",
  },
  {
    name: "Groundcover 140mm Pot",
    category: "Plants",
    supplier: "Wholesale nurseries",
    unitLabel: "Each",
    unitCost: 8.00,
    notes: "Established groundcover",
  },
  {
    name: "Ornamental Grass 200mm",
    category: "Plants",
    supplier: "Wholesale nurseries",
    unitLabel: "Each",
    unitCost: 15.00,
    notes: "Lomandra, Dianella, etc.",
  },
  {
    name: "Hedge Plant 200mm",
    category: "Plants",
    supplier: "Wholesale nurseries",
    unitLabel: "Each",
    unitCost: 12.00,
    notes: "Lilly Pilly, Murraya, etc.",
  },
  
  // Lighting
  {
    name: "Garden Spike Light LED",
    category: "Lighting",
    supplier: "Lighting supplies",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "12V LED garden light",
  },
  {
    name: "Garden Bollard Light LED",
    category: "Lighting",
    supplier: "Lighting supplies",
    unitLabel: "Each",
    unitCost: 120.00,
    notes: "Path bollard light",
  },
  {
    name: "LED Strip Lighting (per m)",
    category: "Lighting",
    supplier: "Lighting supplies",
    unitLabel: "Lin m",
    unitCost: 25.00,
    notes: "Outdoor LED strip",
  },
  {
    name: "12V Transformer 150W",
    category: "Lighting",
    supplier: "Lighting supplies",
    unitLabel: "Each",
    unitCost: 120.00,
    notes: "Garden lighting transformer",
  },
  
  // Features
  {
    name: "Water Feature Bowl Small",
    category: "Features",
    supplier: "Garden centres",
    unitLabel: "Each",
    unitCost: 450.00,
    notes: "Small self-contained feature",
  },
  {
    name: "Water Feature Bowl Large",
    category: "Features",
    supplier: "Garden centres",
    unitLabel: "Each",
    unitCost: 950.00,
    notes: "Large statement feature",
  },
  {
    name: "Fire Pit Steel",
    category: "Features",
    supplier: "Outdoor living",
    unitLabel: "Each",
    unitCost: 350.00,
    notes: "Steel fire pit",
  },
  {
    name: "Fire Pit Gas",
    category: "Features",
    supplier: "Outdoor living",
    unitLabel: "Each",
    unitCost: 1200.00,
    notes: "Gas fire pit table",
  },
];

// ============================================================================
// AUSTRALIAN COMPLIANCE INFORMATION
// ============================================================================

export const LANDSCAPER_COMPLIANCE = {
  // Pool Fencing Requirements
  poolFencing: {
    standard: "AS 1926.1 - Swimming pool safety - Safety barriers for swimming pools",
    requirements: [
      "Minimum 1200mm high barrier",
      "No climbable objects within 900mm of fence",
      "Maximum 100mm gap at bottom",
      "Maximum 10mm gap between vertical members (for non-climbable)",
      "Self-closing, self-latching gate required",
      "Gate must open away from pool",
      "Latch minimum 1500mm from ground (or 1400mm with shielded release)",
      "No horizontal rails that could be used as footholds",
    ],
    inspection: "Most councils require pool fence inspection and compliance certificate",
    penalties: "Significant fines for non-compliant pool barriers",
    notes: "Check local council for specific requirements as they may exceed AS 1926.1",
  },

  // Retaining Wall Requirements
  retainingWalls: {
    standard: "AS 4678 - Earth-retaining structures",
    bcaRequirements: {
      under600mm: "Generally exempt from approval",
      over600mm: "May require council approval",
      over1000mm: "Typically requires engineering and council approval",
    },
    engineeringRequired: [
      "Walls over 600mm (varies by council)",
      "Walls supporting surcharge loads (driveways, buildings)",
      "Walls on or near boundaries",
      "Walls in flood-prone or unstable areas",
      "Walls holding contaminated fill",
    ],
    drainage: "Adequate drainage behind wall is essential to prevent failure",
    setbacks: "Check council requirements for boundary setbacks",
  },

  // Tree Removal and Protection
  treeManagement: {
    permits: "Most councils require permits for significant tree removal",
    protectionOrders: [
      "Tree Preservation Orders (TPO)",
      "Significant Tree Registers",
      "Heritage tree protection",
    ],
    definitions: "Significant tree typically defined by trunk diameter, species, or location",
    penalties: "Heavy fines for removing protected trees without approval",
    rootProtection: "Australian Standard AS 4970 - Protection of trees on development sites",
    notes: "Always check council tree regulations before removal or major pruning",
  },

  // Drainage and Stormwater
  drainage: {
    requirement: "Must not redirect stormwater onto neighbouring properties",
    bcaCompliance: "BCA requirements for surface water drainage",
    standards: [
      "AS/NZS 3500.3 - Stormwater drainage",
      "Council stormwater management requirements",
    ],
    considerations: [
      "Maintain natural drainage patterns where possible",
      "Connect to council stormwater if required",
      "On-site detention may be required for large hard surfaces",
      "Rain gardens/infiltration for water-sensitive urban design",
    ],
  },

  // Development Approvals
  developmentApprovals: {
    typicallyRequired: [
      "Retaining walls over specified height",
      "Pool fencing",
      "Significant tree removal",
      "Structures (pergolas, gazebos, sheds) over certain size",
      "Fencing in heritage areas",
      "Work in flood-prone areas",
      "Changes to stormwater drainage",
    ],
    exemptDevelopment: [
      "Minor landscaping (planting, mulching)",
      "Small retaining walls (typically under 600mm)",
      "Garden edging",
      "Standard fencing (check height limits)",
      "Minor paving (check percentage limits)",
    ],
    notes: "Always verify with local council - requirements vary significantly",
  },

  // Bushfire Zones (BAL)
  bushfireZones: {
    requirement: "Special landscaping requirements in bushfire-prone areas",
    balRatings: "BAL-LOW to BAL-FZ (Flame Zone)",
    landscapeRequirements: [
      "Defendable space around buildings",
      "Fuel reduction zones",
      "Plant selection (low flammability species)",
      "Mulch restrictions (may require non-combustible)",
      "No plants touching buildings",
    ],
    reference: "AS 3959 - Construction of buildings in bushfire-prone areas",
  },

  // SafeWork Requirements
  safeWork: {
    requirements: [
      "Manual handling (heavy materials, plants)",
      "Working in heat/sun exposure",
      "Power tool and machinery safety",
      "Trenching and excavation safety",
      "Chemical handling (fertilisers, pesticides)",
      "Working near traffic",
      "Electrical safety (lighting, pumps)",
    ],
    ppe: [
      "Sun protection (hat, sunscreen, long sleeves)",
      "Safety glasses",
      "Gloves",
      "Steel-capped boots",
      "Hearing protection (mowers, tools)",
      "Dust mask (as required)",
    ],
    chemicals: {
      requirement: "Follow label directions and SDS for all chemicals",
      licensing: "Some pesticides require ChemCert or similar certification",
      storage: "Proper storage of chemicals required",
    },
    excavation: {
      shoring: "Trenches over 1.5m may require shoring",
      dialBeforeYouDig: "Always contact Dial Before You Dig before excavation",
    },
  },

  // Warranty
  warranty: {
    workmanship: "Standard 12 months workmanship warranty",
    plants: [
      "Typically 4-8 weeks establishment period",
      "Excludes failure due to lack of watering",
      "Excludes vandalism, storm damage, neglect",
    ],
    structures: "Retaining walls, paving - typically 5-7 years",
    irrigation: "Systems typically 12-24 months",
  },
};

// ============================================================================
// AI PROMPT ENHANCEMENTS FOR LANDSCAPING
// ============================================================================

export const LANDSCAPER_AI_CONTEXT = {
  // Trade-specific context for AI document generation
  tradeDescription: "professional landscaper specialising in residential and commercial landscaping including paving, retaining walls, planting, turf, irrigation, and outdoor living spaces",
  
  // Common scope items for landscaping work
  commonScopeItems: [
    "Site clearing and preparation",
    "Excavation and soil removal",
    "Retaining wall construction",
    "Paving installation",
    "Turf supply and installation",
    "Synthetic turf installation",
    "Garden bed preparation",
    "Mulching",
    "Planting (trees, shrubs, groundcovers)",
    "Irrigation system installation",
    "Drainage installation",
    "Fencing installation",
    "Pool fencing (compliant)",
    "Garden edging",
    "Outdoor lighting",
    "Water feature installation",
    "Pergola/deck construction",
    "Raised garden beds",
    "Pathway construction",
    "Driveway paving",
  ],
  
  // Standard inclusions for landscaping quotes
  standardInclusions: [
    "Supply of specified materials",
    "Professional installation",
    "Site clean-up and waste removal",
    "Basic soil preparation",
    "Standard drainage (as required)",
    "Workmanship warranty",
    "Plant establishment guidance",
  ],
  
  // Standard exclusions for landscaping quotes
  standardExclusions: [
    "Council/development approvals",
    "Engineering certification (if required)",
    "Removal of existing structures (unless specified)",
    "Rock/root removal beyond normal excavation",
    "Soil contamination testing/remediation",
    "Electrical connection (by licensed electrician)",
    "Plumbing connection (by licensed plumber)",
    "Ongoing maintenance",
    "Plant replacement after establishment period",
    "Access issues (crane hire, etc.)",
  ],
  
  // Plant selection guidance
  plantSelection: {
    fullSun: "Lomandra, Dianella, Grevillea, Westringia, Agave",
    partShade: "Liriope, Clivea, Native Violet, Philodendron",
    shade: "Aspidistra, Cast Iron Plant, Peace Lily, Ferns",
    coastal: "Coastal Banksia, Pigface, Coastal Rosemary, Cushion Bush",
    droughtTolerant: "Succulents, Agave, Yucca, Kangaroo Paw, Native grasses",
    hedging: "Lilly Pilly, Murraya, Viburnum, Photinia",
  },
  
  // Safety considerations for SWMS
  safetyHazards: [
    "Manual handling (heavy materials, plants, soil)",
    "Heat stress and sun exposure",
    "Power tool injuries (mowers, trimmers, saws)",
    "Trenching/excavation collapse",
    "Underground services (gas, electrical, water)",
    "Chemical exposure (fertilisers, herbicides)",
    "Machinery operation (bobcat, excavator)",
    "Working near traffic",
    "Slips, trips, falls on uneven ground",
    "Insect stings and bites",
  ],
  
  // Safety controls required
  safetyControls: [
    "Team lifting for heavy items",
    "Adequate hydration and sun protection",
    "PPE - glasses, gloves, boots, hearing protection",
    "Dial Before You Dig completed before excavation",
    "Shoring for deep trenches",
    "Chemical SDS and handling procedures",
    "Machinery competency/tickets",
    "Traffic management if required",
    "First aid kit on site",
  ],
  
  // Maintenance guidance
  maintenanceGuidance: {
    newTurf: {
      watering: "Daily for first 2 weeks, then reduce gradually",
      mowing: "First mow at 6-8 weeks when grass is established",
      fertilising: "Starter fertiliser at planting, then every 6-8 weeks",
    },
    newPlants: {
      watering: "Deep water 2-3 times per week for first 3 months",
      mulch: "Maintain 75mm mulch depth, keep away from stems",
      pruning: "Light tip pruning to encourage bushy growth",
    },
    paving: {
      cleaning: "Sweep regularly, pressure wash annually",
      joints: "Top up polymeric sand if washing out",
      sealing: "Consider sealing natural stone every 2-5 years",
    },
    irrigation: {
      seasonal: "Adjust watering schedules seasonally",
      inspection: "Check for leaks and blocked heads monthly",
      winterisation: "Reduce frequency significantly in winter",
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default rate template for landscapers
 */
export function getLandscaperDefaultRateTemplate() {
  return {
    name: "Landscaper - Standard Rates",
    tradeType: "Landscaper",
    propertyType: null,
    hourlyRate: LANDSCAPER_DEFAULT_RATES.hourlyRate,
    helperHourlyRate: LANDSCAPER_DEFAULT_RATES.helperHourlyRate,
    dayRate: LANDSCAPER_DEFAULT_RATES.dayRate,
    calloutFee: LANDSCAPER_DEFAULT_RATES.calloutFee,
    minCharge: LANDSCAPER_DEFAULT_RATES.minCharge,
    ratePerM2Interior: LANDSCAPER_DEFAULT_RATES.ratePerM2TurfSupplyInstall,
    ratePerM2Exterior: LANDSCAPER_DEFAULT_RATES.ratePerM2ConcretePavers,
    ratePerLmTrim: LANDSCAPER_DEFAULT_RATES.ratePerLmSteelEdging,
    materialMarkupPercent: LANDSCAPER_DEFAULT_RATES.materialMarkupPercent,
    isDefault: true,
  };
}

/**
 * Get landscaper-specific AI system prompt enhancement
 */
export function getLandscaperSystemPromptContext(): string {
  return `
Trade-Specific Context (Landscaper):
- This is landscaping work in Australia
- Pool fencing must comply with AS 1926.1 (1200mm min height, self-closing gate)
- Retaining walls over 600mm typically need council approval
- Retaining walls over 1000mm usually need engineering
- Tree removal may require council permit (check local regulations)
- Must not redirect stormwater onto neighbours
- Dial Before You Dig required before any excavation
- Common materials: pavers, sleepers, turf, mulch, plants, irrigation
- Popular turf: Sir Walter Buffalo, Kikuyu, Couch
- Suppliers: Bunnings, landscape yards, wholesale nurseries
- SAFETY: Manual handling, sun exposure, excavation, chemicals
- Check BAL rating requirements in bushfire-prone areas
`;
}

/**
 * Calculate paving materials
 */
export function calculatePavingMaterials(params: {
  areaM2: number;
  paverType: "concrete" | "naturalStone" | "brick";
  includeEdging?: boolean;
  edgingPerimeterM?: number;
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  // Pavers with waste factor
  const paverArea = Math.ceil(params.areaM2 * 1.10); // 10% waste
  const paverItem = {
    concrete: "Concrete Paver 400x400",
    naturalStone: "Sandstone Paver 400x400",
    brick: "Clay Brick Paver",
  }[params.paverType];
  
  materials.push({ item: paverItem, quantity: paverArea, unit: "m²" });
  
  // Road base (100mm depth = 0.1m³ per m²)
  const roadBaseTonnes = Math.ceil((params.areaM2 * 0.1) * 2.2); // ~2.2t per m³
  materials.push({ item: "Road Base 20mm", quantity: roadBaseTonnes, unit: "tonnes" });
  
  // Paver sand (25mm depth)
  const sandM3 = Math.ceil(params.areaM2 * 0.025 * 1.2); // 20% waste
  materials.push({ item: "Paver Sand", quantity: sandM3, unit: "m³" });
  
  // Joint sand
  const jointSandBags = Math.ceil(params.areaM2 / 8); // ~8m² per 20kg bag
  materials.push({ item: "Polymeric Joint Sand 20kg", quantity: jointSandBags, unit: "bags" });
  
  // Edging
  if (params.includeEdging && params.edgingPerimeterM) {
    materials.push({ item: "Steel Garden Edging 150mm", quantity: Math.ceil(params.edgingPerimeterM * 1.1), unit: "lin m" });
  }
  
  return materials;
}

/**
 * Calculate turf materials
 */
export function calculateTurfMaterials(params: {
  areaM2: number;
  turfType: "buffalo" | "kikuyu" | "couch" | "synthetic";
  includeSoilPrep?: boolean;
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  // Turf with waste factor
  const turfArea = Math.ceil(params.areaM2 * 1.05); // 5% waste
  
  if (params.turfType === "synthetic") {
    materials.push({ item: "Synthetic Turf 35mm", quantity: turfArea, unit: "m²" });
    materials.push({ item: "Turf Underlay/Weed Mat", quantity: turfArea, unit: "m²" });
    // Infill sand for synthetic
    materials.push({ item: "Paver Sand", quantity: Math.ceil(params.areaM2 * 0.01), unit: "m³" });
  } else {
    const turfItem = {
      buffalo: "Buffalo Turf (Sir Walter/Sapphire)",
      kikuyu: "Kikuyu Turf",
      couch: "Couch Turf",
    }[params.turfType];
    materials.push({ item: turfItem, quantity: turfArea, unit: "m²" });
    
    // Starter fertiliser
    materials.push({ item: "Starter Fertiliser 25kg", quantity: Math.ceil(params.areaM2 / 100), unit: "bags" });
  }
  
  // Soil prep
  if (params.includeSoilPrep) {
    const soilM3 = Math.ceil(params.areaM2 * 0.05); // 50mm topsoil layer
    materials.push({ item: "Turf Underlay Soil", quantity: soilM3, unit: "m³" });
  }
  
  return materials;
}

/**
 * Calculate retaining wall materials
 */
export function calculateRetainingWallMaterials(params: {
  lengthM: number;
  heightM: number;
  wallType: "timberSleeper" | "concreteBlock" | "sandstone" | "gabion";
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  const faceAreaM2 = params.lengthM * params.heightM;
  
  switch (params.wallType) {
    case "timberSleeper":
      // Sleepers per course
      const sleepersPerCourse = Math.ceil(params.lengthM / 2.4);
      const courses = Math.ceil(params.heightM / 0.2);
      materials.push({ item: "Hardwood Sleeper 200x50x2400", quantity: sleepersPerCourse * courses, unit: "each" });
      // Posts (every 1.2m)
      const posts = Math.ceil(params.lengthM / 1.2) + 1;
      materials.push({ item: "Hardwood Post 100x100x2700", quantity: posts, unit: "each" });
      break;
      
    case "concreteBlock":
      // Blocks per m² (400x200 face = ~12.5 per m²)
      const blocks = Math.ceil(faceAreaM2 * 12.5 * 1.1);
      materials.push({ item: "Concrete Retaining Block 400x200x200", quantity: blocks, unit: "each" });
      break;
      
    case "sandstone":
      const sandstoneBlocks = Math.ceil(faceAreaM2 * 3.5 * 1.1); // ~3.5 per m² for 500x300 face
      materials.push({ item: "Sandstone Block 500x300x200", quantity: sandstoneBlocks, unit: "each" });
      break;
      
    case "gabion":
      const gabionCages = Math.ceil((params.lengthM / 2) * Math.ceil(params.heightM / 0.5));
      materials.push({ item: "Gabion Cage 2000x1000x500", quantity: gabionCages, unit: "each" });
      const fillTonnes = Math.ceil(gabionCages * 0.8); // ~0.8t per cage
      materials.push({ item: "Gabion Fill Stone", quantity: fillTonnes, unit: "tonnes" });
      break;
  }
  
  // Drainage (all wall types)
  materials.push({ item: "Ag Pipe 100mm", quantity: Math.ceil(params.lengthM * 1.1), unit: "lin m" });
  materials.push({ item: "20mm Drainage Gravel", quantity: Math.ceil(params.lengthM * 0.3), unit: "tonnes" });
  materials.push({ item: "Geotextile Fabric", quantity: Math.ceil(params.lengthM * params.heightM * 1.5), unit: "m²" });
  
  return materials;
}

/**
 * Check pool fence compliance
 */
export function checkPoolFenceCompliance(params: {
  fenceHeightMM: number;
  gateOpensAwayFromPool: boolean;
  gateIsSelfClosing: boolean;
  gateIsSelfLatching: boolean;
  latchHeightMM: number;
  hasClimbableObjects: boolean;
  bottomGapMM: number;
}): {
  compliant: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (params.fenceHeightMM < 1200) {
    issues.push(`Fence height ${params.fenceHeightMM}mm is below minimum 1200mm`);
  }
  
  if (!params.gateOpensAwayFromPool) {
    issues.push("Gate must open away from the pool area");
  }
  
  if (!params.gateIsSelfClosing) {
    issues.push("Gate must be self-closing");
  }
  
  if (!params.gateIsSelfLatching) {
    issues.push("Gate must be self-latching");
  }
  
  if (params.latchHeightMM < 1500) {
    issues.push(`Latch height ${params.latchHeightMM}mm should be minimum 1500mm (or 1400mm with shielded release)`);
  }
  
  if (params.hasClimbableObjects) {
    issues.push("Remove climbable objects within 900mm of fence (plants, furniture, etc.)");
  }
  
  if (params.bottomGapMM > 100) {
    issues.push(`Bottom gap ${params.bottomGapMM}mm exceeds maximum 100mm`);
  }
  
  return {
    compliant: issues.length === 0,
    issues,
  };
}

/**
 * Check retaining wall approval requirements
 */
export function checkRetainingWallApproval(params: {
  heightMM: number;
  hasSurchargeLoad: boolean; // e.g., driveway, building above
  nearBoundary: boolean;
  inFloodZone: boolean;
}): {
  approvalRequired: boolean;
  engineeringRequired: boolean;
  notes: string[];
} {
  const notes: string[] = [];
  let approvalRequired = false;
  let engineeringRequired = false;
  
  if (params.heightMM > 1000) {
    approvalRequired = true;
    engineeringRequired = true;
    notes.push("Wall over 1000mm typically requires council approval and engineering");
  } else if (params.heightMM > 600) {
    approvalRequired = true;
    notes.push("Wall over 600mm may require council approval - check local requirements");
  }
  
  if (params.hasSurchargeLoad) {
    engineeringRequired = true;
    notes.push("Engineering required due to surcharge load (driveway/building above)");
  }
  
  if (params.nearBoundary) {
    approvalRequired = true;
    notes.push("Boundary setback requirements - check council regulations");
  }
  
  if (params.inFloodZone) {
    approvalRequired = true;
    engineeringRequired = true;
    notes.push("Engineering required for walls in flood-prone areas");
  }
  
  if (!approvalRequired) {
    notes.push("Wall may be exempt development - verify with local council");
  }
  
  return {
    approvalRequired,
    engineeringRequired,
    notes,
  };
}

/**
 * Estimate irrigation system
 */
export function estimateIrrigationSystem(params: {
  lawnAreaM2: number;
  gardenBedAreaM2: number;
  numberOfZones?: number;
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  // Calculate zones if not provided
  const estimatedZones = params.numberOfZones || 
    Math.ceil((params.lawnAreaM2 / 150) + (params.gardenBedAreaM2 / 50));
  
  // Controller
  if (estimatedZones <= 6) {
    materials.push({ item: "Irrigation Controller 6 Zone", quantity: 1, unit: "each" });
  } else {
    materials.push({ item: "Irrigation Controller 12 Zone", quantity: 1, unit: "each" });
  }
  
  // Solenoid valves
  materials.push({ item: "Solenoid Valve 25mm", quantity: estimatedZones, unit: "each" });
  materials.push({ item: "Irrigation Valve Box", quantity: Math.ceil(estimatedZones / 3), unit: "each" });
  
  // Sprinklers for lawn (1 per ~20m²)
  const sprinklerCount = Math.ceil(params.lawnAreaM2 / 20);
  materials.push({ item: "Pop-up Sprinkler MP Rotator", quantity: sprinklerCount, unit: "each" });
  
  // Dripper line for garden beds
  const dripperLength = Math.ceil(params.gardenBedAreaM2 * 2); // ~2m per m² coverage
  materials.push({ item: "Drip Line 13mm", quantity: dripperLength, unit: "lin m" });
  
  // Main line pipe (estimate)
  const mainLineLength = Math.ceil(Math.sqrt(params.lawnAreaM2 + params.gardenBedAreaM2) * 3);
  materials.push({ item: "Poly Pipe 25mm", quantity: mainLineLength, unit: "lin m" });
  
  return materials;
}
