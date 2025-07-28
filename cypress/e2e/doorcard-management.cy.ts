/// <reference types="cypress" />

describe("Doorcard Management", () => {
  beforeEach(() => {
    cy.simpleLogin();
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
