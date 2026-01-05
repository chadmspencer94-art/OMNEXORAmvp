# Document Templates

This directory contains JSON templates for compliance-ready documents used in the OMNEXORA document engine.

## Template Structure

Each template follows the schema defined in `/lib/docEngine/types.ts`:

- `schemaVersion`: Version of the template schema (e.g., "1.0")
- `jurisdiction`: Legal jurisdiction (e.g., "AU-WA", "AU")
- `docType`: Document type ("SWMS" | "PAYMENT_CLAIM_WA" | "TOOLBOX_TALK")
- `title`: Document title
- `disclaimer`: Required disclaimer text (must mention "draft" or "review required")
- `sections`: Array of document sections with fields and/or tables
- `ovisChecks`: Array of OVIS checks (warnings/flags)

## Adding a New Template

1. Create a new JSON file following the existing template structure
2. Use `validateTemplate()` from `/lib/docEngine/validateTemplate.ts` to validate
3. Add the template to the template loader in `/lib/docEngine/loadTemplate.ts`
4. Update the `DocType` type in `types.ts` if adding a new document type

## Field Types

- `text`: Single-line text input
- `textarea`: Multi-line text input
- `date`: Date picker
- `select`: Single selection dropdown
- `multiSelect`: Multiple selection dropdown
- `currency`: Currency amount
- `number`: Numeric value

## OVIS Rules

OVIS rules use a simple DSL:

- `exists(path)` - Checks if value exists and is not empty
- `empty(path)` - Checks if value is empty/null
- `len(path) < N` - Checks if length is less than N
- `len(path) === N` - Checks if length equals N
- `equals(path, value)` - Checks if value equals given value

## Data Paths

Fields can reference job data using `dataPath`:

- `jobTitle` - Job title
- `clientName` - Client name
- `address` - Job address
- `tradeType` - Trade type
- `businessName` - Business name
- `abn` - ABN
- Custom paths using dot notation (e.g., `metadata.customField`)

## Important Notes

- All templates must include disclaimers stating documents are drafts requiring review
- Templates do NOT assert compliance or certification
- OVIS checks are warnings only, not assertions of compliance
- Templates are structure-only - they define fields, not content validation

