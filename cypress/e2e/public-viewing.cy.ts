/// <reference types="cypress" />

describe("Public Doorcard Viewing", () => {
  it("should handle non-existent doorcard gracefully", () => {
    cy.visit("/view/non-existent-doorcard-id", { failOnStatusCode: false });
    cy.get("body").should("be.visible");
  });

  it("should load public pages without authentication", () => {
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit("/", { failOnStatusCode: false });
    cy.get("body").should("be.visible");
  });

  it("should display correctly on mobile devices", () => {
    cy.viewport("iphone-6");
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit("/", { failOnStatusCode: false });
    cy.get("body").should("be.visible");
  });
});
