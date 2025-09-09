# Legacy Data Integrity Analysis Report

## Executive Summary

❌ **CRITICAL DATA INTEGRITY ISSUES FOUND**

The legacy Access database export has **severe data integrity problems** that
make direct migration impossible without significant data reconstruction. The
primary issues are broken foreign key relationships and incomplete user data.

## Critical Findings

### 🚨 **Catastrophic Relationship Integrity Failure**

**Foreign Key Relationship Breakdown:**

- **Doorcard IDs in DOORCARD table**: Range 480-27,228 (10,944 records)
- **Doorcard IDs referenced in APPOINTMENTS**: Range 23-27,228 (20,157 unique
  IDs)
- **Overlap**: Only **9,370 doorcard IDs** exist in both tables
- **Result**: **53.6% of appointment references are orphaned**

**Impact:**

- 184,935 appointments total
- ~88,000+ appointments reference non-existent doorcards
- Complete failure of appointment → doorcard → user relationship chain

### 🚨 **Missing User Data Crisis**

**User Table Completeness:**

- **Users in TBL_USER**: 1 (admin only)
- **Users referenced in doorcards**: 1,847
- **Users referenced in appointments**: 2,210
- **Total unique users needed**: 2,271
- **Missing users**: 99.96%

**This indicates the user table export is incomplete or from wrong database**

## Detailed Data Quality Issues

### 1. **Date Integrity Problems**

**Invalid Dates:**

- **22 doorcard records** contain impossible dates: `"01/00/00 00:00:00"`
- **Examples:**
  ```
  9955,"nguyenv","Spring 2012","01/00/00 00:00:00","05/30/12 00:00:00"
  14366,"dinellia","anne dinelli","01/00/00 00:00:00","05/20/14 00:00:00"
  ```
- **Impact**: These records cannot be imported without date cleanup

**Missing Dates:**

- **85+ doorcard records** have completely empty start/end date fields
- **Example**: `10031,"obrienk","Spring2012",,,201203,"Skyline"`

### 2. **Category Definition Problems**

**Missing Category Definition:**

- **Category ID 7**: Used in **792 appointments** but has no name or color
  defined
- **Category table entry**: `7,,` (completely empty)
- **Impact**: 792 appointments cannot be categorized properly

**Category Usage:**

```
Office Hours (1):     68,767 appointments (37.2%)
In Class (2):         61,726 appointments (33.4%)
Lecture (3):          19,665 appointments (10.6%)
Lab (4):              14,102 appointments (7.6%)
Hours by Arrangement: 11,027 appointments (6.0%)
Reference (6):         8,856 appointments (4.8%)
UNDEFINED (7):           792 appointments (0.4%)
```

### 3. **Data Consistency Issues**

**Doorcard Name Inconsistencies:**

- **Term-based names**: `"Spring 2012"`, `"Spring2012"`, `"Spring 12"`,
  `"Spr. 2012"`
- **Personal names**: `"Chris Weidman"`, `"anne dinelli"`, `"Dora Luz Collado"`
- **Mixed formats**: `"B. McCarthy Spring2012"`
- **Impact**: Inconsistent display and hard to parse for term extraction

**Username Case Inconsistencies:**

- **Mostly lowercase**: `smithbrandon`, `irigoyen`
- **Some uppercase**: `DEAMER`
- **Impact**: May cause duplicate users or login issues

### 4. **Empty Data Fields**

**Critical Missing Data:**

- **70 appointments** have empty username fields
- **85+ doorcards** have empty date fields
- **1 category** completely undefined
- **No office numbers** in any doorcard records
- **No email addresses** for any users

## Data Volume and Statistics

| Table           | Total Records | Valid Records | Issues                          |
| --------------- | ------------- | ------------- | ------------------------------- |
| TBL_USER        | 2             | 1             | 99.96% of references missing    |
| TBL_DOORCARD    | 10,944        | ~10,837       | 107 records with date issues    |
| TBL_APPOINTMENT | 184,935       | ~96,000       | 88,000+ orphaned by doorcard ID |
| TBL_CATEGORY    | 7             | 6             | 1 undefined category            |
| TBL_TEMPLATE    | 0             | 0             | Empty file                      |

## Root Cause Analysis

### **Most Likely Scenario:**

The Access database export appears to be **incomplete or from multiple different
database snapshots**:

1. **User table**: Exported from minimal local user table (LDAP system used AD
   for users)
2. **Doorcard table**: Exported from recent/current database state
3. **Appointment table**: Exported from historical database with different ID
   ranges
4. **Categories**: Partially defined or corrupted during export

### **Alternative Explanations:**

- **Database corruption** during Access export process
- **Partial backup restoration** mixed different time periods
- **Development vs Production** database mix-up
- **Legacy ID recycling** caused range overlaps

## Migration Strategy Recommendations

### **Option 1: Data Reconstruction (Recommended)**

✅ **Use current import script approach:**

- Generate users from doorcard/appointment username references
- Import overlapping appointments only (9,370 doorcard matches)
- Accept ~50% appointment loss as acceptable for historical migration
- **Result**: ~96,000 clean appointments with proper relationships

### **Option 2: Data Cleanup and Re-export**

❌ **Requires access to original Access database:**

- Fix foreign key relationships at source
- Export complete user table from LDAP/AD integration
- Regenerate consistent category definitions
- **Problem**: May not have access to original system

### **Option 3: Hybrid Approach**

⚠️ **Reconstruct missing relationships:**

- Create script to map appointment doorcard IDs to existing ones
- Generate missing doorcard records for orphaned appointments
- **Risk**: May create invalid/duplicate data

## Expected Import Success Rates

### **Conservative Estimates (Current Import Script):**

- **Users**: 2,271 created (100% success via generation)
- **Doorcards**: ~8,000-10,000 imported (70-90% success)
- **Appointments**: ~50,000-96,000 imported (25-50% success)

### **Aggressive Cleanup Estimates:**

- **Users**: 2,271 created (100% success)
- **Doorcards**: ~10,800 imported (98% success after date fixes)
- **Appointments**: ~150,000-170,000 imported (80-90% success after relationship
  fixes)

## Production Recommendations

### **Pre-Import Actions:**

1. **Accept data loss**: ~50% appointment loss is acceptable for legacy
   migration
2. **Focus on recent data**: Prioritize doorcards from 2020+ (higher
   relationship integrity)
3. **Manual category fix**: Define category 7 as "Other" or "Miscellaneous"
4. **Date cleanup**: Replace `01/00/00` dates with term start dates

### **Import Execution:**

1. Run import with current debug script
2. Monitor success rates in real-time
3. Accept rejections as expected data quality issues
4. Focus on successful user/doorcard relationships

### **Post-Import Validation:**

1. Verify user counts (expect ~2,271)
2. Check doorcard relationships (expect ~8,000-10,000)
3. Validate appointment integrity (expect ~50,000-96,000)
4. Manual spot-checks of faculty data accuracy

## Risk Assessment

### **High Risk:**

- **User adoption issues** if too much historical data is missing
- **Faculty complaints** about lost office hours/schedules
- **Incomplete migration** perception

### **Mitigation:**

- **Clear communication** about data quality issues in legacy system
- **Focus on OneLogin benefits** vs historical data preservation
- **Gradual rollout** to identify issues early

### **Acceptable Losses:**

- **Orphaned appointments** from broken relationships
- **Invalid date records** that can't be parsed
- **Undefined categories** that can be reassigned

## Conclusion

The legacy data has **critical integrity issues** but the current import
approach is the most realistic solution. **Data reconstruction via username
generation is necessary** and should be expected to yield ~50% appointment
success rates.

**Recommendation**: Proceed with current import strategy, accept data losses as
legacy system limitations, and focus on delivering modern OneLogin-integrated
system for future use.
