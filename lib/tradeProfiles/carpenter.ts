/**
 * Carpenter Trade Profile Configuration for OMNEXORA
 * 
 * This module provides carpenter-specific configuration including:
 * - Default rates and pricing for carpentry work
 * - Common materials with Australian pricing (timber, hardware, fasteners)
 * - Compliance and safety information (AS 1684, AS 1720)
 * - Document templates and AI prompt enhancements
 * 
 * Compliance References:
 * - AS 1684 - Residential timber-framed construction
 * - AS 1720 - Timber structures
 * - AS 4440 - Installation of nail plated timber roof trusses
 * - Building Code of Australia (BCA/NCC)
 * - State-based SafeWork regulations
 */

// ============================================================================
// CARPENTER DEFAULT RATES (Australian market rates 2024-2026)
// ============================================================================

export const CARPENTER_DEFAULT_RATES = {
  // Hourly rates
  hourlyRate: 75, // Qualified carpenter hourly rate
  helperHourlyRate: 45, // Labourer/apprentice rate
  dayRate: 580, // Full day rate
  
  // Per-square-metre rates
  ratePerM2Framing: 65, // Wall framing per m² of wall
  ratePerM2RoofFraming: 85, // Roof framing per m² of roof area
  ratePerM2Decking: 120, // Timber decking supply + install
  ratePerM2DeckingLabourOnly: 55, // Decking labour only
  ratePerM2Flooring: 75, // Timber flooring installation
  ratePerM2Cladding: 85, // Timber cladding/weatherboards
  ratePerM2Lining: 45, // Timber lining boards
  
  // Per-lineal-metre rates
  ratePerLmSkirting: 18, // Skirting supply + install
  ratePerLmArchitrave: 16, // Door/window architrave
  ratePerLmCornice: 22, // Timber cornice
  ratePerLmHandrail: 85, // Handrail/balustrade per lm
  ratePerLmPergola: 150, // Pergola beams per lm
  ratePerLmFascia: 35, // Fascia boards
  ratePerLmEaves: 65, // Eaves lining
  
  // Per-unit rates
  ratePerDoorHang: 180, // Hanging standard door (labour)
  ratePerDoorInstallComplete: 450, // Full door installation with hardware
  ratePerWindowInstall: 350, // Window installation
  ratePerSkylightInstall: 650, // Skylight installation
  ratePerStairFlight: 2500, // Standard stair flight
  ratePerDeckPost: 85, // Deck post installed
  
  // Cabinetry rates
  ratePerCabinetInstall: 150, // Per cabinet installation
  ratePerBenchTop: 250, // Benchtop per lm
  ratePerShelf: 45, // Floating shelf per lm
  
  // Repair/maintenance rates
  ratePerDoorAdjust: 85, // Door adjustment/repair
  ratePerFloorBoardReplace: 35, // Per board replacement
  ratePerTimberRepair: 95, // General timber repair per hour
  
  // Minimum charges
  minCharge: 350, // Minimum job charge
  calloutFee: 95, // Call-out/inspection fee
  
  // Material markup
  materialMarkupPercent: 25, // Standard markup on materials
};

// ============================================================================
// COMMON CARPENTRY MATERIALS (Australian pricing)
// ============================================================================

export interface CarpentryMaterial {
  name: string;
  category: string;
  supplier: string;
  unitLabel: string;
  unitCost: number;
  notes: string;
  stressGrade?: string; // For structural timber
}

export const CARPENTER_DEFAULT_MATERIALS: CarpentryMaterial[] = [
  // Structural Framing Timber - Pine
  {
    name: "MGP10 Pine 90x45 (5.4m)",
    category: "Framing Timber",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Length",
    unitCost: 18.00,
    notes: "Standard wall framing",
    stressGrade: "MGP10",
  },
  {
    name: "MGP10 Pine 90x35 (5.4m)",
    category: "Framing Timber",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Length",
    unitCost: 14.50,
    notes: "Light framing/noggings",
    stressGrade: "MGP10",
  },
  {
    name: "MGP10 Pine 140x45 (5.4m)",
    category: "Framing Timber",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Length",
    unitCost: 28.00,
    notes: "Heavy wall frames/lintels",
    stressGrade: "MGP10",
  },
  {
    name: "MGP10 Pine 190x45 (5.4m)",
    category: "Framing Timber",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Length",
    unitCost: 38.00,
    notes: "Floor joists/bearers",
    stressGrade: "MGP10",
  },
  {
    name: "MGP10 Pine 240x45 (5.4m)",
    category: "Framing Timber",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Length",
    unitCost: 48.00,
    notes: "Floor joists/rafters",
    stressGrade: "MGP10",
  },
  {
    name: "MGP12 Pine 90x45 (5.4m)",
    category: "Framing Timber",
    supplier: "Timber yards",
    unitLabel: "Length",
    unitCost: 22.00,
    notes: "Higher stress grade framing",
    stressGrade: "MGP12",
  },
  
  // Structural Framing - LVL/Engineered
  {
    name: "LVL Beam 90x45 (per m)",
    category: "Engineered Timber",
    supplier: "Timber yards",
    unitLabel: "Lin m",
    unitCost: 18.00,
    notes: "Laminated Veneer Lumber",
  },
  {
    name: "LVL Beam 150x45 (per m)",
    category: "Engineered Timber",
    supplier: "Timber yards",
    unitLabel: "Lin m",
    unitCost: 32.00,
    notes: "LVL lintels/beams",
  },
  {
    name: "LVL Beam 200x45 (per m)",
    category: "Engineered Timber",
    supplier: "Timber yards",
    unitLabel: "Lin m",
    unitCost: 45.00,
    notes: "Heavy-duty LVL",
  },
  {
    name: "LVL Beam 300x63 (per m)",
    category: "Engineered Timber",
    supplier: "Timber yards",
    unitLabel: "Lin m",
    unitCost: 85.00,
    notes: "Long span beams",
  },
  {
    name: "I-Joist 240 (per m)",
    category: "Engineered Timber",
    supplier: "Timber yards",
    unitLabel: "Lin m",
    unitCost: 22.00,
    notes: "Engineered floor joist",
  },
  
  // Hardwood - Structural/Outdoor
  {
    name: "Hardwood Bearer 100x100 (per m)",
    category: "Hardwood",
    supplier: "Timber yards",
    unitLabel: "Lin m",
    unitCost: 45.00,
    notes: "Deck bearers (merbau, spotted gum)",
  },
  {
    name: "Hardwood Joist 100x50 (per m)",
    category: "Hardwood",
    supplier: "Timber yards",
    unitLabel: "Lin m",
    unitCost: 28.00,
    notes: "Deck joists",
  },
  {
    name: "Hardwood Post 100x100 (per m)",
    category: "Hardwood",
    supplier: "Timber yards",
    unitLabel: "Lin m",
    unitCost: 48.00,
    notes: "Deck/pergola posts",
  },
  {
    name: "Hardwood Post 125x125 (per m)",
    category: "Hardwood",
    supplier: "Timber yards",
    unitLabel: "Lin m",
    unitCost: 75.00,
    notes: "Heavy-duty posts",
  },
  
  // Decking
  {
    name: "Merbau Decking 90x19 (per m)",
    category: "Decking",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Lin m",
    unitCost: 12.00,
    notes: "Standard merbau decking",
  },
  {
    name: "Spotted Gum Decking 86x19 (per m)",
    category: "Decking",
    supplier: "Timber yards",
    unitLabel: "Lin m",
    unitCost: 16.00,
    notes: "Premium Australian hardwood",
  },
  {
    name: "Treated Pine Decking 90x22 (per m)",
    category: "Decking",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Lin m",
    unitCost: 6.50,
    notes: "H3 treated pine decking",
  },
  {
    name: "Composite Decking (per m)",
    category: "Decking",
    supplier: "Bunnings/Suppliers",
    unitLabel: "Lin m",
    unitCost: 22.00,
    notes: "Wood-plastic composite",
  },
  
  // Sheet Materials
  {
    name: "Plywood CD Structural 17mm (2400x1200)",
    category: "Sheet Materials",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Sheet",
    unitCost: 75.00,
    notes: "Structural ply for flooring",
  },
  {
    name: "Plywood CD Structural 19mm (2400x1200)",
    category: "Sheet Materials",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Sheet",
    unitCost: 85.00,
    notes: "Heavy-duty structural ply",
  },
  {
    name: "Particleboard Flooring 19mm (3600x600)",
    category: "Sheet Materials",
    supplier: "Bunnings",
    unitLabel: "Sheet",
    unitCost: 32.00,
    notes: "T&G flooring particleboard",
  },
  {
    name: "MDF 16mm (2400x1200)",
    category: "Sheet Materials",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Sheet",
    unitCost: 45.00,
    notes: "General joinery MDF",
  },
  {
    name: "MDF 18mm (2400x1200)",
    category: "Sheet Materials",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Sheet",
    unitCost: 52.00,
    notes: "Cabinet carcass MDF",
  },
  {
    name: "Exterior Plywood Marine 12mm (2400x1200)",
    category: "Sheet Materials",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Sheet",
    unitCost: 125.00,
    notes: "Marine grade ply",
  },
  
  // Trim and Mouldings
  {
    name: "Skirting Pine 90x18 (per m)",
    category: "Trim",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Lin m",
    unitCost: 5.50,
    notes: "Standard skirting board",
  },
  {
    name: "Skirting MDF 90x18 (per m)",
    category: "Trim",
    supplier: "Bunnings",
    unitLabel: "Lin m",
    unitCost: 4.00,
    notes: "Pre-primed MDF skirting",
  },
  {
    name: "Skirting Pine 140x18 (per m)",
    category: "Trim",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Lin m",
    unitCost: 8.50,
    notes: "Taller skirting profile",
  },
  {
    name: "Architrave Pine 65x18 (per m)",
    category: "Trim",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Lin m",
    unitCost: 4.50,
    notes: "Standard door/window architrave",
  },
  {
    name: "Architrave MDF 65x18 (per m)",
    category: "Trim",
    supplier: "Bunnings",
    unitLabel: "Lin m",
    unitCost: 3.50,
    notes: "Pre-primed MDF architrave",
  },
  {
    name: "Quad Mould 18x18 (per m)",
    category: "Trim",
    supplier: "Bunnings",
    unitLabel: "Lin m",
    unitCost: 2.00,
    notes: "Quarter round moulding",
  },
  {
    name: "Scotia Mould 18x18 (per m)",
    category: "Trim",
    supplier: "Bunnings",
    unitLabel: "Lin m",
    unitCost: 2.20,
    notes: "Concave moulding",
  },
  {
    name: "Door Stop Pine 12x38 (per m)",
    category: "Trim",
    supplier: "Bunnings",
    unitLabel: "Lin m",
    unitCost: 2.50,
    notes: "Door stop moulding",
  },
  
  // Doors
  {
    name: "Interior Hollow Core Door 2040x820",
    category: "Doors",
    supplier: "Bunnings/Door suppliers",
    unitLabel: "Each",
    unitCost: 85.00,
    notes: "Standard interior door",
  },
  {
    name: "Interior Hollow Core Door 2040x720",
    category: "Doors",
    supplier: "Bunnings/Door suppliers",
    unitLabel: "Each",
    unitCost: 80.00,
    notes: "Narrow interior door",
  },
  {
    name: "Interior Solid Core Door 2040x820",
    category: "Doors",
    supplier: "Door suppliers",
    unitLabel: "Each",
    unitCost: 250.00,
    notes: "Solid core (acoustic/fire)",
  },
  {
    name: "Exterior Solid Door 2040x820",
    category: "Doors",
    supplier: "Door suppliers",
    unitLabel: "Each",
    unitCost: 450.00,
    notes: "External entry door",
  },
  {
    name: "Sliding Cavity Door Unit 2040x820",
    category: "Doors",
    supplier: "Door suppliers",
    unitLabel: "Each",
    unitCost: 380.00,
    notes: "Complete cavity slider kit",
  },
  {
    name: "Bi-Fold Door Set 2040x1810",
    category: "Doors",
    supplier: "Door suppliers",
    unitLabel: "Set",
    unitCost: 350.00,
    notes: "2-door bi-fold set",
  },
  
  // Door/Window Hardware
  {
    name: "Door Hinge Butt 100mm (pair)",
    category: "Hardware",
    supplier: "Bunnings",
    unitLabel: "Pair",
    unitCost: 12.00,
    notes: "Standard butt hinges",
  },
  {
    name: "Door Handle Set Passage",
    category: "Hardware",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Non-locking lever set",
  },
  {
    name: "Door Handle Set Privacy",
    category: "Hardware",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Privacy set (bathroom)",
  },
  {
    name: "Door Handle Set Entrance",
    category: "Hardware",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 85.00,
    notes: "Keyed entry set",
  },
  {
    name: "Door Closer Standard",
    category: "Hardware",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 65.00,
    notes: "Self-closing mechanism",
  },
  {
    name: "Door Frame Pine Set 90x30",
    category: "Doors",
    supplier: "Bunnings/Timber yards",
    unitLabel: "Set",
    unitCost: 85.00,
    notes: "Standard door frame kit",
  },
  
  // Fasteners
  {
    name: "Framing Nails 75mm (2kg)",
    category: "Fasteners",
    supplier: "Bunnings",
    unitLabel: "Box",
    unitCost: 28.00,
    notes: "Galvanised framing nails",
  },
  {
    name: "Framing Nails 90mm (2kg)",
    category: "Fasteners",
    supplier: "Bunnings",
    unitLabel: "Box",
    unitCost: 32.00,
    notes: "Longer framing nails",
  },
  {
    name: "Nail Gun Nails 75mm (3000pk)",
    category: "Fasteners",
    supplier: "Bunnings",
    unitLabel: "Box",
    unitCost: 65.00,
    notes: "Coil/strip nails for gun",
  },
  {
    name: "Decking Screws 10g x 65mm (500pk)",
    category: "Fasteners",
    supplier: "Bunnings",
    unitLabel: "Box",
    unitCost: 55.00,
    notes: "Stainless steel deck screws",
  },
  {
    name: "Batten Screws 14g x 100mm (500pk)",
    category: "Fasteners",
    supplier: "Bunnings",
    unitLabel: "Box",
    unitCost: 85.00,
    notes: "Heavy-duty batten screws",
  },
  {
    name: "Wood Screws 8g x 50mm (500pk)",
    category: "Fasteners",
    supplier: "Bunnings",
    unitLabel: "Box",
    unitCost: 25.00,
    notes: "General purpose screws",
  },
  {
    name: "Trim Head Screws 7g x 65mm (1000pk)",
    category: "Fasteners",
    supplier: "Bunnings",
    unitLabel: "Box",
    unitCost: 45.00,
    notes: "For trim/skirting",
  },
  {
    name: "Coach Bolts M10x100 (25pk)",
    category: "Fasteners",
    supplier: "Bunnings",
    unitLabel: "Pack",
    unitCost: 28.00,
    notes: "Heavy structural bolts",
  },
  
  // Structural Connectors
  {
    name: "Joist Hanger 45x190",
    category: "Connectors",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 8.50,
    notes: "Standard joist hanger",
  },
  {
    name: "Joist Hanger 45x240",
    category: "Connectors",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 10.50,
    notes: "Deep joist hanger",
  },
  {
    name: "Framing Bracket 90x90",
    category: "Connectors",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 6.50,
    notes: "Right angle bracket",
  },
  {
    name: "Strap Tie 30x0.8 (per m)",
    category: "Connectors",
    supplier: "Bunnings",
    unitLabel: "Lin m",
    unitCost: 3.00,
    notes: "Metal strap tie",
  },
  {
    name: "Triple Grip 35 (each)",
    category: "Connectors",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 2.80,
    notes: "Truss/rafter connector",
  },
  {
    name: "Post Anchor Bolt-Down",
    category: "Connectors",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 22.00,
    notes: "Post base connector",
  },
  {
    name: "Stirrup Post Base 100x100",
    category: "Connectors",
    supplier: "Bunnings",
    unitLabel: "Each",
    unitCost: 28.00,
    notes: "Elevated post base",
  },
  
  // Adhesives and Sealants
  {
    name: "Construction Adhesive 375ml",
    category: "Adhesives",
    supplier: "Bunnings",
    unitLabel: "Tube",
    unitCost: 12.00,
    notes: "General construction adhesive",
  },
  {
    name: "Liquid Nails 375ml",
    category: "Adhesives",
    supplier: "Bunnings",
    unitLabel: "Tube",
    unitCost: 14.00,
    notes: "Heavy-duty adhesive",
  },
  {
    name: "PVA Wood Glue 1L",
    category: "Adhesives",
    supplier: "Bunnings",
    unitLabel: "Bottle",
    unitCost: 18.00,
    notes: "Interior wood glue",
  },
  {
    name: "Polyurethane Glue 750ml",
    category: "Adhesives",
    supplier: "Bunnings",
    unitLabel: "Bottle",
    unitCost: 32.00,
    notes: "Waterproof wood glue",
  },
  {
    name: "Silicone Sealant Clear 300ml",
    category: "Sealants",
    supplier: "Bunnings",
    unitLabel: "Tube",
    unitCost: 12.00,
    notes: "General purpose silicone",
  },
  {
    name: "Acrylic Gap Filler 450g",
    category: "Sealants",
    supplier: "Bunnings",
    unitLabel: "Tube",
    unitCost: 8.00,
    notes: "Paintable gap filler",
  },
  
  // Finishing Products
  {
    name: "Timber Stain 1L",
    category: "Finishes",
    supplier: "Bunnings",
    unitLabel: "Can",
    unitCost: 35.00,
    notes: "Interior/exterior stain",
  },
  {
    name: "Decking Oil 4L",
    category: "Finishes",
    supplier: "Bunnings",
    unitLabel: "Can",
    unitCost: 85.00,
    notes: "Deck protection oil",
  },
  {
    name: "Timber Preservative 5L",
    category: "Finishes",
    supplier: "Bunnings",
    unitLabel: "Can",
    unitCost: 65.00,
    notes: "Anti-rot treatment",
  },
  {
    name: "Wood Filler 500g",
    category: "Fillers",
    supplier: "Bunnings",
    unitLabel: "Tub",
    unitCost: 18.00,
    notes: "Interior wood filler",
  },
  {
    name: "Exterior Wood Filler 500g",
    category: "Fillers",
    supplier: "Bunnings",
    unitLabel: "Tub",
    unitCost: 22.00,
    notes: "Waterproof filler",
  },
];

// ============================================================================
// AUSTRALIAN COMPLIANCE INFORMATION
// ============================================================================

export const CARPENTER_COMPLIANCE = {
  // Building Code of Australia
  bca: {
    standard: "Building Code of Australia (BCA/NCC)",
    relevantSections: [
      "Part 3.4.2 - Timber framing",
      "Part 3.4.3 - Steel framing",
      "Part 3.7.1 - Fire separation",
      "Part 3.10.1 - Stairway construction",
      "Part 3.10.2 - Balustrades and barriers",
      "Specification P2.1 - Structural provisions",
    ],
    notes: "All structural carpentry must comply with BCA requirements for structural adequacy and safety.",
  },

  // Australian Standards - Timber
  standards: [
    {
      code: "AS 1684.2",
      title: "Residential timber-framed construction - Non-cyclonic areas",
      description: "Primary standard for timber framing in non-cyclonic regions",
      mandatory: true,
    },
    {
      code: "AS 1684.3",
      title: "Residential timber-framed construction - Cyclonic areas",
      description: "Timber framing requirements for cyclonic regions",
      mandatory: true,
    },
    {
      code: "AS 1720.1",
      title: "Timber structures - Design methods",
      description: "Structural design of timber members",
      mandatory: true,
    },
    {
      code: "AS 4440",
      title: "Installation of nail plated timber roof trusses",
      description: "Truss installation requirements",
      mandatory: true,
    },
    {
      code: "AS 1604.1",
      title: "Timber - Preservative-treated - Sawn and round",
      description: "Preservative treatment requirements (H-class)",
      mandatory: true,
    },
    {
      code: "AS 1170.1",
      title: "Structural design actions - Permanent, imposed and other actions",
      description: "Load requirements for structures",
      mandatory: true,
    },
    {
      code: "AS 1657",
      title: "Fixed platforms, walkways, stairways and ladders - Design, construction and installation",
      description: "Stair and access requirements",
      mandatory: true,
    },
  ],

  // Timber Treatment Classes
  timberTreatment: {
    requirement: "Treated timber required for specific applications",
    classes: [
      {
        class: "H1",
        application: "Above ground, inside, completely protected",
        risk: "Lyctus borers only",
      },
      {
        class: "H2",
        application: "Above ground, inside, protected from weather",
        risk: "Borers and termites",
      },
      {
        class: "H2F",
        application: "Above ground framing, protected from weather",
        risk: "Termites in framing",
      },
      {
        class: "H3",
        application: "Above ground, outside, exposed to weather",
        risk: "Moderate decay, borers, termites",
      },
      {
        class: "H4",
        application: "In ground contact, outside",
        risk: "Severe decay, borers, termites",
      },
      {
        class: "H5",
        application: "In ground contact, critical applications",
        risk: "Very severe decay, retaining walls, piles",
      },
      {
        class: "H6",
        application: "Marine water contact",
        risk: "Marine borers",
      },
    ],
    notes: "Use minimum H3 for exposed external timber, H4 minimum for in-ground",
  },

  // Stress Grades
  stressGrades: {
    MGP10: "Machine Graded Pine - 10 stress grade (general framing)",
    MGP12: "Machine Graded Pine - 12 stress grade (higher loads)",
    MGP15: "Machine Graded Pine - 15 stress grade (heavy structural)",
    F5: "Visual stress grade - light framing",
    F7: "Visual stress grade - general framing",
    F8: "Visual stress grade - better quality",
    F14: "Visual stress grade - structural hardwood",
    F17: "Visual stress grade - high structural hardwood",
  },

  // Balustrade Requirements
  balustrades: {
    minHeight: "1000mm minimum height (1000mm at stairs)",
    openings: "Maximum 125mm gap between balusters",
    climbability: "Must not have climbable elements (horizontal rails, etc.)",
    loading: "Must withstand minimum loads per AS 1170.1",
    reference: "AS 1657 and BCA Part 3.10.2",
  },

  // Stair Requirements
  stairs: {
    riserHeight: "Maximum 190mm, minimum 115mm",
    goingDepth: "Maximum 355mm, minimum 240mm",
    consistency: "Risers and goings must be consistent (max 5mm variation)",
    handrails: "Required on at least one side if 4+ risers",
    width: "Minimum 600mm clear width (residential)",
    headroom: "Minimum 2000mm headroom",
    reference: "AS 1657 and BCA Part 3.10.1",
  },

  // Termite Management
  termiteManagement: {
    requirement: "Termite management required in designated areas",
    methods: [
      "Chemical soil treatment (barrier)",
      "Physical barriers (stainless steel mesh, crushed granite)",
      "Reticulation systems",
      "Treated timber framing (H2F minimum)",
    ],
    inspectionZones: "100mm inspection zone required around perimeter",
    reference: "AS 3660.1 - Termite management",
  },

  // SafeWork Requirements
  safeWork: {
    requirements: [
      "Power tool safety and guarding",
      "Manual handling (heavy timber)",
      "Working at heights (scaffolding, ladders)",
      "Noise control (power saws, nail guns)",
      "Dust control (MDF, treated timber)",
      "Fall prevention (roofing, stairs)",
      "Nail gun safety",
    ],
    ppe: [
      "Safety glasses",
      "Hearing protection",
      "Dust mask/respirator (when cutting)",
      "Safety boots (steel cap)",
      "Work gloves",
      "Hard hat (when required)",
    ],
    treatedTimber: {
      hazard: "Treated timber contains preservative chemicals",
      precautions: [
        "Wear gloves when handling",
        "Wear dust mask when cutting",
        "Do not burn offcuts",
        "Wash hands before eating",
      ],
    },
  },

  // Warranty
  warranty: {
    workmanship: "Typically 7 years structural, 2 years finishing",
    defects: {
      movement: "Some timber movement (shrinkage/swelling) is normal",
      cracking: "Minor checking/cracking in exposed timber is normal",
      warping: "Excessive warping may be defective",
    },
  },
};

// ============================================================================
// AI PROMPT ENHANCEMENTS FOR CARPENTRY
// ============================================================================

export const CARPENTER_AI_CONTEXT = {
  // Trade-specific context for AI document generation
  tradeDescription: "qualified carpenter specialising in residential and commercial carpentry including framing, fit-out, decking, and joinery",
  
  // Common scope items for carpentry work
  commonScopeItems: [
    "Wall framing - new walls",
    "Wall framing - alterations/modifications",
    "Roof framing - rafters/trusses",
    "Floor framing - joists/bearers",
    "Install door frames",
    "Hang doors (internal/external)",
    "Install windows",
    "Install architraves",
    "Install skirting boards",
    "Install timber flooring",
    "Build timber deck",
    "Build pergola",
    "Install handrails/balustrades",
    "Build stairs",
    "Install cabinetry",
    "Install shelving",
    "Repair/replace rotted timber",
    "Install cladding/weatherboards",
    "Install fascia and eaves",
    "General timber repairs",
  ],
  
  // Standard inclusions for carpentry quotes
  standardInclusions: [
    "Supply of all timber and materials (as specified)",
    "Qualified carpenter labour",
    "All fixings and fasteners",
    "Installation per manufacturer/engineer specifications",
    "Cleanup of work areas",
    "Disposal of offcuts and packaging",
    "Workmanship warranty",
  ],
  
  // Standard exclusions for carpentry quotes
  standardExclusions: [
    "Engineering design and certification",
    "Council/building permits",
    "Painting or finishing",
    "Electrical or plumbing work",
    "Removal of existing structures (unless specified)",
    "Concrete/masonry work",
    "Pest treatment",
    "Scaffolding hire (if extensive)",
    "Hardware (handles, locks) unless specified",
  ],
  
  // Timber types
  timberTypes: {
    pine: "Radiata pine - most common framing timber, economical",
    meranti: "Meranti - common for joinery, doors, windows",
    merbau: "Merbau - popular decking, reddish-brown hardwood",
    spottedGum: "Spotted Gum - premium Australian hardwood, decking/flooring",
    blackbutt: "Blackbutt - Australian hardwood, flooring/decking",
    jarrah: "Jarrah - WA hardwood, flooring/furniture",
    cypress: "Cypress Pine - naturally termite resistant",
    treated: "Treated Pine - H3/H4 for external use, green tinge",
  },
  
  // Safety considerations for SWMS
  safetyHazards: [
    "Power tool injuries (saws, nail guns, routers)",
    "Manual handling (heavy timber/sheet materials)",
    "Falls from height (scaffolding, ladders, roof work)",
    "Falling objects (timber, tools)",
    "Noise exposure (power tools)",
    "Dust inhalation (MDF, treated timber)",
    "Splinters and cuts",
    "Eye injuries (flying debris, dust)",
    "Chemical exposure (treated timber, adhesives)",
  ],
  
  // Safety controls required
  safetyControls: [
    "Power tool guards and safety switches",
    "Team lifting for heavy items",
    "Scaffolding/ladder safety",
    "Hard hats in multi-level work",
    "Hearing protection",
    "Dust extraction and masks",
    "Safety glasses",
    "First aid kit on site",
  ],
  
  // Maintenance guidance
  maintenanceGuidance: {
    decking: {
      cleaning: "Clean with deck wash 1-2 times per year",
      oiling: "Re-oil every 12-18 months (earlier if fading)",
      inspection: "Check for loose boards, popped fasteners annually",
      gaps: "Maintain 3-4mm gaps between boards for drainage",
    },
    doors: {
      adjustment: "Hinges may need adjustment over time - normal settling",
      sealing: "Seal/paint exposed edges to prevent moisture damage",
      hardware: "Lubricate hinges and locks annually",
    },
    externalTimber: {
      finish: "Maintain paint/stain finish to protect from weather",
      inspection: "Check for rot, especially at ground level and joints",
      treatment: "Re-apply preservative if bare timber exposed",
    },
    flooring: {
      cleaning: "Sweep/vacuum regularly, damp mop only",
      protection: "Use furniture pads, entry mats",
      refinishing: "Sand and re-coat every 7-10 years typically",
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default rate template for carpenters
 */
export function getCarpenterDefaultRateTemplate() {
  return {
    name: "Carpenter - Standard Rates",
    tradeType: "Carpenter",
    propertyType: null,
    hourlyRate: CARPENTER_DEFAULT_RATES.hourlyRate,
    helperHourlyRate: CARPENTER_DEFAULT_RATES.helperHourlyRate,
    dayRate: CARPENTER_DEFAULT_RATES.dayRate,
    calloutFee: CARPENTER_DEFAULT_RATES.calloutFee,
    minCharge: CARPENTER_DEFAULT_RATES.minCharge,
    ratePerM2Interior: CARPENTER_DEFAULT_RATES.ratePerM2Flooring,
    ratePerM2Exterior: CARPENTER_DEFAULT_RATES.ratePerM2Decking,
    ratePerLmTrim: CARPENTER_DEFAULT_RATES.ratePerLmSkirting,
    materialMarkupPercent: CARPENTER_DEFAULT_RATES.materialMarkupPercent,
    isDefault: true,
  };
}

/**
 * Get carpenter-specific AI system prompt enhancement
 */
export function getCarpenterSystemPromptContext(): string {
  return `
Trade-Specific Context (Carpenter):
- This is carpentry work in Australia
- Must comply with AS 1684 (Residential timber-framed construction)
- Must comply with AS 1720 (Timber structures)
- Common work: framing, doors, windows, decking, flooring, trim, cabinetry
- Timber grades: MGP10, MGP12 (pine), F14, F17 (hardwood)
- Treated timber: H2F (framing), H3 (external above ground), H4 (in-ground)
- Balustrades: 1000mm min height, 125mm max gap
- Stairs: Max 190mm riser, min 240mm going
- Termite management required in designated areas (AS 3660.1)
- Common suppliers: Bunnings, Bowens, timber yards
- SAFETY: Power tools, manual handling, working at heights
- Workmanship warranty typically 7 years structural, 2 years finishing
`;
}

/**
 * Calculate timber quantities for framing
 */
export function calculateFramingTimber(params: {
  wallLengthM: number;
  wallHeightM: number;
  studSpacing?: number; // mm, default 450
  includeNoggings?: boolean;
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  const studSpacing = (params.studSpacing || 450) / 1000; // Convert to metres
  const studCount = Math.ceil(params.wallLengthM / studSpacing) + 1;
  const studLength = Math.ceil(params.wallHeightM * 10) / 10; // Round up to 0.1m
  
  // Studs (90x45)
  const studLengthsNeeded = studCount;
  materials.push({ 
    item: "MGP10 Pine 90x45", 
    quantity: studLengthsNeeded, 
    unit: "lengths (5.4m)" 
  });
  
  // Top and bottom plates (double top plate)
  const plateLengthM = params.wallLengthM * 3; // Bottom + double top
  const plateQuantity = Math.ceil(plateLengthM / 5.4);
  materials.push({ 
    item: "MGP10 Pine 90x45 (plates)", 
    quantity: plateQuantity, 
    unit: "lengths (5.4m)" 
  });
  
  // Noggings
  if (params.includeNoggings !== false) {
    const noggingRows = Math.floor(params.wallHeightM / 1.2);
    const noggingsPerRow = studCount - 1;
    const noggingLengthM = (noggingsPerRow * noggingRows * studSpacing);
    const noggingQuantity = Math.ceil(noggingLengthM / 5.4);
    materials.push({ 
      item: "MGP10 Pine 90x35 (noggings)", 
      quantity: noggingQuantity, 
      unit: "lengths (5.4m)" 
    });
  }
  
  // Nails
  materials.push({ item: "Framing Nails 75mm", quantity: 1, unit: "box (2kg)" });
  
  return materials;
}

/**
 * Calculate decking materials
 */
export function calculateDeckingMaterials(params: {
  lengthM: number;
  widthM: number;
  boardWidth?: number; // mm, default 90
  gapMM?: number; // default 4
  joistSpacing?: number; // mm, default 450
  deckType?: "merbau" | "spottedGum" | "treatedPine" | "composite";
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  const boardWidth = (params.boardWidth || 90) / 1000;
  const gap = (params.gapMM || 4) / 1000;
  const joistSpacing = (params.joistSpacing || 450) / 1000;
  const deckType = params.deckType || "merbau";
  
  // Decking boards
  const effectiveBoardWidth = boardWidth + gap;
  const boardsAcross = Math.ceil(params.widthM / effectiveBoardWidth);
  const totalBoardLengthM = boardsAcross * params.lengthM * 1.1; // 10% waste
  
  const deckingItem = {
    merbau: "Merbau Decking 90x19",
    spottedGum: "Spotted Gum Decking 86x19",
    treatedPine: "Treated Pine Decking 90x22",
    composite: "Composite Decking",
  }[deckType];
  
  materials.push({ item: deckingItem, quantity: Math.ceil(totalBoardLengthM), unit: "lin m" });
  
  // Joists
  const joistCount = Math.ceil(params.lengthM / joistSpacing) + 1;
  const joistLengthEach = params.widthM + 0.1; // Small overhang
  const totalJoistLength = joistCount * joistLengthEach;
  materials.push({ item: "Hardwood Joist 100x50", quantity: Math.ceil(totalJoistLength), unit: "lin m" });
  
  // Bearers
  const bearerCount = Math.ceil(params.widthM / 1.8) + 1;
  const totalBearerLength = bearerCount * params.lengthM;
  materials.push({ item: "Hardwood Bearer 100x100", quantity: Math.ceil(totalBearerLength), unit: "lin m" });
  
  // Posts (estimate 1 per 2m² area)
  const areaM2 = params.lengthM * params.widthM;
  const postCount = Math.ceil(areaM2 / 4);
  materials.push({ item: "Hardwood Post 100x100", quantity: postCount * 0.6, unit: "lin m" }); // 600mm avg
  
  // Screws
  const screwsPerM2 = 20;
  const screwBoxes = Math.ceil((areaM2 * screwsPerM2) / 500);
  materials.push({ item: "Decking Screws 10g x 65mm (500pk)", quantity: screwBoxes, unit: "boxes" });
  
  // Joist hangers
  materials.push({ item: "Joist Hanger 45x190", quantity: joistCount * 2, unit: "each" });
  
  // Post anchors
  materials.push({ item: "Stirrup Post Base 100x100", quantity: postCount, unit: "each" });
  
  return materials;
}

/**
 * Get required timber treatment class
 */
export function getTimberTreatmentClass(application: string): {
  class: string;
  description: string;
} {
  const appLower = application.toLowerCase();
  
  if (appLower.includes("marine") || appLower.includes("salt water")) {
    return { class: "H6", description: "Marine applications - marine borer protection" };
  }
  if (appLower.includes("retaining") || appLower.includes("critical")) {
    return { class: "H5", description: "In-ground critical applications - very severe decay risk" };
  }
  if (appLower.includes("in ground") || appLower.includes("in-ground") || appLower.includes("post")) {
    return { class: "H4", description: "In ground contact - severe decay, borers, termites" };
  }
  if (appLower.includes("deck") || appLower.includes("external") || appLower.includes("outdoor") || appLower.includes("pergola")) {
    return { class: "H3", description: "Above ground external - moderate decay, weather exposure" };
  }
  if (appLower.includes("frame") || appLower.includes("framing") || appLower.includes("wall")) {
    return { class: "H2F", description: "Framing - termite protection in termite areas" };
  }
  if (appLower.includes("internal") || appLower.includes("inside")) {
    return { class: "H2", description: "Internal above ground - borers and termites" };
  }
  
  return { class: "H3", description: "General external use - default recommendation" };
}

/**
 * Check balustrade compliance
 */
export function checkBalustradeCompliance(params: {
  heightMM: number;
  maxGapMM: number;
  hasClimbableElements: boolean;
}): {
  compliant: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (params.heightMM < 1000) {
    issues.push(`Height ${params.heightMM}mm is below minimum 1000mm`);
  }
  
  if (params.maxGapMM > 125) {
    issues.push(`Gap ${params.maxGapMM}mm exceeds maximum 125mm`);
  }
  
  if (params.hasClimbableElements) {
    issues.push("Climbable elements detected - horizontal rails or similar must be avoided");
  }
  
  return {
    compliant: issues.length === 0,
    issues,
  };
}

/**
 * Check stair compliance
 */
export function checkStairCompliance(params: {
  riserHeightMM: number;
  goingDepthMM: number;
  numberOfRisers: number;
}): {
  compliant: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Riser height
  if (params.riserHeightMM > 190) {
    issues.push(`Riser height ${params.riserHeightMM}mm exceeds maximum 190mm`);
  }
  if (params.riserHeightMM < 115) {
    issues.push(`Riser height ${params.riserHeightMM}mm is below minimum 115mm`);
  }
  
  // Going depth
  if (params.goingDepthMM > 355) {
    issues.push(`Going depth ${params.goingDepthMM}mm exceeds maximum 355mm`);
  }
  if (params.goingDepthMM < 240) {
    issues.push(`Going depth ${params.goingDepthMM}mm is below minimum 240mm`);
  }
  
  // 2R + G rule (comfort)
  const twoRPlusG = (2 * params.riserHeightMM) + params.goingDepthMM;
  if (twoRPlusG < 550 || twoRPlusG > 700) {
    recommendations.push(`2R + G = ${twoRPlusG}mm (ideal range 550-700mm for comfort)`);
  }
  
  // Handrail requirement
  if (params.numberOfRisers >= 4) {
    recommendations.push("Handrail required on at least one side (4+ risers)");
  }
  
  return {
    compliant: issues.length === 0,
    issues,
    recommendations,
  };
}
