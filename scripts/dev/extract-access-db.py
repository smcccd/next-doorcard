#!/usr/bin/env python3

"""
Script to extract data from Access database to CSV files
Works on Mac/Linux using mdbtools or on Windows with pyodbc

Requirements:
- Mac/Linux: brew install mdbtools
- Windows: pip install pyodbc
- All: pip install pandas
"""

import os
import sys
import subprocess
import platform
import pandas as pd
from pathlib import Path

# Configuration
ACCESS_DB_PATH = sys.argv[1] if len(sys.argv) > 1 else './doorcard.accdb'
OUTPUT_DIR = './db-items/new-export'

# Tables to export
TABLES_TO_EXPORT = [
    'TBL_USER',
    'TBL_DOORCARD', 
    'TBL_APPOINTMENT',
    'TBL_CATEGORY',
    'TBL_TEMPLATE'
]

def ensure_output_dir():
    """Create output directory if it doesn't exist"""
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

def export_with_mdbtools():
    """Export using mdbtools (Mac/Linux)"""
    print("Using mdbtools for extraction...")
    
    # Check if mdbtools is installed
    try:
        subprocess.run(['mdb-ver', ACCESS_DB_PATH], check=True, capture_output=True)
    except:
        print("Error: mdbtools not found. Install with: brew install mdbtools")
        sys.exit(1)
    
    # Get list of tables
    result = subprocess.run(['mdb-tables', '-1', ACCESS_DB_PATH], 
                          capture_output=True, text=True)
    all_tables = result.stdout.strip().split('\n')
    
    print(f"Found {len(all_tables)} tables in database")
    
    # Export each table
    for table in TABLES_TO_EXPORT:
        if table in all_tables:
            print(f"Exporting {table}...")
            csv_path = os.path.join(OUTPUT_DIR, f"{table}.csv")
            
            # Export to CSV
            with open(csv_path, 'w') as f:
                subprocess.run(['mdb-export', ACCESS_DB_PATH, table], 
                             stdout=f, check=True)
            
            # Count rows
            with open(csv_path, 'r') as f:
                row_count = sum(1 for line in f) - 1  # Subtract header
            
            print(f"✓ Exported {row_count} rows from {table}")
        else:
            print(f"✗ Table {table} not found in database")
    
    # Export schema
    print("\nExporting schema...")
    schema_path = os.path.join(OUTPUT_DIR, 'database-schema.txt')
    with open(schema_path, 'w') as f:
        subprocess.run(['mdb-schema', ACCESS_DB_PATH], stdout=f)
    print("✓ Schema exported to database-schema.txt")

def export_with_pyodbc():
    """Export using pyodbc (Windows)"""
    try:
        import pyodbc
    except ImportError:
        print("Error: pyodbc not found. Install with: pip install pyodbc")
        sys.exit(1)
    
    print("Using pyodbc for extraction...")
    
    # Connection string for Access
    conn_str = (
        r'DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};'
        f'DBQ={os.path.abspath(ACCESS_DB_PATH)};'
    )
    
    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Export each table
        for table in TABLES_TO_EXPORT:
            print(f"Exporting {table}...")
            try:
                df = pd.read_sql(f"SELECT * FROM {table}", conn)
                csv_path = os.path.join(OUTPUT_DIR, f"{table}.csv")
                df.to_csv(csv_path, index=False)
                print(f"✓ Exported {len(df)} rows from {table}")
            except Exception as e:
                print(f"✗ Error exporting {table}: {e}")
        
        # Get schema information
        print("\nExporting schema...")
        schema_info = []
        for table_info in cursor.tables(tableType='TABLE'):
            if table_info.table_name.startswith('TBL_'):
                columns = []
                for column in cursor.columns(table=table_info.table_name):
                    columns.append({
                        'column': column.column_name,
                        'type': column.type_name,
                        'size': column.column_size
                    })
                schema_info.append({
                    'table': table_info.table_name,
                    'columns': columns
                })
        
        # Save schema
        schema_df = pd.DataFrame(schema_info)
        schema_df.to_json(os.path.join(OUTPUT_DIR, 'database-schema.json'), 
                         orient='records', indent=2)
        print("✓ Schema exported to database-schema.json")
        
        conn.close()
        
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def main():
    print("Access Database Data Extractor")
    print("==============================")
    print(f"Database: {ACCESS_DB_PATH}")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Platform: {platform.system()}\n")
    
    # Check if database exists
    if not os.path.exists(ACCESS_DB_PATH):
        print(f"Error: Database file not found at {ACCESS_DB_PATH}")
        print("\nUsage: python extract-access-db.py [path-to-database.accdb]")
        sys.exit(1)
    
    # Create output directory
    ensure_output_dir()
    
    # Choose extraction method based on platform
    if platform.system() == 'Windows':
        export_with_pyodbc()
    else:
        export_with_mdbtools()
    
    print("\nExtraction complete!")
    print(f"CSV files saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()