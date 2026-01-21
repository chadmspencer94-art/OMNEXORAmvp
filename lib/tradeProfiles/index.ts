/**
 * Trade Profiles Index
 * 
 * Central export for all trade-specific configurations.
 * Each trade has its own profile with:
 * - Default rates and pricing
 * - Common materials
 * - Compliance information
 * - AI prompt enhancements
 */

export * from "./plasterer";
export * from "./roofer";
export * from "./electrician";
export * from "./plumber";
export * from "./concreter";
export * from "./carpenter";
export * from "./hvac";
export * from "./flooring";
export * from "./landscaper";

// Trade profile type
export type TradeType = "Painter" | "Plasterer" | "Carpenter" | "Electrician" | "Roofer" | "Plumber" | "Concreter" | "HVAC" | "Flooring" | "Landscaper" | "Other";

// Get trade-specific system prompt context for AI
export function getTradeSystemPromptContext(tradeType: string | null): string {
  switch (tradeType) {
    case "Plasterer":
      const { getPlastererSystemPromptContext } = require("./plasterer");
      return getPlastererSystemPromptContext();
    case "Roofer":
      const { getRooferSystemPromptContext } = require("./roofer");
      return getRooferSystemPromptContext();
    case "Electrician":
      const { getElectricianSystemPromptContext } = require("./electrician");
      return getElectricianSystemPromptContext();
    case "Plumber":
      const { getPlumberSystemPromptContext } = require("./plumber");
      return getPlumberSystemPromptContext();
    case "Concreter":
      const { getConcreterSystemPromptContext } = require("./concreter");
      return getConcreterSystemPromptContext();
    case "Painter":
      return `
Trade-Specific Context (Painter):
- This is a painting job in Australia
- Common work includes: interior painting, exterior painting, preparation, repairs
- Surface types: plasterboard, timber, metal, rendered surfaces
- Paint types: water-based (most common), oil-based (trim work)
- Finishes: Flat/Matt, Low Sheen, Semi-Gloss, Gloss
- Must follow AS 2311 (Guide to painting of buildings)
- Safety: lead paint testing (pre-1970 buildings), working at heights, respiratory protection
`;
    case "Carpenter":
      const { getCarpenterSystemPromptContext } = require("./carpenter");
      return getCarpenterSystemPromptContext();
    case "HVAC":
      const { getHVACSystemPromptContext } = require("./hvac");
      return getHVACSystemPromptContext();
    case "Flooring":
      const { getFlooringSystemPromptContext } = require("./flooring");
      return getFlooringSystemPromptContext();
    case "Landscaper":
      const { getLandscaperSystemPromptContext } = require("./landscaper");
      return getLandscaperSystemPromptContext();
    case "Electrician":
      const { getElectricianSystemPromptContext: getElecContext } = require("./electrician");
      return getElecContext();
    default:
      return `
Trade-Specific Context:
- Australian construction/trades job
- Must comply with relevant Building Code of Australia provisions
- Follow applicable Australian Standards
- Safety: general construction site safety requirements
`;
  }
}

// Trade-specific compliance notes
export function getTradeComplianceNotes(tradeType: string | null): string[] {
  switch (tradeType) {
    case "Plasterer":
      return [
        "AS/NZS 2589 - Gypsum linings application and finishing",
        "AS/NZS 2588 - Gypsum plasterboard product standard",
        "AS 3740 - Waterproofing of wet areas (moisture-resistant board)",
        "Building Code of Australia fire-rating requirements",
      ];
    case "Roofer":
      return [
        "AS 1562.1 - Sheet roof and wall cladding (Metal)",
        "AS 4200.2 - Pliable building membranes and underlays",
        "AS 3959 - Construction in bushfire-prone areas",
        "AS/NZS 3500.3 - Stormwater drainage",
        "Working at Heights regulations (mandatory above 2m)",
        "Building Code of Australia Part 3.5 - Roof cladding",
      ];
    case "Painter":
      return [
        "AS 2311 - Guide to the painting of buildings",
        "Lead paint regulations (pre-1970 buildings)",
        "VOC emissions compliance",
        "Surface preparation standards",
      ];
    case "Carpenter":
      return [
        "AS 1684 - Residential timber-framed construction",
        "AS 1720 - Timber structures",
        "AS 4440 - Nail plated timber roof trusses",
        "AS 1604 - Timber preservative treatment (H-class)",
        "AS 1657 - Stairs, walkways, balustrades",
        "AS 3660.1 - Termite management",
        "Balustrades: 1000mm min height, 125mm max gap",
        "Stairs: Max 190mm riser, min 240mm going",
        "Building Code of Australia structural provisions",
      ];
    case "Electrician":
      return [
        "AS/NZS 3000 - Electrical installations (Wiring Rules)",
        "AS/NZS 3008 - Selection of cables",
        "AS 3786 - Smoke alarms",
        "Certificate of Compliance (CoC) for notifiable work",
        "RCDs mandatory on all residential circuits",
        "State electrical licensing requirements",
        "Isolation and lockout/tagout procedures",
      ];
    case "Plumber":
      return [
        "AS/NZS 3500 - Plumbing and Drainage Code",
        "AS 5601 - Gas installations",
        "WaterMark certification required for all products",
        "WELS water efficiency ratings",
        "Tempering valves (TMV) mandatory in bathrooms",
        "Compliance certificate for notifiable work",
        "State plumbing licensing requirements",
        "Backflow prevention requirements",
      ];
    case "Concreter":
      return [
        "AS 3600 - Concrete structures",
        "AS 2870 - Residential slabs and footings",
        "AS 1379 - Specification and supply of concrete",
        "Site classification (A, S, M, H1, H2, E, P)",
        "Engineer required for H1+ and P class sites",
        "Reinforcement placement and cover requirements",
        "Control joint spacing requirements",
        "Curing requirements (minimum 7 days)",
        "Silica dust and cement burn safety",
      ];
    case "HVAC":
      return [
        "ARC (Australian Refrigeration Council) license required",
        "AS/NZS 5149 - Refrigerating systems safety",
        "AS/NZS 3823 - Air conditioner performance",
        "Ozone Protection and SGG Management Act",
        "Refrigerant purchase/handling records required",
        "GEMS energy efficiency registration",
        "Electrical work may require electrician license",
        "Annual refrigerant reporting to ARC",
      ];
    case "Flooring":
      return [
        "AS 1884 - Resilient flooring installation",
        "AS/NZS 2455 - Carpet installation",
        "AS 4586 - Slip resistance classification",
        "AS 3958.1 - Tile installation",
        "Moisture testing required (concrete slabs)",
        "Expansion gaps mandatory (10mm min)",
        "Asbestos check before old floor removal",
        "Acclimatisation 48-72hrs before install",
      ];
    case "Landscaper":
      return [
        "AS 1926.1 - Pool fencing (1200mm min, self-closing gate)",
        "AS 4678 - Retaining walls (engineering over 600-1000mm)",
        "Tree removal permits (check local council)",
        "Dial Before You Dig (mandatory excavation)",
        "Stormwater - no redirect to neighbours",
        "AS 3959 - Bushfire zone landscaping",
        "Pool fence inspection certificate",
        "Council approval for significant structures",
      ];
    default:
      return [
        "Building Code of Australia",
        "Relevant Australian Standards",
        "State SafeWork requirements",
      ];
  }
}
