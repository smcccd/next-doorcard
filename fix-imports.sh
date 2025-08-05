#!/bin/bash

# Fix duplicate and malformed imports in test files

set -e

echo "Fixing import statements in test files..."

# Find all test files
TEST_FILES=$(find . -name "*.test.ts" -o -name "*.test.tsx" | grep -v node_modules | sort)

for file in $TEST_FILES; do
  if [ -f "$file" ]; then
    echo "Processing $file"
    
    # Fix files that have the import pattern issue
    if grep -q "import {.*import {" "$file"; then
      # Create a temporary file
      temp_file=$(mktemp)
      
      # Process the file to fix the imports
      awk '
        BEGIN { in_import = 0; import_lines = ""; skip_next = 0 }
        
        # Skip lines that are part of broken import
        skip_next == 1 { skip_next = 0; next }
        
        # Handle broken import pattern
        /^import {.*import {.*} from "vitest";/ {
          # Extract the vitest import
          gsub(/.*import {/, "import {", $0)
          print $0
          skip_next = 1
          next
        }
        
        # Skip empty import lines
        /^import {$/ { 
          in_import = 1
          import_lines = $0
          next 
        }
        
        # Continue collecting import content
        in_import == 1 && !/} from/ {
          import_lines = import_lines "\n" $0
          next
        }
        
        # End of import block
        in_import == 1 && /} from/ {
          import_lines = import_lines "\n" $0
          # Only print if this is not a vitest import (we added it above)
          if (import_lines !~ /vitest/) {
            print import_lines
          }
          in_import = 0
          import_lines = ""
          next
        }
        
        # Print all other lines
        { print }
      ' "$file" > "$temp_file"
      
      # Replace the original file
      mv "$temp_file" "$file"
      echo "  ✓ Fixed imports in $file"
    fi
  fi
done

echo "Import fixes complete!"