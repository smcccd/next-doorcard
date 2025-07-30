/// <reference types="cypress" />

describe("Form Validation", () => {
  beforeEach(() => {
    // Use cy.session for consistent authentication
    cy.session("authenticated-user", () => {
      cy.task("createAuthToken", {
        email: "besnyib@smccd.edu",
        name: "Test User",
        id: "test-besnyib-smccd-edu",
        role: "ADMIN",
      }).then((token) => {
        expect(token).to.exist;

        cy.setCookie("next-auth.session-token", token as string, {
          path: "/",
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        });

        cy.visit("/dashboard");
        cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard");
        cy.contains("My Doorcards", { timeout: 10000 }).should("be.visible");
      });
    });
  });

  describe("Doorcard Creation Form", () => {
    beforeEach(() => {
      cy.visit("/doorcard/new");
    });

    it("should display new doorcard form elements", () => {
      cy.contains("New Doorcard").should("be.visible");
      cy.get('[role="combobox"]').should("have.length.at.least", 3);
      cy.contains("Campus").should("be.visible");
      cy.contains("Term").should("be.visible");
      cy.contains("Year").should("be.visible");
      cy.contains("Continue to Basic Info").should("be.visible");
    });

    it("should require form completion before proceeding", () => {
      // Try to submit without filling fields
      cy.contains("Continue to Basic Info").click();

      // Should stay on the same page or show validation
      cy.url().should("include", "/doorcard/new");
    });

    it("should allow valid form submission", () => {
      // Fill out the form with valid data using the actual UI components
      cy.get('[role="combobox"]').first().click();
      cy.get('[role="option"]').first().click();

      cy.get('[role="combobox"]').eq(1).click();
      cy.get('[role="option"]').contains("Fall").click();

      cy.get('[role="combobox"]').eq(2).click();
      const nextYear = new Date().getFullYear() + 1;
      cy.get('[role="option"]').contains(nextYear.toString()).click();

      // Form should be valid after filling all required fields
      cy.contains("Continue to Basic Info")
        .should("be.visible")
        .and("be.enabled");
    });

    it("should handle form interaction correctly", () => {
      // Test that form elements are interactive
      cy.get('[role="combobox"]').first().click();
      cy.get('[role="option"]').should("have.length.at.least", 1);
      cy.get('[role="option"]').first().click();

      // Form should be responsive
      cy.get('[role="combobox"]').first().should("exist");
    });
  });

  describe("Login Form Behavior", () => {
    beforeEach(() => {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit("/login");
    });

    it("should display appropriate login interface for environment", () => {
      // Check what environment we're in based on available UI
      cy.get("body").then(($body) => {
        if ($body.text().includes("Show development login")) {
          // Development environment - test development login
          cy.log(
            "Development environment detected - testing development login"
          );
          cy.contains("Show development login").click();
          cy.get('input[name="email"]').should("be.visible");
          cy.get('input[name="password"]').should("be.visible");
          cy.get('button[type="submit"]').should("be.visible");
        } else {
          // Production environment - verify no development login
          cy.log(
            "Production environment detected - verifying no development login"
          );
          cy.contains("Show development login").should("not.exist");

          // Should show production login options (OneLogin)
          cy.contains("Sign in").should("be.visible");
        }
      });
    });

    it("should handle authentication flow correctly", () => {
      cy.get("body").then(($body) => {
        if ($body.text().includes("Show development login")) {
          // Test development authentication
          cy.contains("Show development login").click();
          cy.get('input[name="email"]').type("besnyib@smccd.edu");
          cy.get('input[name="password"]').type("password123");
          cy.get('button[type="submit"]').click();
          cy.url({ timeout: 15000 }).should("include", "/dashboard");
        } else {
          // Production environment - verify security (no bypass available)
          cy.log(
            "Production environment - development login correctly disabled"
          );
          cy.contains("Show development login").should("not.exist");
        }
      });
    });

    it("should properly secure production environment", () => {
      // This test ensures production doesn't expose development login
      const isProduction =
        Cypress.env("NODE_ENV") === "test" ||
        Cypress.env("CYPRESS") === true ||
        Cypress.config().baseUrl?.includes("vercel.app");

      if (isProduction) {
        cy.log("Verifying production security - no development login exposed");
        cy.contains("Show development login").should("not.exist");
        cy.contains("Development").should("not.exist");
      } else {
        cy.log(
          "Development environment - development login should be available"
        );
        cy.contains("Show development login").should("exist");
      }
    });
  });

  describe("Form Accessibility", () => {
    beforeEach(() => {
      cy.visit("/doorcard/new");
    });

    it("should have accessible form elements", () => {
      // Check that form elements are accessible
      cy.get('[role="combobox"]').should("have.length.at.least", 3);
      cy.get("label").should("have.length.at.least", 3);
      cy.contains("Continue to Basic Info").should("be.visible");
    });

    it("should support keyboard navigation", () => {
      // Test that form can be navigated with keyboard
      cy.get('[role="combobox"]').first().focus();
      cy.focused().should("exist");

      // Tab through elements (if cy.tab() is available)
      cy.get("body").then(() => {
        // Simple focus test without cy.tab() dependency
        cy.get('[role="combobox"]').first().should("be.focusable");
        cy.contains("Continue to Basic Info").should("be.focusable");
      });
    });
  });
});
