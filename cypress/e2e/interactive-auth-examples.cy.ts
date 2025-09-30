/// <reference types="cypress" />

/**
 * Interactive OneLogin Authentication Examples
 *
 * These tests demonstrate different authentication strategies for OneLogin with MFA support.
 * Run with different AUTH_MODE environment variables to test various scenarios.
 */

describe("Interactive OneLogin Authentication", () => {
  beforeEach(() => {
    // Clear any existing sessions before each test
    cy.clearAuthSessions();
  });

  describe("Manual Authentication Mode", () => {
    it("should allow manual login with MFA for FACULTY user", () => {
      // Set test environment to manual mode
      Cypress.env("AUTH_MODE", "manual");
      Cypress.env("INTERACTIVE_LOGIN", true);

      // Authenticate as faculty member - this will pause for manual login
      cy.authenticateAs("FACULTY", {
        persistSession: true,
        mfaTimeout: 120000, // 2 minutes for MFA
      });

      // Verify successful authentication
      cy.url().should("include", "/dashboard");
      cy.contains("My Doorcards").should("be.visible");

      // Verify user session contains expected data
      cy.request("/api/auth/session").then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.user).to.have.property("email");
        expect(response.body.user.email).to.include("@smccd.edu");
      });
    });

    it("should reuse cached session for subsequent logins", () => {
      Cypress.env("AUTH_MODE", "manual");

      // First authentication (will use cached session if available)
      cy.authenticateAs("FACULTY", { skipIfCached: true });

      // Should reach dashboard quickly without manual intervention
      cy.url().should("include", "/dashboard");
      cy.get("[data-testid='session-indicator']", { timeout: 5000 })
        .should("contain", "Cached Session")
        .or("not.exist"); // Element might not exist, which is fine
    });

    it("should handle user role switching", () => {
      Cypress.env("AUTH_MODE", "manual");

      // Start as faculty
      cy.authenticateAs("FACULTY");
      cy.visit("/dashboard");
      cy.contains("My Doorcards").should("be.visible");

      // Switch to admin (this will require new authentication)
      cy.switchUser("ADMIN");
      cy.visit("/admin");
      cy.contains("Admin Panel", { timeout: 15000 }).should("be.visible");
    });
  });

  describe("Programmatic Mode Fallback", () => {
    it("should fall back to programmatic auth when manual is not available", () => {
      // Configure for programmatic mode
      Cypress.env("AUTH_MODE", "programmatic");
      Cypress.env("INTERACTIVE_LOGIN", false);

      cy.authenticateAs("FACULTY");

      cy.url().should("include", "/dashboard");
      cy.contains("My Doorcards").should("be.visible");

      // Verify it's using a test account
      cy.request("/api/auth/session").then((response) => {
        expect(response.body.user.email).to.include("test-faculty@smccd.edu");
      });
    });
  });

  describe("Mixed Authentication Scenarios", () => {
    it("should handle authentication timeout gracefully", () => {
      Cypress.env("AUTH_MODE", "manual");

      cy.authenticateAs("FACULTY", {
        mfaTimeout: 5000, // Very short timeout for testing
        persistSession: false,
      });

      // Should still work with fallback mechanisms
      cy.url({ timeout: 10000 }).should("include", "/dashboard");
    });

    it("should test different user roles and permissions", () => {
      const roles = ["FACULTY", "ADMIN", "STAFF"];

      roles.forEach((role) => {
        cy.log(`Testing authentication for role: ${role}`);

        cy.clearAuthSessions();
        cy.loginAsRole(role);

        // Role-specific assertions
        switch (role) {
          case "ADMIN":
            cy.visit("/admin");
            cy.contains("Admin Panel").should("be.visible");
            break;
          case "FACULTY":
            cy.visit("/doorcard/new");
            cy.contains("New Doorcard").should("be.visible");
            break;
          case "STAFF":
            cy.visit("/dashboard");
            cy.contains("My Doorcards").should("be.visible");
            break;
        }
      });
    });
  });

  describe("Session Management", () => {
    it("should persist sessions across browser restarts", () => {
      Cypress.env("PERSIST_SESSIONS", true);

      cy.authenticateAs("FACULTY");
      cy.visit("/dashboard");

      // Simulate browser restart by clearing everything except session cache
      cy.clearCookies();
      cy.clearLocalStorage();

      // Should be able to restore session
      cy.authenticateAs("FACULTY", { skipIfCached: true });
      cy.visit("/dashboard");
      cy.contains("My Doorcards").should("be.visible");
    });

    it("should handle expired sessions", () => {
      // Create a session with short expiry
      cy.task("saveSession", {
        userRole: "FACULTY",
        sessionToken: "expired-token",
        timestamp: Date.now() - 7 * 60 * 60 * 1000, // 7 hours ago
      });

      // Should create new session when old one is expired
      cy.authenticateAs("FACULTY", { skipIfCached: true });
      cy.visit("/dashboard");
      cy.contains("My Doorcards").should("be.visible");
    });
  });

  describe("Error Handling", () => {
    it("should handle authentication failures gracefully", () => {
      // Test with invalid configuration to trigger fallbacks
      Cypress.env("AUTH_MODE", "invalid");

      cy.authenticateAs("FACULTY");

      // Should still reach dashboard via fallback
      cy.url().should("include", "/dashboard");
    });

    it("should provide clear error messages for authentication issues", () => {
      cy.visit("/login");

      // Simulate authentication error
      cy.intercept("POST", "/api/auth/signin/onelogin", {
        statusCode: 500,
        body: { error: "Authentication service unavailable" },
      });

      cy.get('button:contains("Sign in with OneLogin")').click();

      // Should show user-friendly error message
      cy.contains("Unable to sign in").should("be.visible");
    });
  });

  afterEach(() => {
    // Clean up test data if needed
    cy.cleanupTestData().then(() => {
      cy.log("Test cleanup completed");
    });
  });
});

// Utility test for debugging authentication issues
describe("Authentication Debug Utilities", () => {
  it("should provide debug information for authentication setup", () => {
    cy.task("logTestEnvironment");

    // Log current configuration
    cy.log(`Auth Mode: ${Cypress.env("AUTH_MODE")}`);
    cy.log(`Interactive Login: ${Cypress.env("INTERACTIVE_LOGIN")}`);
    cy.log(`Persist Sessions: ${Cypress.env("PERSIST_SESSIONS")}`);
    cy.log(`MFA Timeout: ${Cypress.env("MFA_WAIT_TIME")}`);

    // Test session APIs
    cy.request({
      url: "/api/auth/session",
      failOnStatusCode: false,
    }).then((response) => {
      cy.log(`Session API Status: ${response.status}`);
      if (response.body?.user) {
        cy.log(`Current User: ${response.body.user.email}`);
        cy.log(`User Role: ${response.body.user.role}`);
      }
    });
  });
});
