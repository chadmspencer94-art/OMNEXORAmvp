/**
 * Document Template Engine Types
 * 
 * Defines the schema for compliance-ready document templates.
 * Templates are JSON files that define document structure, fields, and OVIS checks.
 */

export type DocType = 
  | "SWMS" 
  | "PAYMENT_CLAIM_WA" 
  | "TOOLBOX_TALK"
  | "VARIATION_CHANGE_ORDER"
  | "EXTENSION_OF_TIME"
  | "PROGRESS_CLAIM_TAX_INVOICE"
  | "HANDOVER_PRACTICAL_COMPLETION"
  | "MAINTENANCE_CARE_GUIDE";

export type FieldType = 
  | "text" 
  | "textarea" 
  | "date" 
  | "select" 
  | "multiSelect" 
  | "currency" 
  | "number";

export type OvisSeverity = "low" | "medium" | "high";

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // For select/multiSelect
  defaultValue?: string | number;
  dataPath?: string; // Path in job data (e.g., "jobTitle", "clientName")
}

export interface TableColumn {
  id: string;
  label: string;
  width?: number; // Percentage
  type?: FieldType;
}

export interface Table {
  id: string;
  columns: TableColumn[];
  rowsKey: string; // Path to array in data (e.g., "hazards", "tasks")
  minRows?: number;
}

export interface Section {
  id: string;
  title: string;
  fields?: Field[];
  table?: Table;
  order?: number;
}

export interface OvisCheck {
  id: string;
  severity: OvisSeverity;
  rule: string; // Simple DSL: exists(path), empty(path), len(path) < N, equals(path, value)
  message: string;
}

export interface DocumentTemplate {
  schemaVersion: string;
  jurisdiction: string; // e.g., "AU-WA", "AU"
  docType: DocType;
  title: string;
  disclaimer: string; // Must include draft/review required language
  sections: Section[];
  ovisChecks: OvisCheck[];
}

/**
 * Render model - the processed template + data ready for UI/PDF rendering
 */
export interface RenderField {
  id: string;
  label: string;
  type: FieldType;
  value: string | number | null;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface RenderTableRow {
  [columnId: string]: string | number | null;
}

export interface RenderTable {
  id: string;
  columns: TableColumn[];
  rows: RenderTableRow[];
  minRows: number;
}

export interface RenderSection {
  id: string;
  title: string;
  fields?: RenderField[];
  table?: RenderTable;
}

export interface RenderModel {
  docType: DocType;
  title: string;
  disclaimer: string;
  recordId: string;
  timestamp: string;
  sections: RenderSection[];
  ovisWarnings: Array<{
    id: string;
    severity: OvisSeverity;
    message: string;
  }>;
}

/**
 * Job data structure for merging into templates
 */
export interface JobData {
  jobId?: string;
  jobTitle?: string;
  tradeType?: string;
  propertyType?: string;
  address?: string;
  clientName?: string;
  clientEmail?: string;
  businessName?: string;
  abn?: string;
  createdAt?: string;
  notes?: string;
  // Materials pricing fields
  materialsSubtotal?: number | null;
  materialsMarkupTotal?: number | null;
  materialsTotal?: number | null;
  aiQuote?: string | any;
  aiMaterials?: string;
  materialsOverrideText?: string | null;
  [key: string]: any; // Allow additional fields
}

/**
 * Document lifecycle status
 */
export type DocumentStatus = "DRAFT" | "CONFIRMED" | "ISSUED";/**
 * Document audience for rendering
 * - INTERNAL: Shows AI/OVIS warnings and disclaimers
 * - CLIENT: Professional client-facing export with business header, no AI warnings
 */
export type DocumentAudience = "INTERNAL" | "CLIENT";/**
 * Business issuer profile for document headers
 */
export interface IssuerProfile {
  legalName: string;          // Required: Business legal name
  tradingName?: string;       // Optional: Trading as / DBA name
  abn?: string;               // Optional but required for tax invoices
  email?: string;             // Business contact email
  phone?: string;             // Business contact phone
  addressLine1?: string;      // Street address
  addressLine2?: string;      // Unit/suite/building
  suburb?: string;            // City/suburb
  state?: string;             // State/province
  postcode?: string;          // Postal code
  logoUrl?: string;           // Business logo URL
  gstRegistered?: boolean;    // Whether registered for GST
}/**
 * Validation result for issuer profile
 */
export interface IssuerValidationResult {
  isValid: boolean;
  missingRequired: string[];      // Fields that must be filled
  missingRecommended: string[];   // Fields that should be filled
  warnings: string[];             // Warning messages
  canIssue: boolean;              // Whether document can be issued
}/**
 * Extended RenderModel with issuer and audience info
 */
export interface RenderModelExtended extends RenderModel {
  issuer?: IssuerProfile;
  audience?: DocumentAudience;
  status?: DocumentStatus;
  issuedAt?: string;
  issuedRecordId?: string;
}