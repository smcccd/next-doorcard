/// <reference types="cypress" />

describe("Accessibility Testing", () => {
  beforeEach(() => {
    cy.simpleLogin();
  });

  it("should have accessible dashboard elements", () => {
    cy.visit("/dashboard");
    cy.contains("My Doorcards").should("be.visible");

    // Check for basic accessibility elements
    cy.get("button").should("exist");
    cy.get("a").should("exist");
  });

  it("should have accessible form elements", () => {
    cy.visit("/doorcard/new");
    cy.get('[role="combobox"]').should("have.length.at.least", 3);
    cy.get("label").should("have.length.at.least", 3);
  });

  it("should support keyboard navigation", () => {
    cy.visit("/dashboard");
    cy.get("button").first().focus();
    cy.focused().should("exist");
  });
});
