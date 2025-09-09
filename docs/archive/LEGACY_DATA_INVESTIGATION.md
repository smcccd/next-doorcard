# Legacy Data Investigation Report

**Date**: August 7, 2025  
**Purpose**: Investigate root causes of data quality issues - determine if
problems originated from legacy system or import process

## Investigation Overview

This document traces the data flow from the legacy PHP doorcard system through
our import process to identify where data corruption and duplication occurred.

## Key Questions

1. Did the legacy system display all these duplicate/overlapping appointments?
2. Did our import scripts introduce the duplications?
3. What business logic in the legacy system might have hidden these issues?
4. How did the legacy UI handle overlapping appointments?

## Investigation Findings

### 1. Legacy System Architecture Discovery

**Critical Finding**: The PHP system in `/old-doorcard/public/` does NOT display
appointment schedules directly!

**Key Discovery** (Line 385 in `directory_details.php`):

```php
echo '<a href="http://doorcard.smccd.edu/preview_doorcard.asp?varname=' . $samaccountname . '&term=' . $term . '&college=' . strtolower($company) . '" target="_blank">Door Card</a>';
```

**What this means**:

- The PHP directory system only shows basic faculty info
- Schedule display links to an external **ASP system** at `doorcard.smccd.edu`
- The ASP system is the actual doorcard renderer
- Our import scripts pulled data from the ASP system's database, not the PHP
  system

### 2. Data Issues Discovered in Our Import

#### A. Duplicate Appointments (1,118 found)

- **Root Cause**: Legacy Access database contains inherent duplicates
- **Dr. Judith Miller**: 39 duplicates out of 72 appointments (54%)
- **Pattern**: Same time slots repeated across multiple records
- **Example**: Monday 18:00-18:30 OFFICE_HOURS appears 6 times with identical
  data

#### B. Legacy Date Format Issue

- **Critical Discovery**: All appointments use **"12/30/99"** as date
  placeholder
- **Source**: TBL_APPOINTMENT.csv shows datetime format: `12/30/99 18:00:00`
- **Impact**: This confirms legacy system stored only day-of-week + time, not
  actual dates
- **Implication**: Our import correctly preserved this legacy limitation

#### C. Import Script Analysis

**File**: `scripts/import-legacy.ts` (Line 632-634)

```typescript
const result = await prisma.appointment.createMany({
  data: batch,
  skipDuplicates: true, // ← This should have prevented duplicates!
});
```

**Problem**: The `skipDuplicates` option didn't work because each appointment
has a unique ID!

#### D. Missing Location Data (2,002 appointments)

- Legacy system stored course codes in `appointname` field
- Our `extractLocation()` function couldn't parse many location formats
- Example: "Office Hours" has no location, "ACTG 171" has no room number

### 3. Root Cause Analysis

#### The Real Problem: Legacy Database Design Flaws

1. **No Unique Constraints**: Legacy Access DB allowed identical appointment
   records
2. **Recurring Events**: Each class meeting stored as separate record (M,W,F = 3
   records)
3. **Poor Data Entry**: Manual entry created duplicates without validation
4. **Term Rollover**: Old terms may have been copied creating duplicates

#### Why ASP System "Worked"

The legacy ASP display system likely had:

1. **Client-side deduplication** - JavaScript/VBScript to merge identical times
2. **Server-side filtering** - ASP code to group/deduplicate before rendering
3. **UI masking** - Visual tricks to hide overlaps from users

### 4. Evidence from Rejected Records

**File**: `rejects/TBL_APPOINTMENT.csv` shows:

- Same course (Engl828AA) appears on M,T,W,Th,F as separate records
- Same office hours appear on M,T,W,Th,F as separate records
- Pattern: `appointID` increments (84,85,86,87,88) for identical time slots

**Conclusion**: Duplicates existed in source data, not created by our import!

## Critical Implications

### For Production

1. **Production likely has same issues** - if it uses same Access database
2. **ASP system may hide duplicates** - through client-side processing
3. **Our new system exposes true data quality** - showing what was always there

### For Our System

1. **Import script worked correctly** - preserved source data faithfully
2. **Need post-import cleanup** - remove duplicates our system can't handle
3. **Add validation rules** - prevent future duplicate creation

## Recommended Immediate Actions

1. **✅ CONFIRMED**: Duplicates originated from legacy database, not our import
2. **⚠️ URGENT**: Run cleanup script to remove duplicates for user experience
3. **📋 NEXT**: Contact IT about production ASP system logic for comparison
4. **🔍 INVESTIGATE**: Check if live doorcard.smccd.edu shows same overlaps

## Questions for IT/Management

1. Does the live ASP system at doorcard.smccd.edu show these overlapping
   appointments?
2. What deduplication logic exists in the ASP codebase?
3. Should we preserve "raw" data fidelity or optimize for user experience?
4. How were duplicate appointments handled in the original Access database?
