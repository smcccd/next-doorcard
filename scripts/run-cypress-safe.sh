#!/bin/bash
# Safe Cypress runner that ensures test environment variables are set
# This prevents accidental authentication bypass in production

# Ensure we're not in production
if [ "$NODE_ENV" = "production" ]; then
  echo "❌ ERROR: Cannot run Cypress tests in production environment"
  exit 1
fi

# Set test environment variables
export NODE_ENV=test
export CYPRESS=true

echo "✅ Running Cypress in safe test mode"
echo "   NODE_ENV: $NODE_ENV"
echo "   CYPRESS: $CYPRESS"

# Run the requested Cypress command
if [ "$1" = "open" ]; then
  npx cypress open
else
  npx cypress run "$@"
fi