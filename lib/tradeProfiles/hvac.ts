/**
 * HVAC Technician Trade Profile Configuration for OMNEXORA
 * 
 * This module provides HVAC-specific configuration including:
 * - Default rates and pricing for air conditioning and refrigeration work
 * - Common equipment and materials with Australian pricing (Daikin, Fujitsu, Mitsubishi)
 * - Compliance and safety information (ARC licensing, refrigerant handling)
 * - Document templates and AI prompt enhancements
 * 
 * CRITICAL: HVAC work involving refrigerants MUST be performed by ARC licensed technicians.
 * 
 * Compliance References:
 * - Australian Refrigeration Council (ARC) licensing
 * - AS/NZS 5149 - Refrigerating systems and heat pumps
 * - AS/NZS 3000 - Electrical installations (for electrical connections)
 * - Ozone Protection and Synthetic Greenhouse Gas Management Act
 * - State-based SafeWork regulations
 */

// ============================================================================
// HVAC DEFAULT RATES (Australian market rates 2024-2026)
// ============================================================================

export const HVAC_DEFAULT_RATES = {
  // Hourly rates
  hourlyRate: 95, // Licensed HVAC technician hourly rate
  helperHourlyRate: 50, // Trade assistant rate
  dayRate: 750, // Full day rate
  
  // Call-out and service fees
  calloutFee: 120, // Standard call-out fee
  afterHoursCallout: 180, // After-hours/weekend call-out
  emergencyCallout: 250, // Emergency call-out
  minCharge: 180, // Minimum job charge
  
  // Installation rates (labour only - equipment extra)
  ratePerSplitSystemInstall: 650, // Single split system install (labour)
  ratePerMultiHeadInstall: 450, // Per head for multi-split (labour)
  ratePerDuctedInstall: 2500, // Ducted system install (labour, excluding ductwork)
  ratePerCassetteInstall: 850, // Cassette unit install (labour)
  ratePerVRVZoneInstall: 550, // VRV/VRF zone install (labour)
  
  // Per-metre rates
  ratePerMPipework: 45, // Refrigerant pipework per metre
  ratePerMDuctwork: 85, // Flexible ductwork per metre
  ratePerMRigidDuct: 120, // Rigid ductwork per metre
  ratePerMCondensateDrain: 25, // Condensate drain per metre
  ratePerMCableRun: 18, // Electrical cable run per metre
  
  // Service rates
  ratePerServiceResidential: 180, // Standard residential service
  ratePerServiceCommercial: 280, // Commercial unit service
  ratePerGasCharge: 85, // Refrigerant top-up (per kg, excluding gas)
  ratePerLeakTest: 150, // Leak detection test
  ratePerChemicalClean: 280, // Deep chemical clean
  
  // Breakdown/repair rates
  ratePerDiagnostic: 150, // Diagnostic/fault finding
  ratePerCompressorReplace: 450, // Compressor replacement (labour)
  ratePerPCBReplace: 180, // PCB/control board replacement (labour)
  ratePerFanMotorReplace: 150, // Fan motor replacement (labour)
  
  // Material markup
  materialMarkupPercent: 25, // Standard markup on materials/equipment
};

// ============================================================================
// COMMON HVAC MATERIALS AND EQUIPMENT (Australian pricing)
// ============================================================================

export interface HVACMaterial {
  name: string;
  category: string;
  supplier: string;
  unitLabel: string;
  unitCost: number;
  notes: string;
  capacity?: string;
  energyRating?: number;
}

export const HVAC_DEFAULT_MATERIALS: HVACMaterial[] = [
  // Split System Air Conditioners - Residential
  {
    name: "Daikin Cora 2.5kW Split System",
    category: "Split Systems",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 1450.00,
    notes: "Inverter, Wi-Fi, 5-star cooling",
    capacity: "2.5kW cooling / 3.2kW heating",
    energyRating: 5,
  },
  {
    name: "Daikin Cora 3.5kW Split System",
    category: "Split Systems",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 1650.00,
    notes: "Popular bedroom/living size",
    capacity: "3.5kW cooling / 4.0kW heating",
    energyRating: 5,
  },
  {
    name: "Daikin Cora 5.0kW Split System",
    category: "Split Systems",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 1950.00,
    notes: "Medium living areas",
    capacity: "5.0kW cooling / 6.0kW heating",
    energyRating: 4,
  },
  {
    name: "Daikin Cora 7.1kW Split System",
    category: "Split Systems",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 2450.00,
    notes: "Large living areas",
    capacity: "7.1kW cooling / 8.0kW heating",
    energyRating: 3.5,
  },
  {
    name: "Fujitsu Lifestyle 2.5kW Split System",
    category: "Split Systems",
    supplier: "Fujitsu",
    unitLabel: "Unit",
    unitCost: 1350.00,
    notes: "Compact design, quiet operation",
    capacity: "2.5kW cooling / 3.2kW heating",
    energyRating: 5,
  },
  {
    name: "Fujitsu Lifestyle 3.5kW Split System",
    category: "Split Systems",
    supplier: "Fujitsu",
    unitLabel: "Unit",
    unitCost: 1550.00,
    notes: "Energy efficient",
    capacity: "3.5kW cooling / 4.0kW heating",
    energyRating: 5,
  },
  {
    name: "Fujitsu Lifestyle 5.0kW Split System",
    category: "Split Systems",
    supplier: "Fujitsu",
    unitLabel: "Unit",
    unitCost: 1850.00,
    notes: "Medium-large rooms",
    capacity: "5.0kW cooling / 6.0kW heating",
    energyRating: 4,
  },
  {
    name: "Mitsubishi Electric MSZ-AP 2.5kW",
    category: "Split Systems",
    supplier: "Mitsubishi Electric",
    unitLabel: "Unit",
    unitCost: 1500.00,
    notes: "Premium brand, reliable",
    capacity: "2.5kW cooling / 3.2kW heating",
    energyRating: 5,
  },
  {
    name: "Mitsubishi Electric MSZ-AP 5.0kW",
    category: "Split Systems",
    supplier: "Mitsubishi Electric",
    unitLabel: "Unit",
    unitCost: 2100.00,
    notes: "Wi-Fi control, quiet",
    capacity: "5.0kW cooling / 6.0kW heating",
    energyRating: 4,
  },
  {
    name: "Samsung Wind-Free 2.5kW",
    category: "Split Systems",
    supplier: "Samsung",
    unitLabel: "Unit",
    unitCost: 1400.00,
    notes: "Wind-Free cooling technology",
    capacity: "2.5kW cooling / 3.2kW heating",
    energyRating: 5,
  },
  
  // Multi-Split Systems
  {
    name: "Daikin Multi-Split Outdoor 5.2kW (2 head)",
    category: "Multi-Split",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 2800.00,
    notes: "Outdoor unit for 2 indoor heads",
    capacity: "5.2kW",
  },
  {
    name: "Daikin Multi-Split Outdoor 8.0kW (3 head)",
    category: "Multi-Split",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 3800.00,
    notes: "Outdoor unit for 3 indoor heads",
    capacity: "8.0kW",
  },
  {
    name: "Daikin Multi-Split Indoor Wall 2.5kW",
    category: "Multi-Split",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 750.00,
    notes: "Indoor head for multi-split",
    capacity: "2.5kW",
  },
  {
    name: "Daikin Multi-Split Indoor Wall 3.5kW",
    category: "Multi-Split",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 850.00,
    notes: "Indoor head for multi-split",
    capacity: "3.5kW",
  },
  
  // Ducted Systems
  {
    name: "Daikin Ducted 10kW (Outdoor)",
    category: "Ducted Systems",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 4500.00,
    notes: "Small home ducted",
    capacity: "10kW cooling",
  },
  {
    name: "Daikin Ducted 14kW (Outdoor)",
    category: "Ducted Systems",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 5800.00,
    notes: "Medium home ducted",
    capacity: "14kW cooling",
  },
  {
    name: "Daikin Ducted 18kW (Outdoor)",
    category: "Ducted Systems",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 7200.00,
    notes: "Large home ducted",
    capacity: "18kW cooling",
  },
  {
    name: "Fujitsu Ducted 12.5kW",
    category: "Ducted Systems",
    supplier: "Fujitsu",
    unitLabel: "Unit",
    unitCost: 5200.00,
    notes: "Medium ducted system",
    capacity: "12.5kW cooling",
  },
  {
    name: "Actron ESP Plus 14kW",
    category: "Ducted Systems",
    supplier: "Actron",
    unitLabel: "Unit",
    unitCost: 5500.00,
    notes: "Australian made, zone control",
    capacity: "14kW cooling",
  },
  {
    name: "Brivis Ducted 16kW",
    category: "Ducted Systems",
    supplier: "Brivis",
    unitLabel: "Unit",
    unitCost: 6000.00,
    notes: "Popular Australian brand",
    capacity: "16kW cooling",
  },
  
  // Cassette Units
  {
    name: "Daikin Cassette 5.0kW",
    category: "Cassette Units",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 2800.00,
    notes: "4-way ceiling cassette",
    capacity: "5.0kW cooling",
  },
  {
    name: "Daikin Cassette 7.1kW",
    category: "Cassette Units",
    supplier: "Daikin",
    unitLabel: "Unit",
    unitCost: 3400.00,
    notes: "Commercial grade",
    capacity: "7.1kW cooling",
  },
  {
    name: "Mitsubishi Cassette 5.0kW",
    category: "Cassette Units",
    supplier: "Mitsubishi Electric",
    unitLabel: "Unit",
    unitCost: 2900.00,
    notes: "4-way blow pattern",
    capacity: "5.0kW cooling",
  },
  
  // Refrigerant Pipework
  {
    name: "Copper Pipe 1/4\" (6.35mm) - 15m Coil",
    category: "Pipework",
    supplier: "Refrigeration supplies",
    unitLabel: "Coil",
    unitCost: 85.00,
    notes: "Liquid line small systems",
  },
  {
    name: "Copper Pipe 3/8\" (9.52mm) - 15m Coil",
    category: "Pipework",
    supplier: "Refrigeration supplies",
    unitLabel: "Coil",
    unitCost: 120.00,
    notes: "Suction line small/liquid larger",
  },
  {
    name: "Copper Pipe 1/2\" (12.7mm) - 15m Coil",
    category: "Pipework",
    supplier: "Refrigeration supplies",
    unitLabel: "Coil",
    unitCost: 165.00,
    notes: "Suction line medium systems",
  },
  {
    name: "Copper Pipe 5/8\" (15.88mm) - 15m Coil",
    category: "Pipework",
    supplier: "Refrigeration supplies",
    unitLabel: "Coil",
    unitCost: 220.00,
    notes: "Suction line larger systems",
  },
  {
    name: "Pipe Insulation 1/4\" (25m roll)",
    category: "Pipework",
    supplier: "Insulation supplies",
    unitLabel: "Roll",
    unitCost: 45.00,
    notes: "Armaflex type insulation",
  },
  {
    name: "Pipe Insulation 3/8\" (25m roll)",
    category: "Pipework",
    supplier: "Insulation supplies",
    unitLabel: "Roll",
    unitCost: 55.00,
    notes: "Standard thickness insulation",
  },
  {
    name: "Pipe Insulation 1/2\" (25m roll)",
    category: "Pipework",
    supplier: "Insulation supplies",
    unitLabel: "Roll",
    unitCost: 65.00,
    notes: "Larger pipe insulation",
  },
  
  // Refrigerants
  {
    name: "R32 Refrigerant (9kg Cylinder)",
    category: "Refrigerants",
    supplier: "Refrigerant suppliers",
    unitLabel: "Cylinder",
    unitCost: 280.00,
    notes: "Modern split systems (requires ARC license)",
  },
  {
    name: "R410A Refrigerant (11.3kg Cylinder)",
    category: "Refrigerants",
    supplier: "Refrigerant suppliers",
    unitLabel: "Cylinder",
    unitCost: 450.00,
    notes: "Common residential (requires ARC license)",
  },
  {
    name: "R134a Refrigerant (13.6kg Cylinder)",
    category: "Refrigerants",
    supplier: "Refrigerant suppliers",
    unitLabel: "Cylinder",
    unitCost: 380.00,
    notes: "Automotive/chillers (requires ARC license)",
  },
  {
    name: "R404A Refrigerant (10.9kg Cylinder)",
    category: "Refrigerants",
    supplier: "Refrigerant suppliers",
    unitLabel: "Cylinder",
    unitCost: 520.00,
    notes: "Commercial refrigeration (requires ARC license)",
  },
  
  // Ductwork
  {
    name: "Flexible Duct 150mm (6m length)",
    category: "Ductwork",
    supplier: "DERA/similar",
    unitLabel: "Length",
    unitCost: 45.00,
    notes: "Insulated flexible duct",
  },
  {
    name: "Flexible Duct 200mm (6m length)",
    category: "Ductwork",
    supplier: "DERA/similar",
    unitLabel: "Length",
    unitCost: 55.00,
    notes: "Medium supply duct",
  },
  {
    name: "Flexible Duct 250mm (6m length)",
    category: "Ductwork",
    supplier: "DERA/similar",
    unitLabel: "Length",
    unitCost: 65.00,
    notes: "Larger supply duct",
  },
  {
    name: "Flexible Duct 300mm (6m length)",
    category: "Ductwork",
    supplier: "DERA/similar",
    unitLabel: "Length",
    unitCost: 75.00,
    notes: "Main trunk/return",
  },
  {
    name: "Ceiling Diffuser 150mm",
    category: "Ductwork",
    supplier: "Duct supplies",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Standard ceiling outlet",
  },
  {
    name: "Ceiling Diffuser 200mm",
    category: "Ductwork",
    supplier: "Duct supplies",
    unitLabel: "Each",
    unitCost: 42.00,
    notes: "Medium ceiling outlet",
  },
  {
    name: "Return Air Grille 450x450",
    category: "Ductwork",
    supplier: "Duct supplies",
    unitLabel: "Each",
    unitCost: 55.00,
    notes: "Standard return grille",
  },
  {
    name: "Plenum Box 150mm",
    category: "Ductwork",
    supplier: "Duct supplies",
    unitLabel: "Each",
    unitCost: 28.00,
    notes: "Duct to diffuser connection",
  },
  {
    name: "Zone Damper Motor",
    category: "Ductwork",
    supplier: "Zone control suppliers",
    unitLabel: "Each",
    unitCost: 180.00,
    notes: "Motorised zone damper",
  },
  
  // Drainage
  {
    name: "Condensate Pump",
    category: "Drainage",
    supplier: "DERA/Aspen",
    unitLabel: "Each",
    unitCost: 185.00,
    notes: "Mini condensate pump",
  },
  {
    name: "PVC Condensate Pipe 20mm (4m)",
    category: "Drainage",
    supplier: "Plumbing supplies",
    unitLabel: "Length",
    unitCost: 8.00,
    notes: "Condensate drain pipe",
  },
  {
    name: "Condensate Drain Trap",
    category: "Drainage",
    supplier: "HVAC supplies",
    unitLabel: "Each",
    unitCost: 12.00,
    notes: "P-trap for condensate",
  },
  
  // Electrical
  {
    name: "Isolator Switch 20A",
    category: "Electrical",
    supplier: "Electrical supplies",
    unitLabel: "Each",
    unitCost: 28.00,
    notes: "AC isolator switch",
  },
  {
    name: "Isolator Switch 32A",
    category: "Electrical",
    supplier: "Electrical supplies",
    unitLabel: "Each",
    unitCost: 35.00,
    notes: "Larger unit isolator",
  },
  {
    name: "Cable 2.5mm² Twin + Earth (per m)",
    category: "Electrical",
    supplier: "Electrical supplies",
    unitLabel: "Lin m",
    unitCost: 3.50,
    notes: "Standard AC power cable",
  },
  {
    name: "Cable 4mm² Twin + Earth (per m)",
    category: "Electrical",
    supplier: "Electrical supplies",
    unitLabel: "Lin m",
    unitCost: 5.50,
    notes: "Larger unit power cable",
  },
  {
    name: "Communication Cable (per m)",
    category: "Electrical",
    supplier: "Electrical supplies",
    unitLabel: "Lin m",
    unitCost: 2.00,
    notes: "Indoor/outdoor comms",
  },
  
  // Mounting and Brackets
  {
    name: "Split System Wall Bracket",
    category: "Mounting",
    supplier: "HVAC supplies",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Indoor unit mounting bracket",
  },
  {
    name: "Outdoor Unit Floor Stand",
    category: "Mounting",
    supplier: "HVAC supplies",
    unitLabel: "Each",
    unitCost: 65.00,
    notes: "Ground mount bracket",
  },
  {
    name: "Outdoor Unit Wall Bracket",
    category: "Mounting",
    supplier: "HVAC supplies",
    unitLabel: "Each",
    unitCost: 120.00,
    notes: "Wall mount for outdoor unit",
  },
  {
    name: "Anti-Vibration Mounts (set of 4)",
    category: "Mounting",
    supplier: "HVAC supplies",
    unitLabel: "Set",
    unitCost: 25.00,
    notes: "Vibration dampening feet",
  },
  {
    name: "Pipe Cover/Duct 75mm (2m)",
    category: "Mounting",
    supplier: "HVAC supplies",
    unitLabel: "Length",
    unitCost: 18.00,
    notes: "External pipe cover",
  },
  
  // Consumables and Service Parts
  {
    name: "Nitrogen Cylinder Hire",
    category: "Consumables",
    supplier: "Gas supplies",
    unitLabel: "Cylinder",
    unitCost: 85.00,
    notes: "For pressure testing/brazing",
  },
  {
    name: "Silver Brazing Rods (per kg)",
    category: "Consumables",
    supplier: "Welding supplies",
    unitLabel: "kg",
    unitCost: 180.00,
    notes: "15% silver content",
  },
  {
    name: "Flare Nuts (assorted pack)",
    category: "Consumables",
    supplier: "HVAC supplies",
    unitLabel: "Pack",
    unitCost: 35.00,
    notes: "Various sizes",
  },
  {
    name: "Coil Cleaner 5L",
    category: "Service",
    supplier: "HVAC supplies",
    unitLabel: "Drum",
    unitCost: 65.00,
    notes: "Alkaline coil cleaner",
  },
  {
    name: "Filter Drier 1/4\"",
    category: "Service",
    supplier: "Refrigeration supplies",
    unitLabel: "Each",
    unitCost: 28.00,
    notes: "System moisture removal",
  },
  {
    name: "Air Filter (standard size)",
    category: "Service",
    supplier: "HVAC supplies",
    unitLabel: "Each",
    unitCost: 18.00,
    notes: "Replacement filter",
  },
  {
    name: "Fan Motor (generic indoor)",
    category: "Spare Parts",
    supplier: "Parts suppliers",
    unitLabel: "Each",
    unitCost: 180.00,
    notes: "Common replacement motor",
  },
  {
    name: "Capacitor Run (various)",
    category: "Spare Parts",
    supplier: "Parts suppliers",
    unitLabel: "Each",
    unitCost: 45.00,
    notes: "Motor run capacitor",
  },
];

// ============================================================================
// AUSTRALIAN COMPLIANCE INFORMATION
// ============================================================================

export const HVAC_COMPLIANCE = {
  // Critical: ARC Licensing Requirements
  arcLicensing: {
    requirement: "Refrigerant handling work MUST be performed by ARC licensed technicians",
    authority: "Australian Refrigeration Council (ARC)",
    licenseTypes: [
      {
        type: "Full Refrigerant Handling License",
        scope: "All refrigerant handling work",
        requirements: "Completed UEENEEK001/002 or equivalent",
      },
      {
        type: "Restricted Refrigerant Handling License",
        scope: "Limited to specific work types",
        requirements: "Trade-specific training",
      },
    ],
    obligations: [
      "Purchase refrigerants only through authorised channels",
      "Maintain records of refrigerant use",
      "Recover refrigerant before system disposal",
      "Report annual refrigerant usage to ARC",
      "Display ARC license number on documentation",
    ],
    penalties: "Significant fines for unlicensed refrigerant handling",
    website: "www.arctick.org",
  },

  // Electrical Requirements
  electricalRequirements: {
    requirement: "Electrical connections must be performed by licensed electrician OR appropriately endorsed HVAC technician",
    endorsements: [
      "Restricted Electrical License (HVAC)",
      "Full Electrician License",
    ],
    connectionTypes: [
      "Hardwired fixed appliance connections",
      "Dedicated circuit installation",
      "Isolator switch installation",
    ],
    notes: "Check state requirements - some require electrician for all fixed wiring",
  },

  // Australian Standards
  standards: [
    {
      code: "AS/NZS 5149",
      title: "Refrigerating systems and heat pumps - Safety and environmental requirements",
      description: "Primary standard for refrigeration safety",
      mandatory: true,
    },
    {
      code: "AS/NZS 3823",
      title: "Performance of electrical appliances - Air conditioners and heat pumps",
      description: "Energy efficiency and performance testing",
      mandatory: true,
    },
    {
      code: "AS/NZS 3000",
      title: "Electrical installations (Wiring Rules)",
      description: "Electrical connection requirements",
      mandatory: true,
    },
    {
      code: "AS 1668.2",
      title: "The use of ventilation and air conditioning in buildings - Mechanical ventilation",
      description: "Ventilation design requirements",
      mandatory: true,
    },
    {
      code: "AS 4254",
      title: "Ductwork for air-handling systems in buildings",
      description: "Ductwork installation standards",
      mandatory: true,
    },
    {
      code: "AS 4426",
      title: "Thermal insulation of pipework, ductwork and equipment",
      description: "Insulation requirements",
      mandatory: false,
    },
  ],

  // Refrigerant Regulations
  refrigerantRegulations: {
    legislation: "Ozone Protection and Synthetic Greenhouse Gas Management Act 1989",
    requirements: [
      "Only ARC licensed persons can handle refrigerants",
      "All refrigerant must be recovered before decommissioning",
      "Records must be kept for 5 years",
      "Annual reporting to ARC required",
      "Import/export of refrigerants controlled",
    ],
    gwpLimits: "Phase-down of high-GWP refrigerants under Kigali Amendment",
    preferredRefrigerants: [
      { type: "R32", gwp: 675, notes: "Preferred for new residential systems" },
      { type: "R290", gwp: 3, notes: "Propane - natural refrigerant" },
      { type: "R744", gwp: 1, notes: "CO2 - natural refrigerant" },
    ],
  },

  // Energy Efficiency Requirements
  energyEfficiency: {
    gems: {
      requirement: "Air conditioners must be registered under GEMS (Greenhouse and Energy Minimum Standards)",
      labels: "Energy Rating Labels mandatory on equipment",
      meps: "Minimum Energy Performance Standards must be met",
    },
    zoning: {
      requirement: "Zoned systems recommended for energy efficiency",
      benefits: "Reduces energy consumption by conditioning only occupied areas",
    },
  },

  // Installation Requirements
  installationRequirements: {
    location: {
      indoor: "Adequate airflow, access for maintenance, no obstruction to return air",
      outdoor: "Adequate ventilation, clearance for airflow, protection from elements",
      noise: "Consider neighbour noise regulations for outdoor unit placement",
    },
    pipework: {
      insulation: "All refrigerant lines must be insulated",
      support: "Adequate pipe supports to prevent vibration/damage",
      penetrations: "Weatherproof all wall/roof penetrations",
    },
    drainage: {
      fall: "Condensate drain must have adequate fall",
      trap: "P-trap required where negative pressure exists",
      termination: "Drain to appropriate discharge point",
    },
    electrical: {
      isolator: "Dedicated isolator required at outdoor unit",
      circuit: "Dedicated circuit required (no other loads)",
      protection: "RCD/safety switch protection required",
    },
  },

  // SafeWork Requirements
  safeWork: {
    requirements: [
      "Working at heights (roof installations)",
      "Manual handling (heavy outdoor units)",
      "Electrical safety",
      "Refrigerant safety (pressure, cold burns)",
      "Brazing/hot work",
      "Confined spaces (roof cavities)",
      "Asbestos awareness (older buildings)",
    ],
    ppe: [
      "Safety glasses",
      "Work gloves",
      "Safety boots",
      "Hearing protection (when required)",
      "Respiratory protection (refrigerants, chemicals)",
      "Height safety equipment (harness, anchor)",
    ],
    refrigerantSafety: {
      hazards: [
        "High pressure release",
        "Cold burns (liquid refrigerant)",
        "Asphyxiation (heavy gases displace oxygen)",
        "Flammability (R32, R290)",
      ],
      controls: [
        "Adequate ventilation",
        "Appropriate PPE",
        "Recovery equipment",
        "Pressure testing procedures",
      ],
    },
  },

  // Warranty Requirements
  warranty: {
    manufacturer: [
      "Daikin: 5 years parts + labour (registered)",
      "Fujitsu: 5 years parts + labour (registered)",
      "Mitsubishi Electric: 5 years parts + labour",
      "Samsung: 5 years compressor, 2 years parts",
    ],
    conditions: [
      "Must be installed by licensed technician",
      "Warranty registration often required",
      "Annual servicing may be required to maintain warranty",
      "Original purchase receipt required",
    ],
    workmanship: "Standard 12-24 months workmanship warranty",
  },
};

// ============================================================================
// AI PROMPT ENHANCEMENTS FOR HVAC
// ============================================================================

export const HVAC_AI_CONTEXT = {
  // Trade-specific context for AI document generation
  tradeDescription: "ARC licensed HVAC technician specialising in air conditioning installation, servicing, and refrigeration work",
  
  // Common scope items for HVAC work
  commonScopeItems: [
    "Supply and install split system air conditioner",
    "Supply and install multi-split system",
    "Supply and install ducted air conditioning",
    "Supply and install cassette unit",
    "Install refrigerant pipework",
    "Install condensate drainage",
    "Install dedicated electrical circuit",
    "Commission and test system",
    "Service/clean existing system",
    "Repair faulty system",
    "Replace faulty compressor",
    "Replace faulty PCB",
    "Regas system (leak detected and repaired)",
    "Install zone control system",
    "Install ductwork",
    "Install ceiling diffusers",
    "Relocate existing system",
    "Decommission and remove system",
  ],
  
  // Standard inclusions for HVAC quotes
  standardInclusions: [
    "Supply of specified equipment",
    "Installation by ARC licensed technician",
    "Refrigerant pipework (as specified length)",
    "Pipe insulation",
    "Condensate drainage",
    "Electrical connection (isolator and cable)",
    "Communication cable",
    "Indoor unit bracket",
    "Outdoor unit stand/bracket",
    "Core holes and penetrations",
    "Commissioning and testing",
    "User instruction",
    "Warranty registration",
    "ARC compliance documentation",
  ],
  
  // Standard exclusions for HVAC quotes
  standardExclusions: [
    "Switchboard upgrade (if required)",
    "Dedicated circuit from switchboard (unless specified)",
    "Asbestos testing/removal",
    "Structural modifications",
    "Ceiling/wall repairs after installation",
    "Painting/finishing",
    "Council/strata approvals",
    "Platform/scaffold hire (extensive work)",
    "Crane hire (heavy equipment)",
    "Additional pipework beyond specified length",
    "Additional drainage runs",
  ],
  
  // System sizing guidelines
  systemSizing: {
    rule: "Approximately 100-150W per m² for cooling (varies by factors)",
    factors: [
      "Room orientation (north/west facing needs more)",
      "Window size and glazing type",
      "Insulation levels",
      "Ceiling height",
      "Number of occupants",
      "Heat-generating appliances",
      "Climate zone",
    ],
    typical: {
      "Small bedroom (12m²)": "2.0-2.5kW",
      "Medium bedroom (16m²)": "2.5-3.5kW",
      "Small living (20m²)": "3.5-5.0kW",
      "Medium living (30m²)": "5.0-6.0kW",
      "Large living (40m²)": "7.1-8.0kW",
      "Open plan (60m²)": "8.0-10.0kW",
    },
  },
  
  // Safety considerations for SWMS
  safetyHazards: [
    "Working at heights (roof installations, ceiling access)",
    "Electrical hazards (high voltage, live circuits)",
    "Refrigerant hazards (pressure, cold burns, asphyxiation)",
    "Hot work (brazing)",
    "Manual handling (heavy equipment)",
    "Confined spaces (roof cavities)",
    "Dust and insulation fibres",
    "Noise (compressors, tools)",
    "Asbestos (older buildings)",
  ],
  
  // Safety controls required
  safetyControls: [
    "ARC licensed technician only for refrigerant work",
    "Electrical isolation and lockout/tagout",
    "Adequate ventilation for refrigerant work",
    "PPE - safety glasses, gloves, appropriate footwear",
    "Height safety equipment where required",
    "Hot work permit and fire safety",
    "Asbestos check before penetrations",
    "Recovery equipment for decommissioning",
  ],
  
  // Maintenance guidance
  maintenanceGuidance: {
    filters: {
      frequency: "Clean filters every 2-4 weeks in heavy use",
      method: "Remove, vacuum or wash, allow to dry before refitting",
      notes: "Dirty filters reduce efficiency and can cause freeze-ups",
    },
    service: {
      frequency: "Professional service annually (minimum)",
      includes: [
        "Clean indoor coil",
        "Clean outdoor coil",
        "Check refrigerant pressures",
        "Check electrical connections",
        "Test operation and temperatures",
        "Clean drain and check for blockages",
      ],
    },
    outdoor: {
      clearance: "Maintain clear space around outdoor unit",
      cleaning: "Hose down outdoor coil periodically",
      vegetation: "Keep plants/debris away from unit",
    },
    ducted: {
      additional: [
        "Check and clean/replace return air filter",
        "Inspect ductwork for damage/disconnection",
        "Clean supply and return grilles",
        "Test zone control operation",
      ],
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default rate template for HVAC technicians
 */
export function getHVACDefaultRateTemplate() {
  return {
    name: "HVAC Technician - Standard Rates",
    tradeType: "HVAC",
    propertyType: null,
    hourlyRate: HVAC_DEFAULT_RATES.hourlyRate,
    helperHourlyRate: HVAC_DEFAULT_RATES.helperHourlyRate,
    dayRate: HVAC_DEFAULT_RATES.dayRate,
    calloutFee: HVAC_DEFAULT_RATES.calloutFee,
    minCharge: HVAC_DEFAULT_RATES.minCharge,
    ratePerM2Interior: null,
    ratePerM2Exterior: null,
    ratePerLmTrim: HVAC_DEFAULT_RATES.ratePerMPipework,
    materialMarkupPercent: HVAC_DEFAULT_RATES.materialMarkupPercent,
    isDefault: true,
  };
}

/**
 * Get HVAC-specific AI system prompt enhancement
 */
export function getHVACSystemPromptContext(): string {
  return `
Trade-Specific Context (HVAC Technician):
- This is HVAC/air conditioning work in Australia
- CRITICAL: Refrigerant work requires ARC (Australian Refrigeration Council) license
- Must comply with AS/NZS 5149 (Refrigerating systems safety)
- Electrical connections may require licensed electrician (state dependent)
- Common brands: Daikin, Fujitsu, Mitsubishi Electric, Samsung, Actron, Brivis
- System types: Split systems, multi-splits, ducted, cassettes, VRV/VRF
- Refrigerants: R32 (modern residential), R410A (common), R134a, R404A (commercial)
- Energy efficiency: GEMS registration, star ratings important
- Sizing: ~100-150W per m² cooling (varies by factors)
- Installation includes: pipework, drainage, electrical, commissioning
- Warranty: Most major brands offer 5 years if registered
- SAFETY: Refrigerant pressure, electrical, working at heights, brazing
- ARC license number must appear on all documentation
`;
}

/**
 * Estimate air conditioner size for a room
 */
export function estimateACSize(params: {
  roomAreaM2: number;
  ceilingHeightM?: number;
  windowAreaM2?: number;
  northOrWestFacing?: boolean;
  insulationLevel?: "poor" | "average" | "good";
  climateZone?: "hot" | "temperate" | "cold";
}): {
  recommendedKW: number;
  minKW: number;
  maxKW: number;
  notes: string[];
} {
  const notes: string[] = [];
  
  // Base calculation: 100-150W per m²
  let baseWatts = params.roomAreaM2 * 125; // Start with 125W/m²
  
  // Adjust for ceiling height (default 2.4m)
  const ceilingHeight = params.ceilingHeightM || 2.4;
  if (ceilingHeight > 2.7) {
    baseWatts *= (ceilingHeight / 2.4);
    notes.push(`High ceiling (${ceilingHeight}m) - increased capacity`);
  }
  
  // Adjust for windows
  if (params.windowAreaM2 && params.windowAreaM2 > params.roomAreaM2 * 0.15) {
    baseWatts *= 1.1;
    notes.push("Large window area - increased capacity");
  }
  
  // Adjust for orientation
  if (params.northOrWestFacing) {
    baseWatts *= 1.15;
    notes.push("North/West facing - increased capacity");
  }
  
  // Adjust for insulation
  const insulationMultiplier = {
    poor: 1.2,
    average: 1.0,
    good: 0.9,
  }[params.insulationLevel || "average"];
  baseWatts *= insulationMultiplier;
  
  // Adjust for climate
  const climateMultiplier = {
    hot: 1.15,
    temperate: 1.0,
    cold: 0.85,
  }[params.climateZone || "temperate"];
  baseWatts *= climateMultiplier;
  
  const recommendedKW = Math.round(baseWatts / 100) / 10; // Round to 0.1kW
  const minKW = Math.round(recommendedKW * 0.85 * 10) / 10;
  const maxKW = Math.round(recommendedKW * 1.15 * 10) / 10;
  
  return {
    recommendedKW,
    minKW,
    maxKW,
    notes,
  };
}

/**
 * Estimate HVAC installation materials
 */
export function estimateHVACMaterials(params: {
  systemType: "split" | "multiSplit" | "ducted" | "cassette";
  capacityKW: number;
  pipeworkLengthM: number;
  numberOfHeads?: number; // For multi-split
  numberOfZones?: number; // For ducted
  floorMounted?: boolean;
}): { item: string; quantity: number; unit: string }[] {
  const materials: { item: string; quantity: number; unit: string }[] = [];
  
  // Determine pipe sizes based on capacity
  let liquidPipeSize = "1/4\"";
  let suctionPipeSize = "3/8\"";
  if (params.capacityKW > 5) {
    liquidPipeSize = "3/8\"";
    suctionPipeSize = "1/2\"";
  }
  if (params.capacityKW > 8) {
    suctionPipeSize = "5/8\"";
  }
  
  // Pipework
  const coilsNeeded = Math.ceil(params.pipeworkLengthM / 15);
  materials.push({ item: `Copper Pipe ${liquidPipeSize} (15m Coil)`, quantity: coilsNeeded, unit: "coils" });
  materials.push({ item: `Copper Pipe ${suctionPipeSize} (15m Coil)`, quantity: coilsNeeded, unit: "coils" });
  
  // Insulation
  const insulationRolls = Math.ceil(params.pipeworkLengthM / 25);
  materials.push({ item: `Pipe Insulation ${liquidPipeSize} (25m roll)`, quantity: insulationRolls, unit: "rolls" });
  materials.push({ item: `Pipe Insulation ${suctionPipeSize} (25m roll)`, quantity: insulationRolls, unit: "rolls" });
  
  // Electrical
  const cableLength = params.pipeworkLengthM + 5; // Extra for runs
  materials.push({ item: params.capacityKW > 5 ? "Cable 4mm² Twin + Earth" : "Cable 2.5mm² Twin + Earth", quantity: Math.ceil(cableLength), unit: "lin m" });
  materials.push({ item: "Communication Cable", quantity: Math.ceil(cableLength), unit: "lin m" });
  materials.push({ item: params.capacityKW > 5 ? "Isolator Switch 32A" : "Isolator Switch 20A", quantity: 1, unit: "each" });
  
  // Drainage
  materials.push({ item: "PVC Condensate Pipe 20mm (4m)", quantity: 2, unit: "lengths" });
  materials.push({ item: "Condensate Drain Trap", quantity: 1, unit: "each" });
  
  // Mounting
  if (params.systemType === "split" || params.systemType === "multiSplit") {
    materials.push({ item: "Split System Wall Bracket", quantity: params.numberOfHeads || 1, unit: "each" });
    if (params.floorMounted) {
      materials.push({ item: "Outdoor Unit Floor Stand", quantity: 1, unit: "each" });
    } else {
      materials.push({ item: "Anti-Vibration Mounts (set of 4)", quantity: 1, unit: "set" });
    }
  }
  
  // Ducted-specific
  if (params.systemType === "ducted" && params.numberOfZones) {
    const zones = params.numberOfZones;
    materials.push({ item: "Flexible Duct 200mm (6m length)", quantity: zones * 2, unit: "lengths" });
    materials.push({ item: "Ceiling Diffuser 200mm", quantity: zones, unit: "each" });
    materials.push({ item: "Plenum Box 150mm", quantity: zones, unit: "each" });
    materials.push({ item: "Return Air Grille 450x450", quantity: 1, unit: "each" });
    materials.push({ item: "Zone Damper Motor", quantity: zones, unit: "each" });
  }
  
  // Pipe cover
  materials.push({ item: "Pipe Cover/Duct 75mm (2m)", quantity: Math.ceil(params.pipeworkLengthM / 4), unit: "lengths" });
  
  // Consumables
  materials.push({ item: "Flare Nuts (assorted pack)", quantity: 1, unit: "pack" });
  
  return materials;
}

/**
 * Get refrigerant type recommendations
 */
export function getRefrigerantInfo(systemType: string): {
  recommended: string;
  alternatives: string[];
  gwp: number;
  notes: string;
} {
  const systemLower = systemType.toLowerCase();
  
  if (systemLower.includes("new") || systemLower.includes("residential") || systemLower.includes("split")) {
    return {
      recommended: "R32",
      alternatives: ["R410A"],
      gwp: 675,
      notes: "R32 is the modern standard for residential systems - lower GWP than R410A",
    };
  }
  
  if (systemLower.includes("commercial") || systemLower.includes("vrf") || systemLower.includes("vrv")) {
    return {
      recommended: "R410A",
      alternatives: ["R32 (newer models)"],
      gwp: 2088,
      notes: "R410A common in commercial - check manufacturer specifications",
    };
  }
  
  if (systemLower.includes("refrigeration") || systemLower.includes("coolroom")) {
    return {
      recommended: "R404A",
      alternatives: ["R134a", "R290 (natural)"],
      gwp: 3922,
      notes: "Commercial refrigeration - consider natural refrigerant alternatives",
    };
  }
  
  return {
    recommended: "R32",
    alternatives: ["R410A"],
    gwp: 675,
    notes: "Modern residential default - verify against equipment specifications",
  };
}

/**
 * Calculate service interval recommendations
 */
export function getServiceRecommendations(params: {
  systemType: "split" | "ducted" | "commercial";
  usage: "residential" | "commercial" | "industrial";
  environment?: "clean" | "dusty" | "coastal";
}): {
  filterClean: string;
  professionalService: string;
  notes: string[];
} {
  const notes: string[] = [];
  
  let filterInterval = "Every 4 weeks during high use";
  let serviceInterval = "Annually";
  
  if (params.usage === "commercial") {
    filterInterval = "Weekly to fortnightly";
    serviceInterval = "Every 6 months";
    notes.push("Commercial use requires more frequent maintenance");
  }
  
  if (params.usage === "industrial") {
    filterInterval = "Weekly";
    serviceInterval = "Quarterly";
    notes.push("Industrial environments require intensive maintenance schedule");
  }
  
  if (params.environment === "dusty") {
    filterInterval = "Weekly";
    notes.push("Dusty environment - increase filter cleaning frequency");
  }
  
  if (params.environment === "coastal") {
    serviceInterval = "Every 6 months";
    notes.push("Coastal environment - outdoor coil requires more frequent cleaning due to salt");
  }
  
  if (params.systemType === "ducted") {
    notes.push("Check return air filter access - may require ladder");
    notes.push("Inspect ductwork connections annually");
  }
  
  return {
    filterClean: filterInterval,
    professionalService: serviceInterval,
    notes,
  };
}
