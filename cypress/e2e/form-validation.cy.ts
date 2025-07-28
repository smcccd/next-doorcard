/// <reference types="cypress" />

describe("Form Validation", () => {
  beforeEach(() => {
    cy.simpleLogin();
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

  describe("Login Form (Development Mode)", () => {
    beforeEach(() => {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit("/login");
    });

    it("should display login form in development mode", () => {
      cy.contains("Show development login").click();
      cy.get('input[name="email"]').should("be.visible");
      cy.get('input[name="password"]').should("be.visible");
      cy.get('button[type="submit"]').should("be.visible");
    });

    it("should handle empty form submission", () => {
      cy.contains("Show development login").click();
      cy.get('button[type="submit"]').click();

      // Should either show validation or stay on login page
      cy.url().should("include", "/login");
    });

    it("should accept valid credentials", () => {
      cy.contains("Show development login").click();
      cy.get('input[name="email"]').type("besnyib@smccd.edu");
      cy.get('input[name="password"]').type("password123");
      cy.get('button[type="submit"]').click();

      cy.url({ timeout: 15000 }).should("include", "/dashboard");
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

      // Tab through elements
      cy.tab();
      cy.focused().should("exist");
    });
  });
});
