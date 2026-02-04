#!/usr/bin/env node

/**
 * Script to extract data from Access database to CSV files
 *
 * This script can be run on Windows with Node.js and the 'node-adodb' package
 * or using Python with 'pyodbc' (see extract-access-db.py for Python version)
 */

const ADODB = require("node-adodb");
const fs = require("fs");
const path = require("path");
const { format } = require("fast-csv");

// Configuration
const ACCESS_DB_PATH = process.argv[2] || "./doorcard.accdb";
const OUTPUT_DIR = "./db-items/new-export";

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Connection string for Access database
const connection = ADODB.open(
  `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${ACCESS_DB_PATH};`
);

// Tables to export
const TABLES_TO_EXPORT = [
  "TBL_USER",
  "TBL_DOORCARD",
  "TBL_APPOINTMENT",
  "TBL_CATEGORY",
  "TBL_TEMPLATE",
];

async function exportTable(tableName) {
  console.log(`Exporting ${tableName}...`);

  try {
    // Query all data from table
    const data = await connection.query(`SELECT * FROM ${tableName}`);

    if (!data || data.length === 0) {
      console.log(`No data found in ${tableName}`);
      return;
    }

    // Create CSV writer
    const csvPath = path.join(OUTPUT_DIR, `${tableName}.csv`);
    const csvStream = format({ headers: true });
    const writeStream = fs.createWriteStream(csvPath);

    csvStream.pipe(writeStream);

    // Write data
    data.forEach((row) => {
      csvStream.write(row);
    });

    csvStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    console.log(
      `✓ Exported ${data.length} rows from ${tableName} to ${csvPath}`
    );
  } catch (error) {
    console.error(`✗ Error exporting ${tableName}:`, error.message);
  }
}

async function main() {
  console.log("Access Database Data Extractor");
  console.log("==============================");
  console.log(`Database: ${ACCESS_DB_PATH}`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  if (!fs.existsSync(ACCESS_DB_PATH)) {
    console.error("Error: Database file not found at", ACCESS_DB_PATH);
    console.log("\nUsage: node extract-access-db.js [path-to-database.accdb]");
    process.exit(1);
  }

  try {
    // Export each table
    for (const table of TABLES_TO_EXPORT) {
      await exportTable(table);
    }

    // Get database schema information
    console.log("\nExtracting schema information...");
    const schema = await connection.schema();
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "database-schema.json"),
      JSON.stringify(schema, null, 2)
    );
    console.log("✓ Schema information saved to database-schema.json");
  } catch (error) {
    console.error("Fatal error:", error);
  } finally {
    // Close connection
    connection.close();
    console.log("\nExtraction complete!");
  }
}

// Run the script
main().catch(console.error);
