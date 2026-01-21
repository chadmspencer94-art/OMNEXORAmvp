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

// Trade profile type
export type TradeType = "Painter" | "Plasterer" | "Carpenter" | "Electrician" | "Roofer" | "Other";

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
      return `
Trade-Specific Context (Carpenter):
- This is a carpentry job in Australia
- Common work includes: framing, doors, windows, decking, cabinetry, trim
- Materials: timber (hardwood/softwood), engineered wood, MDF
- Must comply with Building Code of Australia structural requirements
- Safety: power tool safety, manual handling, working at heights
`;
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
        "Building Code of Australia structural requirements",
        "AS 1684 - Residential timber-framed construction",
        "AS 1720 - Timber structures",
        "Termite management requirements (varies by region)",
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
    default:
      return [
        "Building Code of Australia",
        "Relevant Australian Standards",
        "State SafeWork requirements",
      ];
  }
}
