/// <reference types="cypress" />

describe("Doorcard Management", () => {
  beforeEach(() => {
    // Use the proven working authentication approach
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

        // Set cypress test identifier cookie
        cy.setCookie("cypress-test", "true", {
          path: "/",
          httpOnly: false,
          secure: false,
          sameSite: "lax",
        });

        // Add debugging to see what's happening
        cy.log("Token set, visiting dashboard");

        // Set custom header to help with detection
        cy.intercept("**", (req) => {
          req.headers["x-cypress-test"] = "true";
        });

        cy.visit("/dashboard");
        cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard");
        cy.contains("My Doorcards", { timeout: 10000 }).should("be.visible");
      });
    });
  });

  it("should navigate to doorcard creation", () => {
    cy.visit("/dashboard");

    // Wait for dashboard to load completely
    cy.contains("My Doorcards", { timeout: 10000 }).should("be.visible");

    // Wait for any loading states to complete and hydration to finish
    cy.get("body").should("not.contain", "Loading");

    // Wait for the Create Doorcard button to be fully loaded and interactive
    cy.get('[data-testid="create-doorcard-button"]')
      .should("be.visible")
      .should("not.be.disabled")
      .should("contain", "Create Doorcard") // Ensure it's not showing "Loading..."
      .wait(1000) // Give extra time for hydration and JS to initialize
      .click();

    // Wait for navigation to complete with more specific checks
    cy.location("pathname", { timeout: 15000 }).should(
      "include",
      "/doorcard/new"
    );
    cy.contains("New Doorcard", { timeout: 10000 }).should("be.visible");

    // Verify we're actually on the right page
    cy.url().should("include", "/doorcard/new");
  });

  it("should display form elements", () => {
    cy.visit("/doorcard/new");
    cy.get('[role="combobox"]').should("have.length.at.least", 3);
    cy.contains("Continue to Basic Info").should("be.visible");
  });

  it("should handle dashboard navigation", () => {
    cy.visit("/dashboard");
    cy.contains("My Doorcards").should("be.visible");
    cy.contains("Create Doorcard").should("be.visible");
  });
});
