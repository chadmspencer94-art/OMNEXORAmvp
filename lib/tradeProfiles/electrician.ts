/**
 * Electrician Trade Profile Configuration for OMNEXORA
 * 
 * This module provides electrician-specific configuration including:
 * - Default rates and pricing for electrical work
 * - Common materials with Australian pricing (Clipsal, Schneider, HPM)
 * - Compliance and safety information (AS/NZS 3000 Wiring Rules)
 * - Document templates and AI prompt enhancements
 * 
 * CRITICAL: Electrical work in Australia MUST be performed by licensed electricians.
 * 
 * Compliance References:
 * - AS/NZS 3000 - Electrical installations (Wiring Rules)
 * - AS/NZS 3008 - Selection of cables
 * - AS/NZS 3012 - Construction and demolition sites
 * - State-based electrical licensing requirements
 * - Certificate of Compliance (CoC) requirements
 */

// ============================================================================
// ELECTRICIAN DEFAULT RATES (Australian market rates 2024-2026)
// ============================================================================

export const ELECTRICIAN_DEFAULT_RATES = {
  // Hourly rates
  hourlyRate: 95, // Licensed electrician hourly rate
  helperHourlyRate: 55, // Apprentice/trade assistant rate
  dayRate: 750, // Full day rate
  
  // Call-out and service fees
  calloutFee: 120, // Standard call-out fee
  afterHoursCallout: 180, // After-hours/weekend call-out
  emergencyCallout: 250, // Emergency call-out (24/7)
  minCharge: 180, // Minimum job charge
  
  // Per-point rates (supply + install)
  ratePerPowerPoint: 120, // Standard GPO installation
  ratePerLightPoint: 150, // Light point installation (switch + fitting)
  ratePerDownlight: 85, // LED downlight installation
  ratePerSmokeAlarm: 95, // Hardwired smoke alarm
  ratePerDataPoint: 140, // Data/network point
  ratePerFanPoint: 180, // Ceiling fan installation point
  ratePerRCDInstall: 220, // RCD installation in switchboard
  
  // Switchboard rates
  ratePerSwitchboardUpgrade: 1200, // Basic switchboard upgrade
  ratePerMeterboxRelocate: 850, // Meter box relocation
  
  // Testing and certification
  ratePerTestTag: 8, // Test and tag per item
  ratePerThermalScan: 350, // Thermal imaging inspection
  ratePerCertificate: 85, // Certificate of Compliance preparation
  
  // Material markup
  materialMarkupPercent: 30, // Standard markup on materials
};

// ============================================================================
// COMMON ELECTRICAL MATERIALS (Australian pricing)
// ============================================================================

export interface ElectricalMaterial {
  name: string;
  category: string;
  supplier: string;
  unitLabel: string;
  unitCost: number;
  notes: string;
}

export const ELECTRICIAN_DEFAULT_MATERIALS: ElectricalMaterial[] = [
  // Power Points (GPOs)
  {
    name: "Clipsal Iconic Single GPO White",
    category: "Power Points",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 18.00,
    notes: "Standard single power point",
  },
  {
    name: "Clipsal Iconic Double GPO White",
    category: "Power Points",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 25.00,
    notes: "Standard double power point",
  },
  {
    name: "Clipsal Iconic USB Double GPO",
    category: "Power Points",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 55.00,
    notes: "Double GPO with dual USB ports",
  },
  {
    name: "Weatherproof GPO IP53",
    category: "Power Points",
    supplier: "Clipsal/HPM",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "External/wet area power point",
  },
  {
    name: "HPM Excel Single GPO",
    category: "Power Points",
    supplier: "HPM",
    unitLabel: "Each",
    unitCost: 12.00,
    notes: "Budget single power point",
  },
  {
    name: "20A Outlet (Caravan/Air Con)",
    category: "Power Points",
    supplier: "Clipsal",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Heavy duty 20A outlet",
  },
  
  // Light Switches
  {
    name: "Clipsal Iconic Single Switch White",
    category: "Switches",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 12.00,
    notes: "Standard single light switch",
  },
  {
    name: "Clipsal Iconic Double Switch White",
    category: "Switches",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 18.00,
    notes: "Standard double light switch",
  },
  {
    name: "Clipsal Iconic Dimmer Switch",
    category: "Switches",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 65.00,
    notes: "LED-compatible dimmer",
  },
  {
    name: "Motion Sensor Switch",
    category: "Switches",
    supplier: "Clipsal/HPM",
    unitLabel: "Each",
    unitCost: 85.00,
    notes: "PIR motion-activated switch",
  },
  {
    name: "Timer Switch Digital",
    category: "Switches",
    supplier: "Clipsal/HPM",
    unitLabel: "Each",
    unitCost: 95.00,
    notes: "Programmable timer switch",
  },
  
  // LED Downlights
  {
    name: "LED Downlight 10W Tri-Colour",
    category: "Lighting",
    supplier: "Brilliant/Domus",
    unitLabel: "Each",
    unitCost: 25.00,
    notes: "3000K/4000K/6000K selectable",
  },
  {
    name: "LED Downlight 13W Dimmable",
    category: "Lighting",
    supplier: "SAL Lighting",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Commercial grade dimmable",
  },
  {
    name: "LED Oyster Light 18W",
    category: "Lighting",
    supplier: "Brilliant/Mercator",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Standard ceiling oyster",
  },
  {
    name: "LED Batten 20W 600mm",
    category: "Lighting",
    supplier: "Philips/SAL",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Fluorescent replacement batten",
  },
  {
    name: "LED Batten 40W 1200mm",
    category: "Lighting",
    supplier: "Philips/SAL",
    unitLabel: "Each",
    unitCost: 55.00,
    notes: "Commercial 4ft replacement",
  },
  {
    name: "LED Floodlight 30W",
    category: "Lighting",
    supplier: "Martec/Domus",
    unitLabel: "Each",
    unitCost: 65.00,
    notes: "External security flood",
  },
  
  // Smoke Alarms
  {
    name: "Photoelectric Smoke Alarm 240V",
    category: "Safety",
    supplier: "Clipsal/Brooks",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Hardwired photoelectric (AS 3786)",
  },
  {
    name: "Smoke Alarm 240V Interconnect",
    category: "Safety",
    supplier: "Clipsal/Brooks",
    unitLabel: "Each",
    unitCost: 55.00,
    notes: "Interconnectable (wireless or wired)",
  },
  {
    name: "Combination Smoke/CO Alarm",
    category: "Safety",
    supplier: "First Alert/Brooks",
    unitLabel: "Each",
    unitCost: 95.00,
    notes: "Smoke and carbon monoxide",
  },
  
  // Switchboard Components
  {
    name: "RCD 2 Pole 25A 30mA",
    category: "Switchboard",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 85.00,
    notes: "Standard safety switch",
  },
  {
    name: "MCB 1 Pole 16A",
    category: "Switchboard",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 15.00,
    notes: "Circuit breaker - lighting",
  },
  {
    name: "MCB 1 Pole 20A",
    category: "Switchboard",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 16.00,
    notes: "Circuit breaker - power",
  },
  {
    name: "MCB 2 Pole 20A",
    category: "Switchboard",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Double pole breaker",
  },
  {
    name: "RCBO 1P+N 16A 30mA",
    category: "Switchboard",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 95.00,
    notes: "Combined RCD/MCB",
  },
  {
    name: "Main Switch 63A 2 Pole",
    category: "Switchboard",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 75.00,
    notes: "Main isolator switch",
  },
  {
    name: "Switchboard Enclosure 18 Pole",
    category: "Switchboard",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 120.00,
    notes: "Standard residential board",
  },
  {
    name: "Surge Protector Module",
    category: "Switchboard",
    supplier: "Clipsal/Schneider",
    unitLabel: "Each",
    unitCost: 180.00,
    notes: "Whole-house surge protection",
  },
  
  // Cable
  {
    name: "TPS Cable 2.5mm² Twin + Earth (100m)",
    category: "Cable",
    supplier: "Prysmian/Olex",
    unitLabel: "Roll",
    unitCost: 185.00,
    notes: "Standard power circuit cable",
  },
  {
    name: "TPS Cable 1.5mm² Twin + Earth (100m)",
    category: "Cable",
    supplier: "Prysmian/Olex",
    unitLabel: "Roll",
    unitCost: 145.00,
    notes: "Standard lighting circuit cable",
  },
  {
    name: "TPS Cable 4mm² Twin + Earth (100m)",
    category: "Cable",
    supplier: "Prysmian/Olex",
    unitLabel: "Roll",
    unitCost: 285.00,
    notes: "Heavy duty circuits (stove, A/C)",
  },
  {
    name: "TPS Cable 6mm² Twin + Earth (100m)",
    category: "Cable",
    supplier: "Prysmian/Olex",
    unitLabel: "Roll",
    unitCost: 385.00,
    notes: "Sub-mains/hot water",
  },
  {
    name: "Flexible Cord 3 Core 1mm² (10m)",
    category: "Cable",
    supplier: "Prysmian/Olex",
    unitLabel: "Roll",
    unitCost: 35.00,
    notes: "Appliance connection",
  },
  {
    name: "Data Cable Cat6 (305m Box)",
    category: "Cable",
    supplier: "Schneider/Belkin",
    unitLabel: "Box",
    unitCost: 180.00,
    notes: "Network cable",
  },
  
  // Conduit and Fittings
  {
    name: "PVC Conduit 20mm (4m)",
    category: "Conduit",
    supplier: "Iplex/Various",
    unitLabel: "Length",
    unitCost: 8.00,
    notes: "Standard electrical conduit",
  },
  {
    name: "PVC Conduit 25mm (4m)",
    category: "Conduit",
    supplier: "Iplex/Various",
    unitLabel: "Length",
    unitCost: 10.00,
    notes: "Larger conduit",
  },
  {
    name: "Flexible Conduit 20mm (25m)",
    category: "Conduit",
    supplier: "Various",
    unitLabel: "Roll",
    unitCost: 45.00,
    notes: "Corrugated flexible",
  },
  {
    name: "Junction Box 4x4",
    category: "Accessories",
    supplier: "Clipsal/HPM",
    unitLabel: "Each",
    unitCost: 8.00,
    notes: "Standard junction box",
  },
  {
    name: "Back Box Flush Mount",
    category: "Accessories",
    supplier: "Clipsal",
    unitLabel: "Each",
    unitCost: 4.50,
    notes: "Wall mounting box",
  },
  
  // Fans
  {
    name: "Ceiling Fan 3 Blade 1200mm",
    category: "Fans",
    supplier: "Martec/Hunter",
    unitLabel: "Each",
    unitCost: 180.00,
    notes: "Standard ceiling fan",
  },
  {
    name: "Ceiling Fan with Light 1300mm",
    category: "Fans",
    supplier: "Martec/Brilliant",
    unitLabel: "Each",
    unitCost: 280.00,
    notes: "Fan with LED light kit",
  },
  {
    name: "Exhaust Fan 150mm",
    category: "Fans",
    supplier: "HPM/Martec",
    unitLabel: "Each",
    unitCost: 85.00,
    notes: "Bathroom/kitchen exhaust",
  },
  {
    name: "Exhaust Fan 200mm",
    category: "Fans",
    supplier: "HPM/Martec",
    unitLabel: "Each",
    unitCost: 120.00,
    notes: "Large exhaust fan",
  },
];

// ============================================================================
// AUSTRALIAN COMPLIANCE INFORMATION
// ============================================================================

export const ELECTRICIAN_COMPLIANCE = {
  // Critical: Licensing Requirements
  licensing: {
    requirement: "ALL electrical work in Australia must be performed by a licensed electrician",
    stateAuthorities: {
      WA: "Building and Energy (Electrical Licensing)",
      NSW: "NSW Fair Trading",
      VIC: "Energy Safe Victoria (ESV)",
      QLD: "Electrical Safety Office (ESO)",
      SA: "Office of the Technical Regulator (OTR)",
      TAS: "Consumer Building and Occupational Services (CBOS)",
      NT: "NT WorkSafe",
      ACT: "Access Canberra",
    },
    licenseTypes: [
      "Electrician (full license) - A Grade",
      "Electrical Contractor License",
      "Restricted Electrical License (specific work only)",
      "Electrical Apprentice (supervised work only)",
    ],
  },

  // Certificate of Compliance
  certificateOfCompliance: {
    requirement: "Certificate of Compliance (CoC) required for all notifiable electrical work",
    notifiableWork: [
      "New electrical installations",
      "Alterations to existing installations",
      "Additions to existing circuits",
      "Switchboard modifications",
      "Replacement of switchboard",
      "Installation of RCDs/safety switches",
    ],
    nonNotifiable: [
      "Like-for-like replacement of switches/GPOs",
      "Replacement of light fittings (same wattage)",
      "Replacement of ceiling fans",
      "Test and tag",
    ],
    retention: "Certificates must be retained for minimum 5 years",
  },

  // Australian Standards - Wiring Rules
  standards: [
    {
      code: "AS/NZS 3000",
      title: "Electrical installations (Wiring Rules)",
      description: "Primary standard for all electrical installations in Australia",
      mandatory: true,
    },
    {
      code: "AS/NZS 3008",
      title: "Electrical installations - Selection of cables",
      description: "Cable sizing and selection requirements",
      mandatory: true,
    },
    {
      code: "AS/NZS 3012",
      title: "Electrical installations - Construction and demolition sites",
      description: "Temporary electrical installations",
      mandatory: true,
    },
    {
      code: "AS/NZS 3760",
      title: "In-service safety inspection and testing of electrical equipment",
      description: "Test and tag requirements",
      mandatory: false,
    },
    {
      code: "AS 3786",
      title: "Smoke alarms using scattered light, transmitted light or ionization",
      description: "Smoke alarm requirements",
      mandatory: true,
    },
    {
      code: "AS/NZS 3820",
      title: "Essential safety requirements for electrical equipment",
      description: "Equipment safety standards",
      mandatory: true,
    },
  ],

  // RCD (Safety Switch) Requirements
  rcdRequirements: {
    mandatory: "RCDs (safety switches) mandatory on power circuits and lighting circuits in residential",
    maxCircuits: "Maximum 3 final sub-circuits per RCD",
    rating: "30mA trip rating for personal protection",
    newInstallations: "All new installations require RCDs on all circuits",
    existing: "Existing installations require RCDs when modified",
    testing: "RCDs should be tested every 3 months by occupant (test button)",
  },

  // Smoke Alarm Requirements
  smokeAlarmRequirements: {
    standard: "AS 3786 compliant photoelectric smoke alarms",
    newBuildings: "Hardwired interconnected alarms in all new buildings",
    existingRental: "Hardwired or 10-year lithium battery alarms in all rental properties",
    locations: [
      "Every bedroom",
      "Every hallway connecting bedrooms",
      "Every level of multi-storey dwelling",
    ],
    interconnection: "All alarms must be interconnected (wired or wireless)",
  },

  // SafeWork Requirements
  safeWork: {
    requirements: [
      "Isolation and lockout/tagout procedures",
      "Test before touch (voltage testing)",
      "Working on or near live electrical equipment controls",
      "Personal protective equipment (PPE)",
      "Electrical safety training",
      "Risk assessment before work",
    ],
    ppe: [
      "Insulated gloves (class appropriate to voltage)",
      "Safety glasses",
      "Safety footwear",
      "Arc flash protection (where required)",
      "Insulated tools",
    ],
    liveWork: "Live work only permitted when absolutely necessary and with appropriate controls",
  },
};

// ============================================================================
// AI PROMPT ENHANCEMENTS FOR ELECTRICAL
// ============================================================================

export const ELECTRICIAN_AI_CONTEXT = {
  // Trade-specific context for AI document generation
  tradeDescription: "licensed electrical contractor performing domestic and commercial electrical work",
  
  // Common scope items for electrical work
  commonScopeItems: [
    "Supply and install power points",
    "Supply and install light switches",
    "Supply and install LED downlights",
    "Supply and install ceiling fans",
    "Supply and install exhaust fans",
    "Supply and install smoke alarms (AS 3786)",
    "Switchboard upgrade/modification",
    "Install RCD safety switches",
    "Install circuit breakers",
    "Run new circuits",
    "Fault finding and repair",
    "Test and tag portable appliances",
    "Install data points",
    "Install outdoor lighting",
    "Hot water system connection",
    "Air conditioning connection",
    "Oven/cooktop connection",
  ],
  
  // Standard inclusions for electrical quotes
  standardInclusions: [
    "Supply of all electrical materials (as specified)",
    "Licensed electrician labour",
    "All wiring and connections",
    "Testing and commissioning",
    "Certificate of Compliance (CoC) for notifiable work",
    "Cleanup of work areas",
    "Workmanship warranty (typically 12 months)",
    "Manufacturer warranties on products",
  ],
  
  // Standard exclusions for electrical quotes
  standardExclusions: [
    "Building work/plastering (making good)",
    "Painting (after installation)",
    "Structural modifications",
    "Asbestos removal",
    "Plumbing work",
    "Permit fees (if required)",
    "Metering authority fees",
    "After-hours work (unless specified)",
  ],
  
  // Safety considerations for SWMS
  safetyHazards: [
    "Electric shock (primary hazard)",
    "Arc flash/arc blast",
    "Working at heights (ceiling work)",
    "Confined spaces (roof cavities, subfloors)",
    "Asbestos exposure (older buildings)",
    "Manual handling (switchboards, cable)",
    "Cuts from cable/sharp edges",
    "Eye injury from debris",
    "Heat stress (roof cavities)",
  ],
  
  // Safety controls required
  safetyControls: [
    "Isolation and lockout/tagout (LOTO)",
    "Test before touch - voltage testing",
    "Insulated tools and PPE",
    "Rescue equipment available",
    "CPR-trained personnel on site",
    "Permit to work for live work",
    "Appropriate lighting in work area",
    "Asbestos check before penetrations",
  ],
  
  // Maintenance guidance
  maintenanceGuidance: {
    rcds: {
      frequency: "Test RCD push-button monthly",
      action: "Press test button - should trip immediately",
      professional: "Annual inspection by licensed electrician recommended",
    },
    smokeAlarms: {
      frequency: "Test monthly, replace batteries annually (if applicable)",
      replacement: "Replace all smoke alarms every 10 years",
      cleaning: "Vacuum/dust annually to prevent false alarms",
    },
    switchboard: {
      inspection: "Visual inspection annually for signs of damage/heat",
      professional: "Thermal scan every 3-5 years for commercial",
    },
    general: {
      signs: "Watch for flickering lights, warm switches, burning smell",
      action: "Isolate and call electrician immediately if issues found",
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default rate template for electricians
 */
export function getElectricianDefaultRateTemplate() {
  return {
    name: "Electrician - Standard Rates",
    tradeType: "Electrician",
    propertyType: null,
    hourlyRate: ELECTRICIAN_DEFAULT_RATES.hourlyRate,
    helperHourlyRate: ELECTRICIAN_DEFAULT_RATES.helperHourlyRate,
    dayRate: ELECTRICIAN_DEFAULT_RATES.dayRate,
    calloutFee: ELECTRICIAN_DEFAULT_RATES.calloutFee,
    minCharge: ELECTRICIAN_DEFAULT_RATES.minCharge,
    ratePerM2Interior: null, // Not typically used
    ratePerM2Exterior: null,
    ratePerLmTrim: null,
    materialMarkupPercent: ELECTRICIAN_DEFAULT_RATES.materialMarkupPercent,
    isDefault: true,
  };
}

/**
 * Get electrician-specific AI system prompt enhancement
 */
export function getElectricianSystemPromptContext(): string {
  return `
Trade-Specific Context (Electrician):
- This is electrical work in Australia - MUST be performed by licensed electrician
- All electrical work must comply with AS/NZS 3000 (Wiring Rules)
- Certificate of Compliance (CoC) required for notifiable work
- RCDs (safety switches) mandatory on all circuits in residential
- Smoke alarms must comply with AS 3786 - photoelectric type required
- State licensing requirements apply - license number should be on all documentation
- SAFETY CRITICAL: Electrical hazards include shock, arc flash, fire
- Standard isolation and test-before-touch procedures required
- Common brands: Clipsal, Schneider, HPM, Hager
- Pricing typically per point plus materials
- Workmanship warranty typically 12 months
`;
}

/**
 * Calculate estimated electrical materials for common jobs
 */
export function estimateElectricalMaterials(params: {
  powerPointCount?: number;
  lightPointCount?: number;
  downlightCount?: number;
  smokeAlarmCount?: number;
  dataPointCount?: number;
  switchboardUpgrade?: boolean;
  newCircuits?: number;
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  // Power points
  if (params.powerPointCount) {
    materials.push({ item: "Clipsal Iconic Double GPO White", quantity: params.powerPointCount, unit: "each" });
    // Estimate cable - approx 15m per point average
    const cableRolls = Math.ceil((params.powerPointCount * 15) / 100);
    materials.push({ item: "TPS Cable 2.5mm² Twin + Earth", quantity: cableRolls, unit: "rolls" });
    materials.push({ item: "Back Box Flush Mount", quantity: params.powerPointCount, unit: "each" });
  }
  
  // Light points
  if (params.lightPointCount) {
    materials.push({ item: "Clipsal Iconic Single Switch White", quantity: params.lightPointCount, unit: "each" });
    const lightCableRolls = Math.ceil((params.lightPointCount * 12) / 100);
    materials.push({ item: "TPS Cable 1.5mm² Twin + Earth", quantity: lightCableRolls, unit: "rolls" });
  }
  
  // Downlights
  if (params.downlightCount) {
    materials.push({ item: "LED Downlight 10W Tri-Colour", quantity: params.downlightCount, unit: "each" });
  }
  
  // Smoke alarms
  if (params.smokeAlarmCount) {
    materials.push({ item: "Photoelectric Smoke Alarm 240V", quantity: params.smokeAlarmCount, unit: "each" });
  }
  
  // Data points
  if (params.dataPointCount) {
    materials.push({ item: "Data Cable Cat6", quantity: Math.ceil((params.dataPointCount * 30) / 305), unit: "boxes" });
  }
  
  // Switchboard upgrade
  if (params.switchboardUpgrade) {
    materials.push({ item: "Switchboard Enclosure 18 Pole", quantity: 1, unit: "each" });
    materials.push({ item: "Main Switch 63A 2 Pole", quantity: 1, unit: "each" });
    materials.push({ item: "RCD 2 Pole 25A 30mA", quantity: 3, unit: "each" });
    materials.push({ item: "Surge Protector Module", quantity: 1, unit: "each" });
  }
  
  // New circuits
  if (params.newCircuits) {
    const mcbCount = params.newCircuits;
    materials.push({ item: "MCB 1 Pole 20A", quantity: mcbCount, unit: "each" });
  }
  
  // General consumables
  const totalPoints = (params.powerPointCount || 0) + (params.lightPointCount || 0) + 
                      (params.downlightCount || 0) + (params.dataPointCount || 0);
  if (totalPoints > 0) {
    materials.push({ item: "PVC Conduit 20mm", quantity: Math.ceil(totalPoints / 2), unit: "lengths" });
    materials.push({ item: "Junction Box 4x4", quantity: Math.ceil(totalPoints / 3), unit: "each" });
  }
  
  return materials;
}

/**
 * Get Certificate of Compliance requirements
 */
export function getCoCRequirements(workType: string): {
  required: boolean;
  reason: string;
  timeframe: string;
} {
  const notifiableWork = [
    "new installation",
    "switchboard",
    "rcd",
    "safety switch",
    "new circuit",
    "alteration",
    "addition",
    "meter",
  ];
  
  const isNotifiable = notifiableWork.some(work => 
    workType.toLowerCase().includes(work)
  );
  
  if (isNotifiable) {
    return {
      required: true,
      reason: "This is notifiable electrical work under state regulations",
      timeframe: "CoC must be issued within the timeframe specified by state regulations (typically 2-7 days)",
    };
  }
  
  return {
    required: false,
    reason: "This appears to be non-notifiable work (like-for-like replacement)",
    timeframe: "No CoC required, but records should be kept",
  };
}

/**
 * Get smoke alarm requirements for property type
 */
export function getSmokeAlarmRequirements(params: {
  propertyType: "residential" | "rental" | "commercial";
  bedrooms: number;
  levels: number;
  isNewBuild: boolean;
}): {
  minimumAlarms: number;
  type: string;
  interconnection: string;
  locations: string[];
} {
  const locations: string[] = [];
  
  // Every bedroom
  for (let i = 1; i <= params.bedrooms; i++) {
    locations.push(`Bedroom ${i}`);
  }
  
  // Hallways connecting bedrooms
  locations.push("Hallway connecting bedrooms");
  
  // Every level
  if (params.levels > 1) {
    for (let i = 2; i <= params.levels; i++) {
      locations.push(`Level ${i} hallway/landing`);
    }
  }
  
  const minimumAlarms = locations.length;
  
  let type = "Photoelectric smoke alarm (AS 3786)";
  let interconnection = "Interconnected (wired or wireless RF)";
  
  if (params.isNewBuild || params.propertyType === "rental") {
    type = "Hardwired photoelectric smoke alarm (AS 3786)";
    interconnection = "Hardwired interconnected (or wireless RF for existing)";
  }
  
  return {
    minimumAlarms,
    type,
    interconnection,
    locations,
  };
}
