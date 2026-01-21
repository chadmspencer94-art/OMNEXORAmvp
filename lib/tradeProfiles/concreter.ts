/**
 * Concrete Worker (Concreter) Trade Profile Configuration for OMNEXORA
 * 
 * This module provides concrete worker-specific configuration including:
 * - Default rates and pricing for concrete work
 * - Common materials with Australian pricing (Boral, Holcim, Cement Australia)
 * - Compliance and safety information (AS 3600, AS 2870)
 * - Document templates and AI prompt enhancements
 * 
 * Compliance References:
 * - AS 3600 - Concrete structures
 * - AS 2870 - Residential slabs and footings
 * - AS 3727 - Guide to residential pavements
 * - Building Code of Australia (BCA/NCC)
 * - State-based SafeWork regulations
 */

// ============================================================================
// CONCRETER DEFAULT RATES (Australian market rates 2024-2026)
// ============================================================================

export const CONCRETER_DEFAULT_RATES = {
  // Hourly rates
  hourlyRate: 85, // Concreter hourly rate
  helperHourlyRate: 45, // Labourer rate
  dayRate: 650, // Full day rate
  
  // Per-square-metre rates (supply + lay)
  ratePerM2SlabOnGround: 85, // Standard slab on ground
  ratePerM2Driveway: 95, // Exposed aggregate or coloured
  ratePerM2PathFootpath: 75, // Paths and footpaths
  ratePerM2Patio: 90, // Outdoor patio areas
  ratePerM2GarageFloor: 80, // Garage floor slab
  ratePerM2Pool: 120, // Pool surrounds (non-slip)
  
  // Labour-only rates (client supplies concrete)
  ratePerM2LabourOnly: 45, // Pour and finish only
  ratePerM2LabourOnlyColoured: 55, // With colour/pattern
  
  // Per-lineal-metre rates
  ratePerLmEdging: 35, // Concrete edging
  ratePerLmKerb: 55, // Kerbing/mountable kerb
  ratePerLmFooting: 85, // Strip footings
  
  // Per-cubic-metre rates
  ratePerM3Footings: 450, // Footings (form + pour)
  ratePerM3Retaining: 550, // Retaining walls
  
  // Specialty finishes (add-on per m²)
  addOnExposedAggregate: 25, // Exposed aggregate finish
  addOnColouredConcrete: 18, // Integral colour
  addOnStampedPattern: 35, // Stamped/pattern finish
  addOnPolished: 65, // Polished concrete
  addOnStenciled: 28, // Stenciled finish
  
  // Preparation and extras
  ratePerM2Excavation: 25, // Excavation per m²
  ratePerM2Compaction: 12, // Base compaction
  ratePerM2Reinforcement: 18, // Mesh laying
  ratePerM2Formwork: 35, // Formwork per m²
  
  // Pump and equipment
  concretePumpHourly: 220, // Concrete pump hourly
  concretePumpMinimum: 450, // Minimum pump charge
  bobcatHourly: 120, // Bobcat/skid steer hourly
  
  // Minimum charges
  minCharge: 800, // Minimum job charge
  calloutFee: 150, // Site inspection/quote
  
  // Material markup
  materialMarkupPercent: 20, // Standard markup on materials
};

// ============================================================================
// COMMON CONCRETE MATERIALS (Australian pricing)
// ============================================================================

export interface ConcreteMaterial {
  name: string;
  category: string;
  supplier: string;
  unitLabel: string;
  unitCost: number;
  notes: string;
  mpaRating?: number; // Compressive strength
}

export const CONCRETER_DEFAULT_MATERIALS: ConcreteMaterial[] = [
  // Ready-Mix Concrete (per m³ delivered)
  {
    name: "N20 Standard Mix (20MPa)",
    category: "Ready-Mix Concrete",
    supplier: "Boral/Holcim",
    unitLabel: "m³",
    unitCost: 245.00,
    notes: "Standard residential, paths, footings",
    mpaRating: 20,
  },
  {
    name: "N25 General Purpose (25MPa)",
    category: "Ready-Mix Concrete",
    supplier: "Boral/Holcim",
    unitLabel: "m³",
    unitCost: 265.00,
    notes: "Driveways, slabs, general structural",
    mpaRating: 25,
  },
  {
    name: "N32 Structural Mix (32MPa)",
    category: "Ready-Mix Concrete",
    supplier: "Boral/Holcim",
    unitLabel: "m³",
    unitCost: 295.00,
    notes: "Structural applications, commercial",
    mpaRating: 32,
  },
  {
    name: "N40 High Strength (40MPa)",
    category: "Ready-Mix Concrete",
    supplier: "Boral/Holcim",
    unitLabel: "m³",
    unitCost: 340.00,
    notes: "High strength structural",
    mpaRating: 40,
  },
  {
    name: "Exposed Aggregate Mix",
    category: "Ready-Mix Concrete",
    supplier: "Boral/Holcim",
    unitLabel: "m³",
    unitCost: 320.00,
    notes: "Decorative exposed finish",
    mpaRating: 25,
  },
  {
    name: "Coloured Concrete (Oxide)",
    category: "Ready-Mix Concrete",
    supplier: "Boral/Holcim",
    unitLabel: "m³",
    unitCost: 295.00,
    notes: "Integral colour (specify colour)",
    mpaRating: 25,
  },
  
  // Bagged Concrete/Cement
  {
    name: "Rapid Set Concrete 20kg",
    category: "Bagged Products",
    supplier: "Cement Australia/Bunnings",
    unitLabel: "Bag",
    unitCost: 12.00,
    notes: "Quick setting (approx 0.009m³)",
  },
  {
    name: "Concrete Mix 20kg",
    category: "Bagged Products",
    supplier: "Cement Australia/Bunnings",
    unitLabel: "Bag",
    unitCost: 9.50,
    notes: "General purpose (approx 0.009m³)",
  },
  {
    name: "Portland Cement 20kg",
    category: "Bagged Products",
    supplier: "Cement Australia",
    unitLabel: "Bag",
    unitCost: 12.50,
    notes: "General purpose cement",
  },
  {
    name: "Mortar Mix 20kg",
    category: "Bagged Products",
    supplier: "Cement Australia",
    unitLabel: "Bag",
    unitCost: 11.00,
    notes: "For mortar/render",
  },
  
  // Reinforcement
  {
    name: "SL72 Mesh (6m x 2.4m)",
    category: "Reinforcement",
    supplier: "Steel suppliers",
    unitLabel: "Sheet",
    unitCost: 85.00,
    notes: "Light mesh - paths, slabs",
  },
  {
    name: "SL82 Mesh (6m x 2.4m)",
    category: "Reinforcement",
    supplier: "Steel suppliers",
    unitLabel: "Sheet",
    unitCost: 110.00,
    notes: "Standard mesh - driveways, floors",
  },
  {
    name: "SL92 Mesh (6m x 2.4m)",
    category: "Reinforcement",
    supplier: "Steel suppliers",
    unitLabel: "Sheet",
    unitCost: 145.00,
    notes: "Heavy mesh - structural slabs",
  },
  {
    name: "SL102 Mesh (6m x 2.4m)",
    category: "Reinforcement",
    supplier: "Steel suppliers",
    unitLabel: "Sheet",
    unitCost: 180.00,
    notes: "Extra heavy - commercial",
  },
  {
    name: "N12 Rebar (6m lengths)",
    category: "Reinforcement",
    supplier: "Steel suppliers",
    unitLabel: "Length",
    unitCost: 18.00,
    notes: "12mm reinforcing bar",
  },
  {
    name: "N16 Rebar (6m lengths)",
    category: "Reinforcement",
    supplier: "Steel suppliers",
    unitLabel: "Length",
    unitCost: 28.00,
    notes: "16mm reinforcing bar",
  },
  {
    name: "Tie Wire (2kg Roll)",
    category: "Reinforcement",
    supplier: "Steel suppliers",
    unitLabel: "Roll",
    unitCost: 18.00,
    notes: "For tying mesh/rebar",
  },
  {
    name: "Bar Chairs 50mm (100 pack)",
    category: "Reinforcement",
    supplier: "Concrete supplies",
    unitLabel: "Pack",
    unitCost: 45.00,
    notes: "Standard bar/mesh chairs",
  },
  {
    name: "Bar Chairs 75mm (100 pack)",
    category: "Reinforcement",
    supplier: "Concrete supplies",
    unitLabel: "Pack",
    unitCost: 55.00,
    notes: "Higher cover chairs",
  },
  
  // Formwork
  {
    name: "Formply 17mm (2400x1200)",
    category: "Formwork",
    supplier: "Timber suppliers",
    unitLabel: "Sheet",
    unitCost: 85.00,
    notes: "Reusable formwork ply",
  },
  {
    name: "Pine Timber 90x45 (4.8m)",
    category: "Formwork",
    supplier: "Timber suppliers",
    unitLabel: "Length",
    unitCost: 18.00,
    notes: "Formwork framing",
  },
  {
    name: "Steel Form Pegs (20 pack)",
    category: "Formwork",
    supplier: "Concrete supplies",
    unitLabel: "Pack",
    unitCost: 45.00,
    notes: "Steel stakes 450mm",
  },
  {
    name: "Form Oil 20L",
    category: "Formwork",
    supplier: "Concrete supplies",
    unitLabel: "Drum",
    unitCost: 65.00,
    notes: "Mould release agent",
  },
  
  // Base Materials
  {
    name: "Road Base 20mm (per tonne)",
    category: "Base Materials",
    supplier: "Quarry/Landscape",
    unitLabel: "Tonne",
    unitCost: 55.00,
    notes: "Compactable base material",
  },
  {
    name: "Crusher Dust (per tonne)",
    category: "Base Materials",
    supplier: "Quarry/Landscape",
    unitLabel: "Tonne",
    unitCost: 45.00,
    notes: "Fine compactable base",
  },
  {
    name: "Sand - Bedding (per tonne)",
    category: "Base Materials",
    supplier: "Quarry/Landscape",
    unitLabel: "Tonne",
    unitCost: 65.00,
    notes: "Washed bedding sand",
  },
  {
    name: "Blue Metal 20mm (per tonne)",
    category: "Base Materials",
    supplier: "Quarry/Landscape",
    unitLabel: "Tonne",
    unitCost: 75.00,
    notes: "Drainage/sub-base aggregate",
  },
  
  // Membrane and Vapour Barrier
  {
    name: "Plastic Membrane 200um (50m roll)",
    category: "Membrane",
    supplier: "Building supplies",
    unitLabel: "Roll",
    unitCost: 85.00,
    notes: "Under-slab vapour barrier",
  },
  {
    name: "Polyethylene Sheet Heavy Duty",
    category: "Membrane",
    supplier: "Building supplies",
    unitLabel: "Roll (50m²)",
    unitCost: 120.00,
    notes: "Heavy duty membrane",
  },
  
  // Joints and Sealing
  {
    name: "Expansion Joint Foam 10mm (25m)",
    category: "Joints",
    supplier: "Concrete supplies",
    unitLabel: "Roll",
    unitCost: 35.00,
    notes: "Expansion joint filler",
  },
  {
    name: "Expansion Joint Foam 20mm (25m)",
    category: "Joints",
    supplier: "Concrete supplies",
    unitLabel: "Roll",
    unitCost: 55.00,
    notes: "Larger expansion joint",
  },
  {
    name: "Joint Sealant Polyurethane (600ml)",
    category: "Joints",
    supplier: "Sika/Bostik",
    unitLabel: "Cartridge",
    unitCost: 22.00,
    notes: "Flexible joint sealant",
  },
  {
    name: "Crack Inducer Strip (50m)",
    category: "Joints",
    supplier: "Concrete supplies",
    unitLabel: "Roll",
    unitCost: 85.00,
    notes: "Control joint inducer",
  },
  
  // Curing and Finishing
  {
    name: "Curing Compound 20L",
    category: "Curing",
    supplier: "Sika/Boral",
    unitLabel: "Drum",
    unitCost: 145.00,
    notes: "Spray-on curing membrane",
  },
  {
    name: "Concrete Sealer 20L",
    category: "Sealing",
    supplier: "Sika/Boral",
    unitLabel: "Drum",
    unitCost: 280.00,
    notes: "Clear penetrating sealer",
  },
  {
    name: "Concrete Sealer Gloss 20L",
    category: "Sealing",
    supplier: "Various",
    unitLabel: "Drum",
    unitCost: 320.00,
    notes: "High-gloss finish sealer",
  },
  
  // Colour and Decorative
  {
    name: "Oxide Powder (25kg)",
    category: "Colour",
    supplier: "Concrete supplies",
    unitLabel: "Bag",
    unitCost: 85.00,
    notes: "Integral colour oxide",
  },
  {
    name: "Colour Hardener (25kg)",
    category: "Colour",
    supplier: "Concrete supplies",
    unitLabel: "Bag",
    unitCost: 120.00,
    notes: "Shake-on colour hardener",
  },
  {
    name: "Release Agent Powder (10kg)",
    category: "Stamping",
    supplier: "Concrete supplies",
    unitLabel: "Bucket",
    unitCost: 95.00,
    notes: "For stamped concrete",
  },
  {
    name: "Concrete Stain (20L)",
    category: "Colour",
    supplier: "Various",
    unitLabel: "Drum",
    unitCost: 185.00,
    notes: "Surface stain/tint",
  },
  
  // Admixtures
  {
    name: "Plasticiser/Water Reducer (20L)",
    category: "Admixtures",
    supplier: "Sika/BASF",
    unitLabel: "Drum",
    unitCost: 165.00,
    notes: "Improves workability",
  },
  {
    name: "Accelerator (20L)",
    category: "Admixtures",
    supplier: "Sika/BASF",
    unitLabel: "Drum",
    unitCost: 145.00,
    notes: "Fast setting additive",
  },
  {
    name: "Retarder (20L)",
    category: "Admixtures",
    supplier: "Sika/BASF",
    unitLabel: "Drum",
    unitCost: 155.00,
    notes: "Slows setting time",
  },
  {
    name: "Fibre Reinforcement (20kg)",
    category: "Admixtures",
    supplier: "Various",
    unitLabel: "Bag",
    unitCost: 65.00,
    notes: "Polypropylene fibres",
  },
  
  // Tools and Consumables
  {
    name: "Concrete Vibrator (petrol) - Hire",
    category: "Equipment Hire",
    supplier: "Hire companies",
    unitLabel: "Day",
    unitCost: 85.00,
    notes: "Poker vibrator daily hire",
  },
  {
    name: "Power Trowel - Hire",
    category: "Equipment Hire",
    supplier: "Hire companies",
    unitLabel: "Day",
    unitCost: 180.00,
    notes: "Walk-behind trowel daily",
  },
  {
    name: "Screed Rail (3m)",
    category: "Tools",
    supplier: "Concrete supplies",
    unitLabel: "Length",
    unitCost: 45.00,
    notes: "Aluminium screed rail",
  },
  {
    name: "Bull Float Aluminium (1200mm)",
    category: "Tools",
    supplier: "Concrete supplies",
    unitLabel: "Each",
    unitCost: 165.00,
    notes: "Floating/finishing",
  },
  {
    name: "Edging Tool",
    category: "Tools",
    supplier: "Concrete supplies",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Edge finishing tool",
  },
  {
    name: "Groover Tool",
    category: "Tools",
    supplier: "Concrete supplies",
    unitLabel: "Each",
    unitCost: 28.00,
    notes: "Control joint groover",
  },
];

// ============================================================================
// AUSTRALIAN COMPLIANCE INFORMATION
// ============================================================================

export const CONCRETER_COMPLIANCE = {
  // Building Code of Australia
  bca: {
    standard: "Building Code of Australia (BCA/NCC)",
    relevantSections: [
      "Part 3.1.1 - Foundations",
      "Part 3.2 - Footings and slabs",
      "Part 3.4.1 - Subfloor ventilation",
      "Specification P2.1 - Structural provisions",
    ],
    notes: "All concrete work must comply with BCA requirements for structural adequacy, durability, and site conditions.",
  },

  // Australian Standards
  standards: [
    {
      code: "AS 3600",
      title: "Concrete structures",
      description: "Primary standard for structural concrete design and construction",
      mandatory: true,
    },
    {
      code: "AS 2870",
      title: "Residential slabs and footings",
      description: "Design and construction of residential slabs and footings",
      mandatory: true,
    },
    {
      code: "AS 3727.1",
      title: "Guide to residential pavements - Design",
      description: "Design of driveways, paths, patios",
      mandatory: false,
    },
    {
      code: "AS 1379",
      title: "Specification and supply of concrete",
      description: "Ready-mixed concrete specification",
      mandatory: true,
    },
    {
      code: "AS 3850",
      title: "Prefabricated concrete elements",
      description: "For precast concrete products",
      mandatory: false,
    },
    {
      code: "AS 4678",
      title: "Earth-retaining structures",
      description: "For concrete retaining walls",
      mandatory: true,
    },
  ],

  // Site Classification
  siteClassification: {
    requirement: "Geotechnical site classification required for slabs and footings",
    classes: [
      {
        class: "A",
        description: "Stable, non-reactive (sand, rock)",
        movement: "Little or no ground movement",
      },
      {
        class: "S",
        description: "Slightly reactive clay",
        movement: "Slight ground movement from moisture changes",
      },
      {
        class: "M",
        description: "Moderately reactive clay",
        movement: "Moderate ground movement",
      },
      {
        class: "H1",
        description: "Highly reactive clay",
        movement: "High ground movement",
      },
      {
        class: "H2",
        description: "Very highly reactive clay",
        movement: "Very high ground movement",
      },
      {
        class: "E",
        description: "Extremely reactive clay",
        movement: "Extreme ground movement",
      },
      {
        class: "P",
        description: "Problem sites (fill, mine subsidence, landslip, soft soils)",
        movement: "Requires specific engineering design",
      },
    ],
    engineerRequired: "Class H1, H2, E, and P sites require engineer-designed footings",
  },

  // Concrete Specifications
  concreteSpecifications: {
    minimumStrength: {
      paths: "N20 (20MPa) minimum",
      driveways: "N25 (25MPa) minimum",
      slabs: "N25 (25MPa) minimum, or as specified by engineer",
      structural: "N32 (32MPa) or as specified",
    },
    slump: {
      standard: "80-100mm typical",
      pumped: "100-120mm for pumping",
      notes: "Higher slump may require plasticiser",
    },
    cover: {
      internal: "20mm minimum cover to reinforcement",
      external: "30mm minimum (in-ground 40mm)",
      marine: "50mm minimum in marine/aggressive environments",
    },
  },

  // Reinforcement Requirements
  reinforcement: {
    meshTypes: {
      SL72: "Paths, light slabs (72mm² cross-section per m)",
      SL82: "Standard driveways, slabs (82mm² per m)",
      SL92: "Heavy-duty, structural (92mm² per m)",
      SL102: "Commercial, heavy traffic (102mm² per m)",
    },
    placement: "Mesh must be supported on chairs to maintain correct cover",
    lapping: "Minimum 2 squares (200mm) overlap",
    notes: "Reinforcement type as per engineer's specification or AS 2870",
  },

  // Curing Requirements
  curing: {
    requirement: "Concrete must be properly cured for minimum 7 days",
    methods: [
      "Water curing - keep wet with hoses/sprinklers",
      "Curing compound - spray-on membrane",
      "Plastic sheeting - cover to retain moisture",
    ],
    hotWeather: "Additional precautions required above 30°C",
    coldWeather: "Protect from frost for minimum 24 hours",
    notes: "Improper curing leads to cracking, dusting, and reduced strength",
  },

  // Control Joints
  controlJoints: {
    requirement: "Control joints required to manage cracking",
    spacing: {
      paths: "Maximum 3m centres",
      driveways: "Maximum 3-4m centres",
      slabs: "Maximum 4-5m centres or as specified",
    },
    depth: "Minimum 1/4 of slab thickness",
    timing: "Cut within 4-12 hours of finishing (saw-cut) or formed during pour",
  },

  // SafeWork Requirements
  safeWork: {
    requirements: [
      "Manual handling - concrete is heavy (2.4 tonnes/m³)",
      "Silica dust exposure - cutting/grinding concrete",
      "Chemical exposure - cement burns, admixtures",
      "Concrete delivery truck safety",
      "Excavation safety (trenches for footings)",
      "Plant and equipment (bobcat, pump)",
      "Working in hot conditions",
    ],
    ppe: [
      "Safety boots (gumboots for wet concrete)",
      "Safety glasses",
      "Long sleeves/pants (cement burn protection)",
      "Waterproof gloves",
      "Knee pads",
      "P2 respirator (cutting/grinding)",
      "Hearing protection (vibrators, saws)",
      "Sun protection",
    ],
    cementBurns: {
      risk: "Wet cement is caustic (pH 12-14) and causes chemical burns",
      prevention: "Avoid skin contact, wash immediately if contact occurs",
      treatment: "Flush with water for 20+ minutes, seek medical attention",
    },
  },

  // Warranty/Defects
  warranty: {
    workmanship: "Typically 7 years structural, 2 years finishing",
    defects: {
      cracking: "Hairline cracks normal, structural cracks may be defective",
      scaling: "Surface scaling from improper finishing/curing",
      spalling: "Concrete breaking off - often from steel corrosion",
      settlement: "From poor compaction or ground movement",
    },
    exclusions: [
      "Normal shrinkage cracking",
      "Damage from third parties",
      "Ground movement beyond design parameters",
      "Improper maintenance by owner",
    ],
  },
};

// ============================================================================
// AI PROMPT ENHANCEMENTS FOR CONCRETE
// ============================================================================

export const CONCRETER_AI_CONTEXT = {
  // Trade-specific context for AI document generation
  tradeDescription: "licensed concrete contractor specialising in residential and commercial concrete work including slabs, driveways, footings, and decorative concrete",
  
  // Common scope items for concrete work
  commonScopeItems: [
    "Excavate to required depth",
    "Compact and level sub-base",
    "Supply and install formwork",
    "Supply and lay mesh reinforcement",
    "Supply and place ready-mix concrete",
    "Finish to specified level and texture",
    "Cut control joints",
    "Apply curing compound",
    "Strip formwork",
    "Supply and pour exposed aggregate concrete",
    "Supply and pour coloured concrete",
    "Stamp/pattern concrete surface",
    "Polish concrete floor",
    "Pour strip footings",
    "Pour pad footings",
    "Construct concrete retaining wall",
    "Install concrete edging/kerb",
    "Remove and replace existing concrete",
  ],
  
  // Standard inclusions for concrete quotes
  standardInclusions: [
    "Site set-out and preparation",
    "Excavation to specified depth",
    "Supply and compact road base",
    "Supply and install formwork",
    "Supply and place reinforcement mesh/bars",
    "Supply and pour specified concrete mix",
    "Finish to specified texture",
    "Control joints as required",
    "Curing (compound or water)",
    "Strip formwork and cleanup",
    "Concrete delivery and pump (if required)",
  ],
  
  // Standard exclusions for concrete quotes
  standardExclusions: [
    "Engineering design and certification",
    "Council/building permits",
    "Site survey/set-out by surveyor",
    "Removal of existing concrete (unless specified)",
    "Rock/hard dig excavation (priced if encountered)",
    "Retaining walls (unless specified)",
    "Services relocation (water, gas, electrical)",
    "Stormwater drainage",
    "Landscaping and turf reinstatement",
    "After-hours or weekend pours (unless specified)",
    "Special decorative finishes (unless specified)",
  ],
  
  // Concrete finishes
  finishes: {
    standard: "Steel trowel - smooth finish suitable for garages, industrial",
    broom: "Broom finish - non-slip texture for external areas",
    exposed: "Exposed aggregate - decorative, textured finish",
    coloured: "Integral oxide colour - colour throughout concrete",
    stamped: "Stamped/imprinted - pattern pressed into surface",
    stenciled: "Stenciled - pattern with colour hardener",
    polished: "Polished - ground and sealed for gloss finish",
    honed: "Honed - ground to expose aggregate, matte finish",
  },
  
  // Safety considerations for SWMS
  safetyHazards: [
    "Manual handling - heavy materials and equipment",
    "Cement burns - caustic wet concrete",
    "Silica dust - cutting, grinding, sweeping",
    "Noise - vibrators, concrete trucks, saws",
    "Concrete truck - reversing, chute hazards",
    "Excavation - collapse, services",
    "Slips/trips - wet surfaces, formwork",
    "Heat stress - working in hot conditions",
    "Equipment - vibrators, power trowels, pumps",
  ],
  
  // Safety controls required
  safetyControls: [
    "PPE - waterproof boots, gloves, long sleeves",
    "Cement burn awareness and first aid",
    "Silica dust controls (wet cutting, extraction)",
    "Traffic management for concrete trucks",
    "Excavation shoring/battering",
    "Dial Before You Dig for services",
    "Adequate hydration and rest breaks",
    "Equipment inspections before use",
  ],
  
  // Maintenance guidance
  maintenanceGuidance: {
    sealing: {
      frequency: "Reseal every 2-5 years depending on exposure",
      products: "Use compatible sealer (water-based or solvent)",
      cleaning: "Clean before resealing, allow to dry",
    },
    cleaning: {
      regular: "Hose down periodically, sweep debris",
      stains: "Pressure wash for stubborn stains",
      oil: "Use degreaser for oil stains",
    },
    cracks: {
      hairline: "Normal shrinkage - fill with crack filler if desired",
      structural: "Consult professional for cracks >3mm or moving",
      settlement: "May indicate ground movement - get assessment",
    },
    general: {
      avoid: "Avoid deicing salts, harsh chemicals",
      protection: "Use mats under heavy point loads",
      repairs: "Patch small damage promptly to prevent spreading",
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default rate template for concreters
 */
export function getConcreterDefaultRateTemplate() {
  return {
    name: "Concreter - Standard Rates",
    tradeType: "Concreter",
    propertyType: null,
    hourlyRate: CONCRETER_DEFAULT_RATES.hourlyRate,
    helperHourlyRate: CONCRETER_DEFAULT_RATES.helperHourlyRate,
    dayRate: CONCRETER_DEFAULT_RATES.dayRate,
    calloutFee: CONCRETER_DEFAULT_RATES.calloutFee,
    minCharge: CONCRETER_DEFAULT_RATES.minCharge,
    ratePerM2Interior: CONCRETER_DEFAULT_RATES.ratePerM2GarageFloor,
    ratePerM2Exterior: CONCRETER_DEFAULT_RATES.ratePerM2Driveway,
    ratePerLmTrim: CONCRETER_DEFAULT_RATES.ratePerLmEdging,
    materialMarkupPercent: CONCRETER_DEFAULT_RATES.materialMarkupPercent,
    isDefault: true,
  };
}

/**
 * Get concreter-specific AI system prompt enhancement
 */
export function getConcreterSystemPromptContext(): string {
  return `
Trade-Specific Context (Concreter/Concrete Worker):
- This is concrete work in Australia
- Must comply with AS 3600 (Concrete Structures) and AS 2870 (Residential Slabs)
- Common work: driveways, slabs, footings, paths, patios, pool surrounds
- Concrete grades: N20 (paths), N25 (driveways/slabs), N32+ (structural)
- Site classification (A, S, M, H1, H2, E, P) affects footing design
- Engineer required for H1, H2, E, P class sites
- Reinforcement: SL72 (light), SL82 (standard), SL92 (heavy), or as engineered
- Control joints required max 3-4m centres to manage cracking
- Proper curing essential - minimum 7 days
- Common finishes: broom, exposed aggregate, coloured, stamped, polished
- SAFETY: Cement burns are a serious risk - PPE essential
- Silica dust controls required when cutting/grinding
- Concrete pumping may be required for access
- Material suppliers: Boral, Holcim, Cement Australia
`;
}

/**
 * Calculate concrete volume for common jobs
 */
export function calculateConcreteVolume(params: {
  length: number; // metres
  width: number; // metres
  thickness: number; // millimetres
  wastagePercent?: number;
}): {
  grossVolume: number;
  netVolume: number;
  wastageM3: number;
  bags20kg?: number;
} {
  const wastage = params.wastagePercent || 10; // Default 10% wastage
  const thicknessM = params.thickness / 1000;
  
  const netVolume = params.length * params.width * thicknessM;
  const wastageM3 = netVolume * (wastage / 100);
  const grossVolume = netVolume + wastageM3;
  
  // 20kg bag makes approximately 0.009m³
  const bags20kg = Math.ceil(grossVolume / 0.009);
  
  return {
    netVolume: Math.round(netVolume * 100) / 100,
    grossVolume: Math.round(grossVolume * 100) / 100,
    wastageM3: Math.round(wastageM3 * 100) / 100,
    bags20kg: grossVolume < 1 ? bags20kg : undefined, // Only show bags for small jobs
  };
}

/**
 * Estimate concrete materials for a job
 */
export function estimateConcreteMaterials(params: {
  areaM2: number;
  thicknessMM: number;
  reinforcementType?: "SL72" | "SL82" | "SL92" | "none";
  finish?: "standard" | "broom" | "exposed" | "coloured" | "stamped";
  baseRequired?: boolean;
  baseDepthMM?: number;
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  // Calculate concrete volume
  const concreteM3 = (params.areaM2 * (params.thicknessMM / 1000)) * 1.1; // 10% wastage
  materials.push({ 
    item: params.finish === "exposed" ? "Exposed Aggregate Mix" : 
          params.finish === "coloured" ? "Coloured Concrete (Oxide)" : "N25 General Purpose (25MPa)", 
    quantity: Math.ceil(concreteM3 * 10) / 10, 
    unit: "m³" 
  });
  
  // Reinforcement mesh
  if (params.reinforcementType && params.reinforcementType !== "none") {
    const meshArea = 6 * 2.4; // Sheet size
    const meshSheets = Math.ceil((params.areaM2 * 1.15) / meshArea); // 15% for laps
    materials.push({ item: `${params.reinforcementType} Mesh (6m x 2.4m)`, quantity: meshSheets, unit: "sheets" });
    
    // Bar chairs
    const chairPacks = Math.ceil(params.areaM2 / 25); // 4 chairs per m² approx
    materials.push({ item: "Bar Chairs 50mm (100 pack)", quantity: chairPacks, unit: "packs" });
    
    // Tie wire
    materials.push({ item: "Tie Wire (2kg Roll)", quantity: Math.ceil(meshSheets / 4), unit: "rolls" });
  }
  
  // Base material
  if (params.baseRequired !== false) {
    const baseDepth = (params.baseDepthMM || 100) / 1000;
    const baseTonnes = params.areaM2 * baseDepth * 1.8; // Approx 1.8t/m³ compacted
    materials.push({ item: "Road Base 20mm (per tonne)", quantity: Math.ceil(baseTonnes), unit: "tonnes" });
  }
  
  // Membrane
  const membraneRolls = Math.ceil(params.areaM2 / 50);
  materials.push({ item: "Plastic Membrane 200um (50m roll)", quantity: membraneRolls, unit: "rolls" });
  
  // Formwork (estimate perimeter)
  const perimeter = Math.sqrt(params.areaM2) * 4; // Rough estimate
  const formplySheets = Math.ceil(perimeter / 2.4);
  materials.push({ item: "Formply 17mm (2400x1200)", quantity: formplySheets, unit: "sheets" });
  materials.push({ item: "Pine Timber 90x45 (4.8m)", quantity: Math.ceil(perimeter / 4.8) * 2, unit: "lengths" });
  materials.push({ item: "Steel Form Pegs (20 pack)", quantity: Math.ceil(perimeter / 10), unit: "packs" });
  
  // Expansion joint
  materials.push({ item: "Expansion Joint Foam 10mm (25m)", quantity: Math.ceil(perimeter / 25), unit: "rolls" });
  
  // Curing compound
  const curingDrums = Math.ceil(params.areaM2 / 100); // Approx 100m² per 20L
  materials.push({ item: "Curing Compound 20L", quantity: curingDrums, unit: "drums" });
  
  // Special finishes
  if (params.finish === "stamped") {
    materials.push({ item: "Colour Hardener (25kg)", quantity: Math.ceil(params.areaM2 / 10), unit: "bags" });
    materials.push({ item: "Release Agent Powder (10kg)", quantity: Math.ceil(params.areaM2 / 20), unit: "buckets" });
  }
  
  return materials;
}

/**
 * Get site classification requirements
 */
export function getSiteClassificationInfo(siteClass: string): {
  description: string;
  movement: string;
  footingType: string;
  engineerRequired: boolean;
} {
  const classifications: Record<string, {
    description: string;
    movement: string;
    footingType: string;
    engineerRequired: boolean;
  }> = {
    A: {
      description: "Stable, non-reactive (sand, rock)",
      movement: "Little or no ground movement",
      footingType: "Standard strip or pad footings",
      engineerRequired: false,
    },
    S: {
      description: "Slightly reactive clay",
      movement: "Slight ground movement from moisture changes",
      footingType: "Stiffened raft or strip footings",
      engineerRequired: false,
    },
    M: {
      description: "Moderately reactive clay",
      movement: "Moderate ground movement (20-40mm)",
      footingType: "Stiffened raft with edge beams",
      engineerRequired: false,
    },
    H1: {
      description: "Highly reactive clay",
      movement: "High ground movement (40-60mm)",
      footingType: "Deep edge beams, heavily stiffened raft",
      engineerRequired: true,
    },
    H2: {
      description: "Very highly reactive clay",
      movement: "Very high ground movement (60-75mm)",
      footingType: "Engineer designed deep raft/pier system",
      engineerRequired: true,
    },
    E: {
      description: "Extremely reactive clay",
      movement: "Extreme ground movement (>75mm)",
      footingType: "Special engineer design required",
      engineerRequired: true,
    },
    P: {
      description: "Problem sites (fill, soft soils, mine subsidence)",
      movement: "Varies - requires investigation",
      footingType: "Site-specific engineer design",
      engineerRequired: true,
    },
  };
  
  return classifications[siteClass] || classifications["A"];
}

/**
 * Get concrete grade recommendation
 */
export function getConcreteGradeRecommendation(application: string): {
  grade: string;
  mpa: number;
  notes: string;
} {
  const appLower = application.toLowerCase();
  
  if (appLower.includes("structural") || appLower.includes("beam") || appLower.includes("column")) {
    return { grade: "N32", mpa: 32, notes: "Structural applications - verify with engineer" };
  }
  if (appLower.includes("driveway") || appLower.includes("slab") || appLower.includes("garage")) {
    return { grade: "N25", mpa: 25, notes: "Standard for driveways and floor slabs" };
  }
  if (appLower.includes("path") || appLower.includes("footpath") || appLower.includes("patio")) {
    return { grade: "N20", mpa: 20, notes: "Suitable for pedestrian traffic" };
  }
  if (appLower.includes("footing")) {
    return { grade: "N25", mpa: 25, notes: "Footings - verify with engineer if required" };
  }
  if (appLower.includes("post") || appLower.includes("fence")) {
    return { grade: "N20", mpa: 20, notes: "Post footings - N20 minimum" };
  }
  
  return { grade: "N25", mpa: 25, notes: "General purpose - verify for specific application" };
}
