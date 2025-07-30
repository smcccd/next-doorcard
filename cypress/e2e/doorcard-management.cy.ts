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

        cy.visit("/dashboard");
        cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard");
        cy.contains("My Doorcards", { timeout: 10000 }).should("be.visible");
      });
    });
  });

  it("should navigate to doorcard creation", () => {
    cy.visit("/dashboard");
    cy.contains("Create Doorcard").click();
    cy.url().should("include", "/doorcard/new");
    cy.contains("New Doorcard").should("be.visible");
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
