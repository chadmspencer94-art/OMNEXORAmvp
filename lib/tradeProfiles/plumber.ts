/**
 * Plumber Trade Profile Configuration for OMNEXORA
 * 
 * This module provides plumber-specific configuration including:
 * - Default rates and pricing for plumbing work
 * - Common materials with Australian pricing (Reece, Reliance, Tradelink)
 * - Compliance and safety information (AS/NZS 3500 Plumbing Code)
 * - Document templates and AI prompt enhancements
 * 
 * CRITICAL: Plumbing work in Australia MUST be performed by licensed plumbers.
 * 
 * Compliance References:
 * - AS/NZS 3500 - Plumbing and drainage (Parts 0-5)
 * - Building Code of Australia (BCA/NCC) - Plumbing provisions
 * - State-based plumbing licensing requirements
 * - WaterMark certification for products
 */

// ============================================================================
// PLUMBER DEFAULT RATES (Australian market rates 2024-2026)
// ============================================================================

export const PLUMBER_DEFAULT_RATES = {
  // Hourly rates
  hourlyRate: 110, // Licensed plumber hourly rate
  helperHourlyRate: 55, // Trade assistant rate
  dayRate: 850, // Full day rate
  
  // Call-out and service fees
  calloutFee: 120, // Standard call-out fee
  afterHoursCallout: 200, // After-hours/weekend call-out
  emergencyCallout: 300, // Emergency call-out (burst pipes, blocked drains)
  minCharge: 180, // Minimum job charge
  
  // Common job rates
  ratePerTapReplace: 180, // Tap replacement (labour)
  ratePerToiletInstall: 350, // Toilet installation
  ratePerVanityInstall: 450, // Vanity/basin installation
  ratePerHotWaterInstall: 650, // Hot water system install (labour, excl unit)
  ratePerDrainClear: 220, // Basic drain clearing
  ratePerDrainClearJetter: 450, // High-pressure jetter drain clear
  ratePerGasApplianceConnect: 280, // Gas appliance connection
  ratePerRoughin: 180, // Per rough-in point
  
  // Per-metre rates
  ratePerMDrainPipe: 85, // Drainage pipe per metre
  ratePerMWaterPipe: 55, // Water pipe per metre
  ratePerMGasPipe: 95, // Gas pipe per metre
  
  // Testing and certification
  ratePerComplianceCert: 150, // Compliance certificate
  ratePerGasCert: 180, // Gas compliance certificate
  ratePerPressureTest: 120, // Pressure test
  ratePerCCTVInspection: 350, // CCTV drain inspection
  
  // Material markup
  materialMarkupPercent: 30, // Standard markup on materials
};

// ============================================================================
// COMMON PLUMBING MATERIALS (Australian pricing)
// ============================================================================

export interface PlumbingMaterial {
  name: string;
  category: string;
  supplier: string;
  unitLabel: string;
  unitCost: number;
  notes: string;
  watermark?: boolean; // WaterMark certified
}

export const PLUMBER_DEFAULT_MATERIALS: PlumbingMaterial[] = [
  // Pipes - PVC Drainage
  {
    name: "PVC DWV Pipe 50mm (6m)",
    category: "Drainage Pipe",
    supplier: "Reece/Vinidex",
    unitLabel: "Length",
    unitCost: 32.00,
    notes: "Standard 50mm drainage",
    watermark: true,
  },
  {
    name: "PVC DWV Pipe 65mm (6m)",
    category: "Drainage Pipe",
    supplier: "Reece/Vinidex",
    unitLabel: "Length",
    unitCost: 45.00,
    notes: "65mm drainage",
    watermark: true,
  },
  {
    name: "PVC DWV Pipe 100mm (6m)",
    category: "Drainage Pipe",
    supplier: "Reece/Vinidex",
    unitLabel: "Length",
    unitCost: 65.00,
    notes: "Main sewer/drainage",
    watermark: true,
  },
  {
    name: "PVC Stormwater Pipe 90mm (6m)",
    category: "Stormwater Pipe",
    supplier: "Reece/Vinidex",
    unitLabel: "Length",
    unitCost: 28.00,
    notes: "Stormwater drainage",
    watermark: true,
  },
  
  // Pipes - Copper
  {
    name: "Copper Pipe Type B 15mm (6m)",
    category: "Water Pipe",
    supplier: "Reece/MM Kembla",
    unitLabel: "Length",
    unitCost: 85.00,
    notes: "Standard water supply",
    watermark: true,
  },
  {
    name: "Copper Pipe Type B 20mm (6m)",
    category: "Water Pipe",
    supplier: "Reece/MM Kembla",
    unitLabel: "Length",
    unitCost: 125.00,
    notes: "Larger supply/mains",
    watermark: true,
  },
  {
    name: "Copper Pipe Type B 25mm (6m)",
    category: "Water Pipe",
    supplier: "Reece/MM Kembla",
    unitLabel: "Length",
    unitCost: 180.00,
    notes: "Main supply line",
    watermark: true,
  },
  
  // Pipes - PEX/Poly
  {
    name: "PEX Pipe 16mm (50m Roll)",
    category: "Water Pipe",
    supplier: "Reece/Reliance",
    unitLabel: "Roll",
    unitCost: 95.00,
    notes: "Flexible water pipe",
    watermark: true,
  },
  {
    name: "PEX Pipe 20mm (50m Roll)",
    category: "Water Pipe",
    supplier: "Reece/Reliance",
    unitLabel: "Roll",
    unitCost: 145.00,
    notes: "Larger flexible pipe",
    watermark: true,
  },
  {
    name: "Blue Line Poly Pipe 25mm (50m)",
    category: "Water Pipe",
    supplier: "Reece/Philmac",
    unitLabel: "Roll",
    unitCost: 120.00,
    notes: "Underground water supply",
    watermark: true,
  },
  
  // Pipes - Gas
  {
    name: "Copper Gas Pipe 15mm (6m)",
    category: "Gas Pipe",
    supplier: "Reece/MM Kembla",
    unitLabel: "Length",
    unitCost: 95.00,
    notes: "Gas supply line",
    watermark: true,
  },
  {
    name: "Pex-Al-Pex Gas Pipe 16mm (50m)",
    category: "Gas Pipe",
    supplier: "Reece/Rehau",
    unitLabel: "Roll",
    unitCost: 280.00,
    notes: "Flexible gas pipe",
    watermark: true,
  },
  
  // Fittings - PVC
  {
    name: "PVC 90° Bend 50mm",
    category: "Fittings",
    supplier: "Reece/Vinidex",
    unitLabel: "Each",
    unitCost: 8.50,
    notes: "Standard elbow",
    watermark: true,
  },
  {
    name: "PVC 45° Bend 50mm",
    category: "Fittings",
    supplier: "Reece/Vinidex",
    unitLabel: "Each",
    unitCost: 7.50,
    notes: "45 degree elbow",
    watermark: true,
  },
  {
    name: "PVC Tee 50mm",
    category: "Fittings",
    supplier: "Reece/Vinidex",
    unitLabel: "Each",
    unitCost: 12.00,
    notes: "Equal tee",
    watermark: true,
  },
  {
    name: "PVC Junction 100x50mm",
    category: "Fittings",
    supplier: "Reece/Vinidex",
    unitLabel: "Each",
    unitCost: 18.00,
    notes: "Reducing junction",
    watermark: true,
  },
  {
    name: "PVC Inspection Opening 100mm",
    category: "Fittings",
    supplier: "Reece/Vinidex",
    unitLabel: "Each",
    unitCost: 25.00,
    notes: "IO with cap",
    watermark: true,
  },
  
  // Fittings - Copper/Brass
  {
    name: "Copper Elbow 15mm",
    category: "Fittings",
    supplier: "Reece/Comet",
    unitLabel: "Each",
    unitCost: 4.50,
    notes: "Solder elbow",
    watermark: true,
  },
  {
    name: "Copper Tee 15mm",
    category: "Fittings",
    supplier: "Reece/Comet",
    unitLabel: "Each",
    unitCost: 6.00,
    notes: "Solder tee",
    watermark: true,
  },
  {
    name: "Brass Ball Valve 15mm",
    category: "Valves",
    supplier: "Reece/RMC",
    unitLabel: "Each",
    unitCost: 28.00,
    notes: "Isolation valve",
    watermark: true,
  },
  {
    name: "Brass Ball Valve 20mm",
    category: "Valves",
    supplier: "Reece/RMC",
    unitLabel: "Each",
    unitCost: 38.00,
    notes: "Isolation valve",
    watermark: true,
  },
  {
    name: "Gate Valve 25mm",
    category: "Valves",
    supplier: "Reece/RMC",
    unitLabel: "Each",
    unitCost: 55.00,
    notes: "Mains valve",
    watermark: true,
  },
  
  // Fittings - Press Fit (SharkBite style)
  {
    name: "Press Fit Elbow 16mm",
    category: "Press Fittings",
    supplier: "Reece/Reliance",
    unitLabel: "Each",
    unitCost: 12.00,
    notes: "Push-fit elbow",
    watermark: true,
  },
  {
    name: "Press Fit Tee 16mm",
    category: "Press Fittings",
    supplier: "Reece/Reliance",
    unitLabel: "Each",
    unitCost: 18.00,
    notes: "Push-fit tee",
    watermark: true,
  },
  {
    name: "Press Fit Coupling 16mm",
    category: "Press Fittings",
    supplier: "Reece/Reliance",
    unitLabel: "Each",
    unitCost: 8.00,
    notes: "Push-fit coupling",
    watermark: true,
  },
  
  // Tapware
  {
    name: "Basin Mixer Chrome",
    category: "Tapware",
    supplier: "Reece/Caroma",
    unitLabel: "Each",
    unitCost: 180.00,
    notes: "Standard basin mixer",
    watermark: true,
  },
  {
    name: "Kitchen Sink Mixer Chrome",
    category: "Tapware",
    supplier: "Reece/Caroma",
    unitLabel: "Each",
    unitCost: 220.00,
    notes: "Standard kitchen mixer",
    watermark: true,
  },
  {
    name: "Shower Mixer Chrome",
    category: "Tapware",
    supplier: "Reece/Caroma",
    unitLabel: "Each",
    unitCost: 195.00,
    notes: "Concealed shower mixer",
    watermark: true,
  },
  {
    name: "Laundry Tap Set Chrome",
    category: "Tapware",
    supplier: "Reece/Caroma",
    unitLabel: "Set",
    unitCost: 145.00,
    notes: "Washing machine taps",
    watermark: true,
  },
  {
    name: "Hose Tap Brass",
    category: "Tapware",
    supplier: "Reece/Various",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Garden hose tap",
    watermark: true,
  },
  
  // Toilets and Cisterns
  {
    name: "Close Coupled Toilet Suite",
    category: "Sanitary",
    supplier: "Reece/Caroma",
    unitLabel: "Set",
    unitCost: 350.00,
    notes: "Standard toilet suite 4-star WELS",
    watermark: true,
  },
  {
    name: "Wall Hung Toilet Suite",
    category: "Sanitary",
    supplier: "Reece/Caroma",
    unitLabel: "Set",
    unitCost: 650.00,
    notes: "Wall-mounted toilet",
    watermark: true,
  },
  {
    name: "Cistern Inlet Valve",
    category: "Toilet Parts",
    supplier: "Reece/Fluidmaster",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Replacement inlet valve",
    watermark: true,
  },
  {
    name: "Cistern Outlet Valve",
    category: "Toilet Parts",
    supplier: "Reece/Fluidmaster",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Dual flush outlet valve",
    watermark: true,
  },
  {
    name: "Toilet Connector Set",
    category: "Toilet Parts",
    supplier: "Reece/Various",
    unitLabel: "Set",
    unitCost: 28.00,
    notes: "Pan connector and bolts",
    watermark: true,
  },
  
  // Basins and Vanities
  {
    name: "Bathroom Basin White",
    category: "Sanitary",
    supplier: "Reece/Caroma",
    unitLabel: "Each",
    unitCost: 180.00,
    notes: "Standard drop-in basin",
    watermark: true,
  },
  {
    name: "Vanity Unit 600mm White",
    category: "Sanitary",
    supplier: "Reece/Various",
    unitLabel: "Each",
    unitCost: 450.00,
    notes: "Wall-hung vanity with basin",
    watermark: true,
  },
  {
    name: "Basin Pop-Up Waste Chrome",
    category: "Wastes",
    supplier: "Reece/McAlpine",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Pop-up waste assembly",
    watermark: true,
  },
  {
    name: "Bottle Trap Chrome",
    category: "Wastes",
    supplier: "Reece/McAlpine",
    unitLabel: "Each",
    unitCost: 55.00,
    notes: "32mm bottle trap",
    watermark: true,
  },
  
  // Sinks and Wastes
  {
    name: "Stainless Steel Sink Double Bowl",
    category: "Sinks",
    supplier: "Reece/Clark",
    unitLabel: "Each",
    unitCost: 280.00,
    notes: "Kitchen double bowl sink",
    watermark: true,
  },
  {
    name: "Laundry Tub 45L",
    category: "Sinks",
    supplier: "Reece/Clark",
    unitLabel: "Each",
    unitCost: 220.00,
    notes: "Standard laundry tub",
    watermark: true,
  },
  {
    name: "Sink Basket Waste",
    category: "Wastes",
    supplier: "Reece/Various",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Kitchen sink waste",
    watermark: true,
  },
  
  // Hot Water
  {
    name: "Electric Hot Water 50L",
    category: "Hot Water",
    supplier: "Reece/Rheem",
    unitLabel: "Each",
    unitCost: 650.00,
    notes: "Electric storage HWS",
    watermark: true,
  },
  {
    name: "Electric Hot Water 125L",
    category: "Hot Water",
    supplier: "Reece/Rheem",
    unitLabel: "Each",
    unitCost: 850.00,
    notes: "Larger electric HWS",
    watermark: true,
  },
  {
    name: "Gas Hot Water 26L Continuous",
    category: "Hot Water",
    supplier: "Reece/Rinnai",
    unitLabel: "Each",
    unitCost: 1450.00,
    notes: "Continuous flow gas",
    watermark: true,
  },
  {
    name: "Solar Hot Water 315L",
    category: "Hot Water",
    supplier: "Reece/Rheem",
    unitLabel: "Each",
    unitCost: 4500.00,
    notes: "Solar HWS with electric boost",
    watermark: true,
  },
  {
    name: "Hot Water Tempering Valve",
    category: "Hot Water",
    supplier: "Reece/RMC",
    unitLabel: "Each",
    unitCost: 180.00,
    notes: "TMV - mandatory for bathrooms",
    watermark: true,
  },
  {
    name: "Hot Water Relief Valve",
    category: "Hot Water",
    supplier: "Reece/RMC",
    unitLabel: "Each",
    unitCost: 65.00,
    notes: "T&P relief valve",
    watermark: true,
  },
  
  // Gas Fittings
  {
    name: "Gas Bayonet Fitting",
    category: "Gas",
    supplier: "Reece/Various",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Bayonet gas point",
    watermark: true,
  },
  {
    name: "Gas Flex Hose 1200mm",
    category: "Gas",
    supplier: "Reece/Various",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Appliance connection hose",
    watermark: true,
  },
  {
    name: "Gas Isolation Valve 15mm",
    category: "Gas",
    supplier: "Reece/RMC",
    unitLabel: "Each",
    unitCost: 38.00,
    notes: "Gas isolation cock",
    watermark: true,
  },
  
  // Drainage
  {
    name: "Floor Waste Grate 100mm Chrome",
    category: "Drainage",
    supplier: "Reece/Various",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Standard floor waste",
    watermark: true,
  },
  {
    name: "Shower Grate Linear 900mm",
    category: "Drainage",
    supplier: "Reece/Various",
    unitLabel: "Each",
    unitCost: 180.00,
    notes: "Linear strip drain",
    watermark: true,
  },
  {
    name: "Gully Trap 100mm PVC",
    category: "Drainage",
    supplier: "Reece/Vinidex",
    unitLabel: "Each",
    unitCost: 85.00,
    notes: "Yard gully with lid",
    watermark: true,
  },
  {
    name: "Overflow Relief Gully",
    category: "Drainage",
    supplier: "Reece/Vinidex",
    unitLabel: "Each",
    unitCost: 95.00,
    notes: "ORG with surcharge grate",
    watermark: true,
  },
  
  // Consumables
  {
    name: "PVC Solvent Cement 500ml",
    category: "Consumables",
    supplier: "Reece/Various",
    unitLabel: "Can",
    unitCost: 25.00,
    notes: "PVC glue",
  },
  {
    name: "PVC Priming Fluid 500ml",
    category: "Consumables",
    supplier: "Reece/Various",
    unitLabel: "Can",
    unitCost: 18.00,
    notes: "PVC primer",
  },
  {
    name: "PTFE Thread Tape (10 Pack)",
    category: "Consumables",
    supplier: "Reece/Various",
    unitLabel: "Pack",
    unitCost: 12.00,
    notes: "Thread sealing tape",
  },
  {
    name: "Solder Wire 3mm (500g)",
    category: "Consumables",
    supplier: "Reece/Various",
    unitLabel: "Roll",
    unitCost: 45.00,
    notes: "Lead-free solder",
  },
  {
    name: "Flux Paste 250g",
    category: "Consumables",
    supplier: "Reece/Various",
    unitLabel: "Jar",
    unitCost: 18.00,
    notes: "Soldering flux",
  },
  {
    name: "Pipe Clips 15mm (Box 100)",
    category: "Consumables",
    supplier: "Reece/Various",
    unitLabel: "Box",
    unitCost: 35.00,
    notes: "Copper pipe clips",
  },
];

// ============================================================================
// AUSTRALIAN COMPLIANCE INFORMATION
// ============================================================================

export const PLUMBER_COMPLIANCE = {
  // Critical: Licensing Requirements
  licensing: {
    requirement: "ALL plumbing and drainage work in Australia must be performed by a licensed plumber",
    stateAuthorities: {
      NSW: "NSW Fair Trading - Plumbing License",
      VIC: "Victorian Building Authority (VBA)",
      QLD: "Queensland Building and Construction Commission (QBCC)",
      WA: "Plumbers Licensing Board WA",
      SA: "Consumer and Business Services SA",
      TAS: "Consumer Building and Occupational Services (CBOS)",
      NT: "NT Licensing Commission",
      ACT: "Access Canberra",
    },
    licenseTypes: [
      "Plumber License (full) - Water, sanitary, drainage",
      "Gasfitter License - Gas work",
      "Drainer License - Drainage only",
      "Roof Plumber License - Roof drainage/gutters",
      "Restricted Plumber License - Specific work only",
      "Plumbing Contractor License - Business operations",
    ],
    endorsements: [
      "Water supply",
      "Sanitary plumbing",
      "Drainage plumbing",
      "Mechanical services",
      "Roofing (stormwater)",
      "Fire protection (sprinklers)",
      "Medical gas",
    ],
  },

  // Compliance Certificates
  complianceCertificates: {
    plumbingCertificate: {
      name: "Certificate of Compliance - Plumbing",
      requirement: "Required for all notifiable plumbing/drainage work",
      timeframe: "Must be lodged within timeframe specified by state (typically 3-5 days)",
    },
    gasCertificate: {
      name: "Certificate of Compliance - Gas",
      requirement: "Required for all gas work",
      timeframe: "Must be lodged within 5 business days typically",
    },
    notifiableWork: [
      "New plumbing installations",
      "Alterations to existing plumbing",
      "Hot water system installation",
      "New drainage connections",
      "Sewer/drain modifications",
      "Gas installations and alterations",
      "Backflow prevention installation",
    ],
    nonNotifiable: [
      "Like-for-like tap replacement",
      "Clearing blocked drains",
      "Replacing washers and seals",
      "Replacing toilet seats",
      "Minor repairs (same specification)",
    ],
  },

  // Australian Standards - Plumbing and Drainage Code
  standards: [
    {
      code: "AS/NZS 3500.0",
      title: "Plumbing and drainage - Glossary of terms",
      description: "Terminology definitions",
      mandatory: true,
    },
    {
      code: "AS/NZS 3500.1",
      title: "Plumbing and drainage - Water services",
      description: "Water supply design and installation",
      mandatory: true,
    },
    {
      code: "AS/NZS 3500.2",
      title: "Plumbing and drainage - Sanitary plumbing and drainage",
      description: "Sanitary drainage systems",
      mandatory: true,
    },
    {
      code: "AS/NZS 3500.3",
      title: "Plumbing and drainage - Stormwater drainage",
      description: "Stormwater drainage systems",
      mandatory: true,
    },
    {
      code: "AS/NZS 3500.4",
      title: "Plumbing and drainage - Heated water services",
      description: "Hot water systems",
      mandatory: true,
    },
    {
      code: "AS/NZS 3500.5",
      title: "Plumbing and drainage - Housing installations",
      description: "Residential plumbing requirements",
      mandatory: true,
    },
    {
      code: "AS 5601",
      title: "Gas installations",
      description: "Gas fitting requirements",
      mandatory: true,
    },
    {
      code: "AS/NZS 4234",
      title: "Heated water systems - Calculation of energy consumption",
      description: "Hot water energy requirements",
      mandatory: false,
    },
  ],

  // WaterMark Certification
  watermark: {
    requirement: "All plumbing products must be WaterMark certified",
    description: "WaterMark is the Australian certification scheme for plumbing and drainage products",
    compliance: "Products not WaterMark certified cannot be legally installed",
    website: "www.abcb.gov.au/watermark",
    note: "Check WaterMark certification on all products before installation",
  },

  // WELS Water Efficiency
  wels: {
    scheme: "Water Efficiency Labelling and Standards (WELS)",
    requirement: "Specified products must meet minimum WELS star rating",
    products: [
      "Toilets - min 4 star",
      "Showers - min 3 star",
      "Taps - min 4 star",
      "Dishwashers",
      "Washing machines",
    ],
    notes: "Higher star rating = more water efficient",
  },

  // Hot Water Requirements
  hotWaterRequirements: {
    temperingValves: {
      requirement: "Tempering valves (TMV) mandatory for bathrooms in residential",
      maxTemp: "50°C maximum delivery temperature to bathroom fixtures",
      standard: "AS/NZS 4032.1 for tempering valves",
    },
    storage: {
      requirement: "Storage temperature minimum 60°C to prevent Legionella",
      reliefValves: "Temperature and pressure relief valve required on all storage systems",
    },
    installation: {
      requirement: "Hot water units must be installed per manufacturer specifications",
      strapping: "Earthquake strapping required in some areas",
      clearances: "Minimum clearances must be maintained",
    },
  },

  // Backflow Prevention
  backflowPrevention: {
    requirement: "Backflow prevention devices required to protect potable water supply",
    hazardRatings: [
      "Low hazard - Non-testable single check valve",
      "Medium hazard - Testable double check valve",
      "High hazard - Reduced pressure zone device (RPZ)",
    ],
    testingRequirement: "Annual testing required for testable devices",
    registration: "Devices must be registered with water authority",
  },

  // SafeWork Requirements
  safeWork: {
    requirements: [
      "Confined space entry procedures (manholes, tanks)",
      "Excavation safety (trenching for drainage)",
      "Hot work procedures (soldering, brazing)",
      "Manual handling (heavy fixtures, pipe)",
      "Working at heights (roof plumbing)",
      "Hazardous substances (solvent cement, flux)",
      "Asbestos awareness (older pipe removal)",
    ],
    ppe: [
      "Safety glasses",
      "Work gloves",
      "Safety footwear (steel cap)",
      "Hearing protection (when using power tools)",
      "Respiratory protection (solvent cement, dust)",
      "Knee pads",
    ],
    gasSafety: [
      "Gas detection equipment",
      "Ventilation during purging",
      "Leak testing procedures",
      "Combustion analysis",
    ],
  },
};

// ============================================================================
// AI PROMPT ENHANCEMENTS FOR PLUMBING
// ============================================================================

export const PLUMBER_AI_CONTEXT = {
  // Trade-specific context for AI document generation
  tradeDescription: "licensed plumbing contractor performing domestic and commercial plumbing, drainage, and gas fitting work",
  
  // Common scope items for plumbing work
  commonScopeItems: [
    "Supply and install tapware",
    "Supply and install toilet suite",
    "Supply and install basin/vanity",
    "Supply and install shower",
    "Supply and install hot water system",
    "Supply and install kitchen sink",
    "Supply and install laundry tub",
    "Clear blocked drains",
    "CCTV drain inspection",
    "High-pressure water jetting",
    "Install/replace water supply pipes",
    "Install/replace drainage pipes",
    "Install/replace stormwater drainage",
    "Install backflow prevention device",
    "Gas appliance connection",
    "Gas pipe installation",
    "Rough-in plumbing for new build",
    "Bathroom renovation plumbing",
    "Kitchen renovation plumbing",
    "Install tempering valve (TMV)",
  ],
  
  // Standard inclusions for plumbing quotes
  standardInclusions: [
    "Supply of all plumbing materials (as specified)",
    "Licensed plumber labour",
    "All pipework and connections",
    "Testing and commissioning",
    "Compliance certificate (for notifiable work)",
    "Water authority notification (if required)",
    "Cleanup of work areas",
    "Workmanship warranty (typically 12 months)",
    "Manufacturer warranties on products",
  ],
  
  // Standard exclusions for plumbing quotes
  standardExclusions: [
    "Building/structural work",
    "Tiling and waterproofing",
    "Electrical work (unless licensed)",
    "Painting and making good",
    "Permit fees (if required)",
    "Water authority fees",
    "Asbestos removal",
    "Major excavation equipment",
    "After-hours work (unless specified)",
    "Fixtures/fittings (unless specified)",
  ],
  
  // Safety considerations for SWMS
  safetyHazards: [
    "Working in confined spaces (manholes, ceiling spaces)",
    "Excavation collapse (trenching)",
    "Manual handling (heavy fixtures, materials)",
    "Cuts from sharp materials and tools",
    "Chemical exposure (solvent cement, flux)",
    "Hot work burns (soldering, brazing)",
    "Gas leaks and explosion risk",
    "Contaminated water/sewage exposure",
    "Slips and falls (wet surfaces)",
    "Working at heights (roof plumbing)",
    "Asbestos exposure (older properties)",
  ],
  
  // Safety controls required
  safetyControls: [
    "Confined space entry permit and procedures",
    "Trench shoring/battering for excavations",
    "Appropriate PPE for task",
    "Ventilation for solvent/hot work",
    "Gas detection equipment",
    "Hygiene practices for sewage work",
    "Asbestos check before work on older buildings",
    "Isolation of water/gas before work",
    "Pressure testing procedures",
  ],
  
  // Maintenance guidance
  maintenanceGuidance: {
    taps: {
      issue: "Dripping taps",
      cause: "Worn washers or cartridge",
      frequency: "Replace as needed, typically every 2-5 years",
      diy: "Washer replacement may be DIY, mixer cartridge needs plumber",
    },
    toilets: {
      issue: "Running toilet",
      cause: "Worn inlet or outlet valve",
      frequency: "Components typically last 5-10 years",
      maintenance: "Check for leaks regularly, replace components as needed",
    },
    hotWater: {
      inspection: "Annual inspection recommended",
      reliefValve: "Test T&P relief valve every 6 months",
      anode: "Sacrificial anode replacement every 5 years (storage systems)",
      lifespan: "Electric storage 10-15 years, Gas continuous 15-20 years",
    },
    drains: {
      maintenance: "Avoid grease, hair, and foreign objects in drains",
      cleaning: "Consider annual drain cleaning in older properties",
      inspection: "CCTV inspection if recurring blockages",
      roots: "Tree root intrusion common cause of sewer blockages",
    },
    gas: {
      inspection: "Annual gas appliance service recommended",
      leaks: "Evacuate and call plumber/gas authority if gas smell detected",
      testing: "Gas installations should be tested every 2 years",
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default rate template for plumbers
 */
export function getPlumberDefaultRateTemplate() {
  return {
    name: "Plumber - Standard Rates",
    tradeType: "Plumber",
    propertyType: null,
    hourlyRate: PLUMBER_DEFAULT_RATES.hourlyRate,
    helperHourlyRate: PLUMBER_DEFAULT_RATES.helperHourlyRate,
    dayRate: PLUMBER_DEFAULT_RATES.dayRate,
    calloutFee: PLUMBER_DEFAULT_RATES.calloutFee,
    minCharge: PLUMBER_DEFAULT_RATES.minCharge,
    ratePerM2Interior: null, // Not typically used
    ratePerM2Exterior: null,
    ratePerLmTrim: PLUMBER_DEFAULT_RATES.ratePerMWaterPipe, // Use pipe rate
    materialMarkupPercent: PLUMBER_DEFAULT_RATES.materialMarkupPercent,
    isDefault: true,
  };
}

/**
 * Get plumber-specific AI system prompt enhancement
 */
export function getPlumberSystemPromptContext(): string {
  return `
Trade-Specific Context (Plumber):
- This is plumbing work in Australia - MUST be performed by licensed plumber
- All plumbing must comply with AS/NZS 3500 (Plumbing and Drainage Code)
- Gas work requires separate gasfitter license endorsement
- Compliance certificate required for notifiable work
- ALL products must be WaterMark certified
- Water-using products must meet WELS efficiency ratings
- Tempering valves (TMV) mandatory in bathrooms - max 50°C delivery
- Hot water storage must be 60°C minimum to prevent Legionella
- Backflow prevention required based on hazard level
- Common brands: Reece, Caroma, Rheem, Rinnai, Clark
- Pricing typically per fixture/point plus materials
- SAFETY: Confined spaces, excavation, gas work are high-risk
- Workmanship warranty typically 12 months
`;
}

/**
 * Calculate estimated plumbing materials for common jobs
 */
export function estimatePlumbingMaterials(params: {
  tapCount?: number;
  toiletCount?: number;
  basinCount?: number;
  showerCount?: number;
  hotWaterType?: "electric" | "gas" | "solar";
  drainageMetres?: number;
  waterPipeMetres?: number;
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  // Taps
  if (params.tapCount) {
    materials.push({ item: "Basin Mixer Chrome", quantity: params.tapCount, unit: "each" });
    materials.push({ item: "Brass Ball Valve 15mm", quantity: params.tapCount, unit: "each" });
  }
  
  // Toilets
  if (params.toiletCount) {
    materials.push({ item: "Close Coupled Toilet Suite", quantity: params.toiletCount, unit: "sets" });
    materials.push({ item: "Toilet Connector Set", quantity: params.toiletCount, unit: "sets" });
  }
  
  // Basins
  if (params.basinCount) {
    materials.push({ item: "Bathroom Basin White", quantity: params.basinCount, unit: "each" });
    materials.push({ item: "Basin Pop-Up Waste Chrome", quantity: params.basinCount, unit: "each" });
    materials.push({ item: "Bottle Trap Chrome", quantity: params.basinCount, unit: "each" });
  }
  
  // Showers
  if (params.showerCount) {
    materials.push({ item: "Shower Mixer Chrome", quantity: params.showerCount, unit: "each" });
    materials.push({ item: "Floor Waste Grate 100mm Chrome", quantity: params.showerCount, unit: "each" });
  }
  
  // Hot water
  if (params.hotWaterType) {
    const hwMaterials: Record<string, string> = {
      electric: "Electric Hot Water 125L",
      gas: "Gas Hot Water 26L Continuous",
      solar: "Solar Hot Water 315L",
    };
    materials.push({ item: hwMaterials[params.hotWaterType], quantity: 1, unit: "each" });
    materials.push({ item: "Hot Water Tempering Valve", quantity: 1, unit: "each" });
    materials.push({ item: "Hot Water Relief Valve", quantity: 1, unit: "each" });
  }
  
  // Drainage
  if (params.drainageMetres) {
    const lengths = Math.ceil(params.drainageMetres / 6);
    materials.push({ item: "PVC DWV Pipe 50mm (6m)", quantity: lengths, unit: "lengths" });
    materials.push({ item: "PVC 90° Bend 50mm", quantity: Math.ceil(params.drainageMetres / 3), unit: "each" });
    materials.push({ item: "PVC Tee 50mm", quantity: Math.ceil(params.drainageMetres / 5), unit: "each" });
    materials.push({ item: "PVC Solvent Cement 500ml", quantity: Math.ceil(lengths / 4), unit: "cans" });
  }
  
  // Water pipe
  if (params.waterPipeMetres) {
    const rolls = Math.ceil(params.waterPipeMetres / 50);
    materials.push({ item: "PEX Pipe 16mm (50m Roll)", quantity: rolls, unit: "rolls" });
    materials.push({ item: "Press Fit Elbow 16mm", quantity: Math.ceil(params.waterPipeMetres / 4), unit: "each" });
    materials.push({ item: "Press Fit Tee 16mm", quantity: Math.ceil(params.waterPipeMetres / 6), unit: "each" });
  }
  
  // General consumables
  materials.push({ item: "PTFE Thread Tape (10 Pack)", quantity: 1, unit: "pack" });
  
  return materials;
}

/**
 * Get compliance certificate requirements
 */
export function getPlumbingCertificateRequirements(workType: string): {
  plumbingCert: boolean;
  gasCert: boolean;
  reason: string;
} {
  const workLower = workType.toLowerCase();
  
  const gasWork = ["gas", "heater", "cooktop", "oven", "bbq", "bayonet"].some(g => workLower.includes(g));
  const notifiableWork = [
    "install", "new", "alteration", "hot water", "drain", "sewer",
    "toilet", "basin", "shower", "sink", "connection", "backflow"
  ].some(w => workLower.includes(w));
  
  return {
    plumbingCert: notifiableWork,
    gasCert: gasWork,
    reason: gasWork && notifiableWork 
      ? "Both plumbing and gas compliance certificates required"
      : gasWork 
        ? "Gas compliance certificate required"
        : notifiableWork 
          ? "Plumbing compliance certificate required"
          : "Non-notifiable work - no certificate required but records should be kept",
  };
}

/**
 * Get hot water tempering valve requirements
 */
export function getTemperingValveRequirements(propertyType: string): {
  required: boolean;
  locations: string[];
  maxTemp: string;
  standard: string;
} {
  const residential = ["house", "unit", "apartment", "townhouse", "residential", "home"]
    .some(p => propertyType.toLowerCase().includes(p));
  
  if (residential) {
    return {
      required: true,
      locations: [
        "Bathroom basin",
        "Bathroom bath",
        "Bathroom shower",
        "Any bathing facility accessible to children or elderly",
      ],
      maxTemp: "50°C maximum delivery temperature",
      standard: "AS/NZS 4032.1",
    };
  }
  
  return {
    required: true,
    locations: [
      "All sanitary fixtures where risk of scalding exists",
      "Healthcare facilities - all patient areas",
      "Aged care - all resident areas",
      "Childcare - all child-accessible areas",
    ],
    maxTemp: "45°C maximum for healthcare/aged care, 50°C for general",
    standard: "AS/NZS 4032.1 and AS/NZS 3500.4",
  };
}

/**
 * Get backflow prevention requirements
 */
export function getBackflowRequirements(hazardLevel: "low" | "medium" | "high"): {
  device: string;
  testing: string;
  registration: boolean;
} {
  const requirements: Record<string, { device: string; testing: string; registration: boolean }> = {
    low: {
      device: "Non-testable single check valve (SCDV)",
      testing: "No testing required",
      registration: false,
    },
    medium: {
      device: "Testable double check valve (DCV)",
      testing: "Annual testing required by licensed tester",
      registration: true,
    },
    high: {
      device: "Reduced pressure zone device (RPZ)",
      testing: "Annual testing required by licensed tester",
      registration: true,
    },
  };
  
  return requirements[hazardLevel];
}
