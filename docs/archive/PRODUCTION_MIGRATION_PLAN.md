# Production Migration Plan - Final Legacy Data Import

**CRITICAL**: Production-ready migration plan to fix data import issues and
deploy to Postgres

## Root Cause Analysis

### Primary Issues Identified:

1. **Import script sets `isActive: false`** - All doorcards marked inactive,
   invisible in queries
2. **Hardcoded `year: 2021`** - All data assigned to wrong year (should be 2025)
3. **Broken name capitalization** - "dr. judith miller" instead of "Dr. Judith
   Miller"
4. **skipDuplicates failed** - Each appointment gets unique ID, bypassing
   deduplication
5. **Term filtering** - Current queries only show Fall 2025, but data is in 2021

## Migration Strategy

### Phase 1: Immediate Data Fix (30 minutes)

- Update existing doorcards to `isActive: true` and `year: 2025`
- Fix name capitalization patterns
- Remove actual duplicates (not just skip them)
- Validate appointment counts match source CSV

### Phase 2: Production Deployment (60 minutes)

- Create PostgreSQL production migration script
- Implement validation checks
- Deploy with rollback capability
- Verify data integrity post-migration

## Critical SQL Fixes Needed

```sql
-- Fix inactive doorcards
UPDATE "Doorcard" SET "isActive" = true, "year" = 2025 WHERE "year" = 2021;

-- Fix name capitalization
UPDATE "User" SET "name" =
  CASE
    WHEN "name" LIKE 'dr.%' THEN 'Dr.' || INITCAP(SUBSTRING("name" FROM 4))
    WHEN "name" LIKE 'prof.%' THEN 'Prof.' || INITCAP(SUBSTRING("name" FROM 6))
    ELSE INITCAP("name")
  END;
```

## Expected Results After Fix

- **Dr. Judith Miller**: Should show 57 appointments (matches CSV source)
- **All faculty**: Proper name capitalization
- **Search functionality**: Will find all active faculty
- **Data integrity**: Source CSV count = Database count

## Production Postgres Migration

1. **Backup current production data**
2. **Run migration script with validation**
3. **Verify counts match development results**
4. **Enable application with corrected data**

## Timeline

- **Next 2 hours**: Complete development fixes and validation
- **Production deployment**: Ready for immediate execution after validation
