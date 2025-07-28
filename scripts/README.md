# Legacy Data Import Script

## Overview

The `import-legacy.ts` script imports legacy doorcard data from CSV files into the new Prisma-based database.

## Usage

### Dry Run (Recommended First)

```bash
npm run import-legacy:dry
```

This will simulate the import without writing to the database and show what would be imported.

### Actual Import

```bash
npm run import-legacy
```

This will perform the actual import to the database.

## Data Mapping

The script processes the following CSV files from `/db-items`:

1. **TBL_USER.csv** → User model
   - Generates emails as `username@smccd.edu`
   - Sets default password: `changeme123` (hashed)
   - Maps roles to UserRole enum

2. **TBL_DOORCARD.csv** → Doorcard model
   - Parses term strings to extract season and year
   - Links to users via username
   - Generates URL slugs

3. **TBL_APPOINTMENT.csv** → Appointment model
   - Maps category IDs to AppointmentCategory enum
   - Extracts time from datetime strings
   - Attempts to extract location from appointment names

4. **TBL_CATEGORY.csv** → Used for category mapping only

5. **TBL_TEMPLATE.csv** → Not imported (no corresponding model)

## Features

- **Streaming**: Uses fast-csv for memory-efficient processing
- **Upserts**: Uses Prisma's upsert to handle duplicates
- **Error Handling**: Rejected rows are logged to `/rejects/<filename>.csv`
- **ID Mapping**: Maintains mapping between old and new IDs
- **Type Coercion**: Handles date/time parsing, enums, etc.

## Rejected Rows

Any rows that fail to import are written to:

```
/rejects/TBL_USER.csv
/rejects/TBL_DOORCARD.csv
/rejects/TBL_APPOINTMENT.csv
```

Each rejected row includes the original data plus a `_reject_reason` column.

## Important Notes

1. **Required Fields**: Users need email and password (generated automatically)
2. **Missing Data**: Office numbers default to "TBD"
3. **Default Values**:
   - isActive: false
   - isPublic: false
   - All passwords: "changeme123"

## Category Mapping

Current category ID mappings:

- 1 → OFFICE_HOURS
- 2 → IN_CLASS
- 3 → LECTURE
- 4 → LAB
- 5 → HOURS_BY_ARRANGEMENT
- 6 → REFERENCE

Additional categories in the data should be reviewed and mapped accordingly.
