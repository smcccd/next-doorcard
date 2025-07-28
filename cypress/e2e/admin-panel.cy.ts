/// <reference types="cypress" />

describe("Admin Panel Functionality", () => {
  beforeEach(() => {
    cy.simpleLogin();
  });

  it("should navigate to admin panel", () => {
    cy.visit("/admin");
    cy.url().should("include", "/admin");
  });

  it("should display admin panel layout", () => {
    cy.visit("/admin");
    cy.get("body").should("be.visible");
    cy.get("main, .main, [role='main'], h1, h2").should("exist");
  });

  it("should handle admin panel content", () => {
    cy.visit("/admin");
    cy.get("body").should("be.visible");
  });
});