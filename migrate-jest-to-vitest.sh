#!/bin/bash

# Jest to Vitest Migration Script
# This script systematically converts Jest APIs to Vitest APIs across all test files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./jest-to-vitest-backup-$(date +%Y%m%d_%H%M%S)"
TEST_PATTERN="**/*.test.{ts,tsx}"
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help)
      echo "Usage: $0 [--dry-run] [--help]"
      echo "  --dry-run    Show what would be changed without making changes"
      echo "  --help       Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}Jest to Vitest Migration Script${NC}"
echo -e "${BLUE}===============================${NC}"
echo

# Find all test files (excluding node_modules)
TEST_FILES=$(find . -name "*.test.ts" -o -name "*.test.tsx" | grep -v node_modules | sort)
TOTAL_FILES=$(echo "$TEST_FILES" | wc -l | tr -d ' ')

if [ -z "$TEST_FILES" ]; then
  echo -e "${RED}No test files found!${NC}"
  exit 1
fi

echo -e "${GREEN}Found $TOTAL_FILES test files to migrate${NC}"
echo

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}DRY RUN MODE - No files will be modified${NC}"
  echo
fi

# Create backup directory if not dry run
if [ "$DRY_RUN" = false ]; then
  echo -e "${BLUE}Creating backup directory: $BACKUP_DIR${NC}"
  mkdir -p "$BACKUP_DIR"
  
  # Copy all test files to backup
  echo "Backing up test files..."
  for file in $TEST_FILES; do
    backup_path="$BACKUP_DIR/$file"
    mkdir -p "$(dirname "$backup_path")"
    cp "$file" "$backup_path"
  done
  echo -e "${GREEN}Backup complete${NC}"
  echo
fi

# Migration patterns - using simpler string replacements
JEST_PATTERNS=(
  "jest.mock("
  "jest.unmock("
  "jest.doMock("
  "jest.dontMock("
  "jest.fn()"
  "jest.fn("
  "jest.spyOn("
  "jest.clearAllMocks()"
  "jest.resetAllMocks()"
  "jest.restoreAllMocks()"
  "jest.mocked("
  "jest.isMockFunction("
  "jest.advanceTimersByTime("
  "jest.advanceTimersToNextTimer()"
  "jest.runAllTimers()"
  "jest.runOnlyPendingTimers()"
  "jest.useFakeTimers()"
  "jest.useRealTimers()"
  "jest.setSystemTime("
  "jest.getRealSystemTime()"
)

VITEST_PATTERNS=(
  "vi.mock("
  "vi.unmock("
  "vi.doMock("
  "vi.dontMock("
  "vi.fn()"
  "vi.fn("
  "vi.spyOn("
  "vi.clearAllMocks()"
  "vi.resetAllMocks()"
  "vi.restoreAllMocks()"
  "vi.mocked("
  "vi.isMockFunction("
  "vi.advanceTimersByTime("
  "vi.advanceTimersToNextTimer()"
  "vi.runAllTimers()"
  "vi.runOnlyPendingTimers()"
  "vi.useFakeTimers()"
  "vi.useRealTimers()"
  "vi.setSystemTime("
  "vi.getRealSystemTime()"
)

# Function to check if file needs vitest imports
needs_vitest_imports() {
  local file="$1"
  
  # Check if file uses vi. functions but doesn't import from vitest
  if grep -q "vi\." "$file" && ! grep -q "from ['\"]vitest['\"]" "$file"; then
    return 0  # needs imports
  fi
  
  # Check if file uses MockedFunction but doesn't import it from vitest
  if grep -q "MockedFunction\|MockedObject" "$file" && ! grep -q "MockedFunction.*from.*vitest\|type.*MockedFunction.*from.*vitest" "$file"; then
    return 0  # needs imports
  fi
  
  return 1  # doesn't need imports
}

# Function to add vitest imports to a file
add_vitest_imports() {
  local file="$1"
  local temp_file=$(mktemp)
  
  # Determine what imports are needed based on file content
  local imports=()
  
  # Check for vi usage
  if grep -q "vi\." "$file"; then
    imports+=("vi")
  fi
  
  # Check for test functions
  if grep -q "describe\|it\|test\|beforeEach\|afterEach\|beforeAll\|afterAll" "$file"; then
    imports+=("describe" "it" "expect" "beforeEach" "afterEach")
  fi
  
  # Check for MockedFunction usage
  if grep -q "MockedFunction" "$file"; then
    imports+=("type MockedFunction")
  fi
  
  # Check for MockedObject usage  
  if grep -q "MockedObject" "$file"; then
    imports+=("type MockedObject")
  fi
  
  # Remove duplicates and create import statement
  local unique_imports=($(printf '%s\n' "${imports[@]}" | sort -u))
  local import_statement="import { $(IFS=', '; echo "${unique_imports[*]}") } from \"vitest\";"
  
  # Add import at the top, after any existing imports
  awk -v import_stmt="$import_statement" '
    BEGIN { import_added = 0 }
    /^import/ { 
      print $0
      if (!import_added && (getline next_line) > 0) {
        if (next_line !~ /^import/) {
          print import_stmt
          print ""
          print next_line
          import_added = 1
        } else {
          print next_line
        }
      }
      next
    }
    {
      if (!import_added && NF > 0 && !/^\/\/|^\/\*/) {
        print import_stmt
        print ""
        import_added = 1
      }
      print $0
    }
  ' "$file" > "$temp_file"
  
  mv "$temp_file" "$file"
}

# Progress tracking
PROCESSED=0
MODIFIED=0
ERRORS=0

echo -e "${BLUE}Starting migration...${NC}"
echo

# Process each test file
for file in $TEST_FILES; do
  PROCESSED=$((PROCESSED + 1))
  echo -ne "\r${BLUE}Processing: $file ($PROCESSED/$TOTAL_FILES)${NC}"
  
  if [ ! -f "$file" ]; then
    echo -e "\n${RED}File not found: $file${NC}"
    ERRORS=$((ERRORS + 1))
    continue
  fi
  
  # Check if file needs changes
  file_needs_changes=false
  changes_made=false
  
  # Create temporary file for modifications
  temp_file=$(mktemp)
  cp "$file" "$temp_file"
  
  # Apply pattern replacements
  for i in "${!JEST_PATTERNS[@]}"; do
    jest_pattern="${JEST_PATTERNS[$i]}"
    vitest_pattern="${VITEST_PATTERNS[$i]}"
    
    if grep -q -F "$jest_pattern" "$temp_file"; then
      file_needs_changes=true
      if [ "$DRY_RUN" = false ]; then
        # Use perl for more reliable string replacement
        perl -i -pe "s/\Q$jest_pattern\E/$vitest_pattern/g" "$temp_file"
        changes_made=true
      fi
    fi
  done
  
  # Add vitest imports if needed
  if needs_vitest_imports "$temp_file"; then
    file_needs_changes=true
    if [ "$DRY_RUN" = false ]; then
      add_vitest_imports "$temp_file"
      changes_made=true
    fi
  fi
  
  # Apply changes if any were made
  if [ "$file_needs_changes" = true ]; then
    if [ "$DRY_RUN" = false ] && [ "$changes_made" = true ]; then
      mv "$temp_file" "$file"
      MODIFIED=$((MODIFIED + 1))
      echo -e "\n${GREEN}✓ Modified: $file${NC}"
    else
      echo -e "\n${YELLOW}Would modify: $file${NC}"
      rm -f "$temp_file"
    fi
  else
    rm -f "$temp_file"
  fi
done

echo -e "\n\n${BLUE}Migration Summary${NC}"
echo -e "${BLUE}=================${NC}"
echo -e "Total files processed: ${GREEN}$PROCESSED${NC}"
echo -e "Files modified: ${GREEN}$MODIFIED${NC}"
if [ $ERRORS -gt 0 ]; then
  echo -e "Errors encountered: ${RED}$ERRORS${NC}"
fi

if [ "$DRY_RUN" = false ] && [ $MODIFIED -gt 0 ]; then
  echo -e "\n${GREEN}Migration complete!${NC}"
  echo -e "Backup created at: ${BLUE}$BACKUP_DIR${NC}"
  echo -e "\nNext steps:"
  echo -e "1. Run ${YELLOW}npm test${NC} to check the results"
  echo -e "2. If there are issues, restore from backup: ${YELLOW}cp -r $BACKUP_DIR/* .${NC}"
  echo -e "3. Fix any remaining manual conversion issues"
elif [ "$DRY_RUN" = true ]; then
  echo -e "\n${YELLOW}This was a dry run. Use without --dry-run to apply changes.${NC}"
else
  echo -e "\n${GREEN}No files needed modification.${NC}"
fi

echo