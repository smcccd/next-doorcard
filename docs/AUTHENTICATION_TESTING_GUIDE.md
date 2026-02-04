# OneLogin Authentication Testing Strategy

This guide provides comprehensive strategies for testing OneLogin authentication
with manual credential entry and MFA support in the Next.js Doorcard
application.

## Overview

The authentication testing system supports multiple modes to handle different
scenarios:

- **Manual/Interactive Mode**: Real OneLogin authentication with manual
  credential entry
- **Programmatic Mode**: JWT-based authentication for automated testing
- **Mock Mode**: Simulated authentication for unit testing
- **Hybrid Mode**: Manual authentication with session caching
- **CI/CD Mode**: Automated fallbacks for continuous integration

## Quick Start

### Manual Testing with Real OneLogin

```bash
# Interactive mode with browser window (recommended for development)
npm run test:auth:manual

# Run specific test file
npm run test:auth:manual -- --spec="cypress/e2e/interactive-auth-examples.cy.ts"
```

### Automated Testing (CI-friendly)

```bash
# Programmatic authentication (no manual input required)
npm run test:auth:programmatic

# Mock authentication (fastest for unit tests)
npm run test:auth:mock

# Auto-select best strategy for current environment
npm run test:auth:ci:auto
```

## Authentication Modes

### 1. Manual/Interactive Mode

**Use Case**: Manual testing, development, debugging authentication flows

**Features**:

- Real OneLogin authentication
- Manual credential entry
- MFA support (SMS, authenticator apps)
- Session persistence across test runs
- Visual overlay with instructions

**Command**:

```bash
npm run test:auth:manual
```

**Flow**:

1. Test navigates to login page
2. Clicks "Sign in with OneLogin"
3. Redirects to OneLogin domain
4. **PAUSE**: Visual overlay prompts for manual login
5. User enters credentials and completes MFA
6. Test resumes after successful authentication
7. Session is cached for future runs

### 2. Programmatic Mode

**Use Case**: Automated testing without external dependencies

**Features**:

- JWT token-based authentication
- No external service calls
- Predictable test user data
- Fast execution

**Command**:

```bash
npm run test:auth:programmatic
```

**Configuration**:

```javascript
// Test users are automatically created with roles:
{
  FACULTY: { email: "test-faculty@smccd.edu", role: "FACULTY" },
  ADMIN: { email: "test-admin@smccd.edu", role: "ADMIN" },
  STAFF: { email: "test-staff@smccd.edu", role: "STAFF" }
}
```

### 3. Mock Mode

**Use Case**: Unit testing, fastest execution

**Features**:

- Simulated authentication responses
- No network calls
- Minimal dependencies
- Ideal for CI/CD pipelines

**Command**:

```bash
npm run test:auth:mock
```

### 4. Hybrid Mode

**Use Case**: Development with session reuse

**Features**:

- Manual authentication on first run
- Session caching for subsequent runs
- Balance between realism and speed

**Command**:

```bash
npm run test:auth:hybrid
```

## MFA Support

### Supported MFA Methods

1. **Microsoft Authenticator** (recommended)
2. **SMS codes**
3. **Email codes**
4. **Hardware tokens** (if configured)

### MFA Testing Process

1. Enter username and password
2. Wait for MFA prompt
3. Retrieve code from your MFA method:
   - **Authenticator App**: Open app, find SMCCD code
   - **SMS**: Check phone for text message
   - **Email**: Check email for verification code
4. Enter MFA code
5. Test continues automatically

### MFA Configuration

```javascript
// Cypress configuration (cypress.config.ts)
env: {
  MFA_WAIT_TIME: 60000, // 60 seconds for MFA entry
  // Increase if you need more time
}
```

## Session Management

### Session Persistence

Sessions are automatically cached to avoid repeated logins:

```bash
# Sessions are stored in: cypress/cache/session-{ROLE}.json
# Valid for 6 hours by default
```

### Cache Management

```bash
# Clear all cached sessions
npm run test:auth:clear-cache

# Check current cache status
ls -la cypress/cache/session-*.json
```

### Session Validation

Sessions are validated before reuse:

- Token expiry check
- API session verification
- Automatic refresh if needed

## User Role Testing

### Available Roles

1. **FACULTY**: Can create and manage own doorcards
2. **ADMIN**: Full system access, admin panel
3. **STAFF**: View-only access to own doorcards

### Role-Based Testing

```javascript
// Test different roles in a single test
describe("Role-based functionality", () => {
  it("should test FACULTY permissions", () => {
    cy.loginAsRole("FACULTY");
    // Test faculty-specific features
  });

  it("should test ADMIN permissions", () => {
    cy.loginAsRole("ADMIN");
    // Test admin-specific features
  });
});
```

### User Switching

```javascript
// Switch between users during tests
cy.switchUser("ADMIN");
cy.visit("/admin");
cy.contains("Admin Panel").should("be.visible");

cy.switchUser("FACULTY");
cy.visit("/dashboard");
cy.contains("My Doorcards").should("be.visible");
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Authentication Tests
on: [push, pull_request]

jobs:
  auth-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run auth tests
        run: npm run test:auth:ci:auto
        env:
          # Optional: Service account for full OneLogin testing
          ONELOGIN_SERVICE_CLIENT_ID: ${{ secrets.ONELOGIN_SERVICE_CLIENT_ID }}
          ONELOGIN_SERVICE_CLIENT_SECRET:
            ${{ secrets.ONELOGIN_SERVICE_CLIENT_SECRET }}
```

### CI Strategy Selection

The CI system automatically selects the best authentication strategy:

- **Main branch**: Programmatic auth (reliable)
- **Feature branches**: Mock auth (fast)
- **With service account**: Real OneLogin auth
- **Without credentials**: Fallback to programmatic

### Manual CI Override

```bash
# Force specific strategy in CI
npm run test:auth:ci:programmatic
npm run test:auth:ci:mock
npm run test:auth:ci:service  # Requires service account
```

## Troubleshooting

### Common Issues

#### Authentication Timeout

```bash
# Increase MFA timeout
CYPRESS_MFA_WAIT_TIME=120000 npm run test:auth:manual
```

#### Session Expired

```bash
# Clear cache and re-authenticate
npm run test:auth:clear-cache
npm run test:auth:manual
```

#### OneLogin Access Denied

```bash
# Check user permissions
# Verify account has doorcard application access
# Contact IT if needed
```

#### MFA Not Working

```bash
# Verify MFA device is synced
# Try SMS instead of authenticator
# Check time sync on device
```

### Debug Mode

```bash
# Enable debug logging
CYPRESS_AUTH_MODE=manual CYPRESS_DEBUG=true npm run test:auth:manual
```

### Environment Validation

```bash
# Check test environment configuration
npm run test:auth:ci -- --strategy=auto
```

## Best Practices

### Development Workflow

1. **Start with manual mode** for initial test development
2. **Use hybrid mode** for iterative testing
3. **Switch to programmatic** for CI integration
4. **Clear cache** when switching environments

### Test Organization

```javascript
// Group auth tests by role
describe("Faculty Authentication", () => {
  beforeEach(() => {
    cy.authenticateAs("FACULTY");
  });
  // Faculty-specific tests
});

describe("Admin Authentication", () => {
  beforeEach(() => {
    cy.authenticateAs("ADMIN");
  });
  // Admin-specific tests
});
```

### Performance Optimization

1. **Use session caching** in development
2. **Minimize role switching** in single test
3. **Group tests by authentication requirements**
4. **Use mock mode** for non-auth-dependent tests

## API Reference

### Cypress Commands

```javascript
// Main authentication command
cy.authenticateAs(userRole, options);

// Manual OneLogin authentication
cy.interactiveOneLoginAuth(userRole, options);

// Role-based authentication with permission verification
cy.loginAsRole(role);

// Session management
cy.clearAuthSessions();
cy.switchUser(newUserRole);

// MFA simulation (for testing environments)
cy.simulateMFA(code);
```

### Configuration Options

```javascript
{
  persistSession: true,    // Cache session for reuse
  mfaTimeout: 60000,      // MFA entry timeout (ms)
  skipIfCached: true,     // Use cached session if available
}
```

## Security Considerations

### Test Data Safety

- Test users are isolated from production data
- Sessions are scoped to test environment
- Credentials are never stored in code
- Cache files are gitignored

### Production Testing

- Use dedicated test accounts
- Avoid testing in production with real users
- Service accounts have limited permissions
- All test data is clearly marked

## Support

### Resources

- **Documentation**: This guide
- **Example Tests**: `cypress/e2e/interactive-auth-examples.cy.ts`
- **Configuration**: `cypress.config.ts`
- **Scripts**: `scripts/test-auth-*.js`

### Getting Help

1. Check this documentation
2. Review example test files
3. Run debug mode for detailed logs
4. Check CI logs for automated environments

### Common Commands Quick Reference

```bash
# Development
npm run test:auth:manual                    # Manual login with browser
npm run test:auth:hybrid                    # Manual + caching
npm run test:auth:clear-cache              # Reset sessions

# Automated
npm run test:auth:programmatic             # JWT tokens
npm run test:auth:mock                     # Simulated auth

# CI/CD
npm run test:auth:ci:auto                  # Auto-select strategy
npm run test:auth:ci:programmatic          # Force programmatic
npm run test:auth:ci:mock                  # Force mock
```

This authentication testing system provides flexible, robust testing
capabilities for OneLogin integration while maintaining security and usability
across different environments.
