# Legacy Data Migration Analysis - Findings

## Overview

This Next.js doorcard application has a comprehensive legacy data migration
system in place for importing data from CSV files that appear to have been
exported from a Microsoft Access database.

## No Access Database Files Found

- **No .mdb or .accdb files** were found in the project
- The legacy data exists only as CSV exports in the `/db-items` directory

## Legacy Data Sources (CSV Files)

### Available CSV Files:

1. **TBL_USER (2).csv** - User data from Active Directory
2. **TBL_DOORCARD (1).csv** - Legacy doorcard records
3. **TBL_APPOINTMENT (1).csv** - Appointment/schedule data
4. **TBL_CATEGORY (1).csv** - Appointment categories
5. **TBL_TEMPLATE (1).csv** - Legacy templates (not imported)

## Import System Architecture

### Main Import Script: `/scripts/import-legacy.ts`

A comprehensive TypeScript migration script that:

- Uses streaming CSV parsing with `fast-csv` for memory efficiency
- Implements batch processing for large datasets
- Maintains ID mapping between old and new systems
- Handles data validation and transformation
- Logs rejected rows to `/rejects/` directory
- Supports dry-run mode for testing

### Key Features:

1. **User Creation**:
   - Generates emails as `username@smccd.edu`
   - Creates default passwords (hashed with bcrypt)
   - Maps legacy roles to new enum values
   - Creates missing users from doorcard/appointment data

2. **Doorcard Migration**:
   - Parses term strings (e.g., "202203" → Spring 2022)
   - Maps colleges to enum values
   - Generates URL slugs
   - Links to users via username lookup

3. **Appointment Migration**:
   - Maps category IDs to AppointmentCategory enum
   - Extracts time from datetime strings
   - Attempts to extract location from appointment names
   - Creates placeholder doorcards for orphaned appointments

## Supporting Scripts

### 1. `/scripts/rollback-import.ts`

- Safely rolls back imported data
- Preserves admin users
- Deletes in reverse dependency order

### 2. `/scripts/analyze-db.js`

- Analyzes imported data quality
- Checks for orphaned records
- Validates foreign key relationships
- Provides data distribution statistics

### 3. `/scripts/analyze-rejects.js`

- Analyzes rejected CSV rows
- Groups rejections by reason
- Identifies patterns in failed imports
- Provides recommendations for improvement

## Data Export Capabilities

### `/app/api/admin/export/route.ts`

Admin-only API endpoint that exports:

- Users (with doorcard counts)
- Doorcards (with appointment counts)
- Analytics data
- Exports as CSV with proper formatting

## Migration Challenges Identified

### From Rejection Analysis:

1. **High rejection rates**:
   - ~175,000 appointments rejected (94.5% rejection rate)
   - ~3,800 doorcards rejected (34.7% rejection rate)

2. **Common issues**:
   - Missing users (usernames not found)
   - Empty usernames in appointment data
   - Invalid college names
   - Malformed date/time formats
   - Invalid term formats

3. **Data quality issues**:
   - Incomplete user-doorcard relationships
   - Orphaned appointments
   - Missing required fields

## Recommendations for Production Migration

1. **Pre-migration cleanup**:
   - Validate and clean source CSV data
   - Handle empty usernames
   - Standardize date/time formats

2. **Migration improvements**:
   - Create users from ALL source data first
   - Implement fuzzy matching for usernames
   - Better error recovery for partial failures
   - Add data reconciliation reports

3. **Post-migration validation**:
   - Run comprehensive data integrity checks
   - Generate migration reports
   - Implement data quality monitoring

## No Direct Access Database Connection

The project does not have:

- Direct Access database connections
- ODBC/JDBC drivers for Access
- Real-time Access data sync

All legacy data must be:

1. Exported from Access to CSV
2. Placed in `/db-items` directory
3. Imported using the migration scripts

## Migration Commands

```bash
# Dry run (recommended first)
npm run import-legacy:dry

# Actual import
npm run import-legacy

# Rollback if needed
npx ts-node scripts/rollback-import.ts

# Analyze imported data
node scripts/analyze-db.js

# Analyze rejections
node scripts/analyze-rejects.js
```
