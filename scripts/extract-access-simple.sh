#!/bin/bash

# Simple Access database extraction script for Mac/Linux using mdbtools

# Check if database path is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <path-to-database.mdb>"
    echo "Example: $0 ./doorcard.mdb"
    exit 1
fi

DB_PATH="$1"
OUTPUT_DIR="./db-items/new-export"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database file not found at $DB_PATH"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Access Database Extractor"
echo "========================"
echo "Database: $DB_PATH"
echo "Output: $OUTPUT_DIR"
echo ""

# List all tables
echo "Tables in database:"
mdb-tables -1 "$DB_PATH"
echo ""

# Export specific tables
TABLES=("TBL_USER" "TBL_DOORCARD" "TBL_APPOINTMENT" "TBL_CATEGORY" "TBL_TEMPLATE")

for table in "${TABLES[@]}"; do
    echo "Exporting $table..."
    OUTPUT_FILE="$OUTPUT_DIR/${table}.csv"
    
    if mdb-export "$DB_PATH" "$table" > "$OUTPUT_FILE" 2>/dev/null; then
        # Count rows (excluding header)
        ROWS=$(($(wc -l < "$OUTPUT_FILE") - 1))
        echo "✓ Exported $ROWS rows to ${table}.csv"
    else
        echo "✗ Table $table not found or error exporting"
        rm -f "$OUTPUT_FILE"  # Remove empty file
    fi
done

# Export database schema
echo ""
echo "Exporting schema..."
mdb-schema "$DB_PATH" > "$OUTPUT_DIR/database-schema.sql"
echo "✓ Schema exported to database-schema.sql"

# List all tables with row counts
echo ""
echo "Summary of all tables:"
for table in $(mdb-tables -1 "$DB_PATH"); do
    if [[ ! "$table" =~ ^MSys ]]; then  # Skip system tables
        COUNT=$(mdb-export "$DB_PATH" "$table" | wc -l)
        COUNT=$((COUNT - 1))  # Subtract header
        echo "  $table: $COUNT rows"
    fi
done

echo ""
echo "Extraction complete!"
echo "Files saved to: $OUTPUT_DIR"