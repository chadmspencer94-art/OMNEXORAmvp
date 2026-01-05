# Document Engine V1 Implementation Summary

## Overview
Implemented a template-driven document generation system for Australian construction documents with pre-filled, editable drafts, auto-save, and PDF export.

## Feature Flag
- **Environment Variable**: `DOC_ENGINE_V1=true`
- **Location**: `lib/featureFlags.ts`
- **Behavior**: When enabled, uses new template-driven editor. When disabled, falls back to existing behavior.

## Files Created

### Database Schema
- **`prisma/schema.prisma`**: Added `DocumentDraft` model
  - Fields: `id`, `jobId`, `docType`, `dataJson`, `createdAt`, `updatedAt`
  - Unique constraint: `(jobId, docType)`

### Prefill Mappers (`lib/docEngine/prefill/`)
- **`mapCommon.ts`**: Maps common fields (company, client, job, dates)
- **`mapVariation.ts`**: Maps Variation/Change Order fields
- **`mapEot.ts`**: Maps Extension of Time fields
- **`mapInvoice.ts`**: Maps Progress Claim/Tax Invoice fields
- **`mapHandover.ts`**: Maps Handover & Practical Completion fields
- **`mapMaintenance.ts`**: Maps Maintenance & Care Guide fields
- **`index.ts`**: Exports all mappers

### API Routes (`app/api/docs/`)
- **`draft/route.ts`**: GET/POST endpoints for draft persistence
  - GET: `/api/docs/draft?jobId=...&docType=...`
  - POST: `/api/docs/draft` (upsert by jobId+docType)
- **`prefill/route.ts`**: POST endpoint to generate pre-filled document models
  - POST: `/api/docs/prefill` (generates model from job data)

### UI Components (`app/components/docs/`)
- **`DocEditor.tsx`**: Main document editor component
  - Full-screen editor with auto-save (800ms debounce)
  - OVIS warnings display
  - "Regenerate from Job Pack" button (non-destructive merge)
  - Draft status indicator
  - Mobile-friendly layout

### Updated Files
- **`app/jobs/[id]/JobDocumentsSection.tsx`**: 
  - Integrated `DocEditor` when `DOC_ENGINE_V1` is enabled
  - Maps `DocumentType` to `DocType` for template engine
  - Falls back to old editor when flag is disabled

## Document Types Supported
1. **Variation / Change Order** (`VARIATION_CHANGE_ORDER`)
2. **Extension of Time** (`EXTENSION_OF_TIME`)
3. **Progress Claim / Tax Invoice** (`PROGRESS_CLAIM_TAX_INVOICE`)
4. **Handover & Practical Completion** (`HANDOVER_PRACTICAL_COMPLETION`)
5. **Maintenance & Care Guide** (`MAINTENANCE_CARE_GUIDE`)

## Key Features

### Prefill Logic
- **Common fields**: Company details (name, ABN, address, email), client details, job details, dates
- **Doc-specific**: Auto-numbering (VAR-001, EOT-001, INV-0001), pricing snapshots, scope references
- **Non-destructive merge**: "Regenerate" only fills empty fields, preserves user edits

### Draft Persistence
- Drafts stored in `document_drafts` table (Prisma)
- Auto-save on 800ms debounce
- Loads existing draft on document open
- Falls back to generation if no draft exists

### OVIS Checks
- Warning system for missing/incomplete data
- Evaluates rules: `exists()`, `empty()`, `len() < N`, `equals()`
- Displayed as warnings only (not certification)
- Info tooltip explains OVIS purpose

### PDF Export
- Uses existing `/api/docs/render` endpoint
- Matches preview exactly
- Includes disclaimer, Record ID (OX-<DOC>-YYYYMMDD-XXXXXX), timestamp
- Footer on each page

## Safety/Legal Compliance
- ✅ Never uses: "verified", "certified", "approved", "guaranteed compliant"
- ✅ Uses only: "OVIS checks" (warnings), "Draft – Review required"
- ✅ Every preview + PDF shows disclaimer: "Draft generated from user inputs. Review required. Not certified or verified."
- ✅ No invented legal/contract clauses
- ✅ Documents are "contract-aligned format" only

## Database Migration

Run the migration to create the `document_drafts` table:

```bash
npx prisma migrate dev --name add_document_drafts
npx prisma generate
```

Or manually create the migration file and run it.

## Testing Steps

1. **Enable feature flag**:
   ```bash
   # In .env.local
   DOC_ENGINE_V1=true
   ```

2. **Start development server**:
   ```bash
   pnpm install
   pnpm dev
   ```

3. **Test document generation**:
   - Navigate to a job pack page
   - Click any document card (Variation, EOT, Invoice, Handover, Maintenance)
   - Verify document opens with pre-filled data
   - Edit fields inline
   - Verify auto-save (check "Saved" status)
   - Refresh page and verify draft persists
   - Click "Regenerate from Job Pack" and verify non-destructive merge
   - Export PDF and verify it matches preview

4. **Test OVIS warnings**:
   - Leave required fields empty
   - Verify OVIS warnings appear
   - Fill fields and verify warnings disappear

5. **Test feature flag toggle**:
   - Set `DOC_ENGINE_V1=false`
   - Verify old behavior returns
   - Set back to `true` to restore new behavior

## Rollback

To disable the new system:
1. Set `DOC_ENGINE_V1=false` in `.env.local`
2. Restart the server
3. Old behavior will be restored

## Notes

- Templates already exist in `lib/docTemplates/`
- PDF rendering uses existing `PdfDocument` class
- OVIS evaluator already implemented in `lib/docEngine/evaluateOvis.ts`
- Render model generation already implemented in `lib/docEngine/renderModel.ts`
- All components are mobile-friendly and responsive

