/// <reference types="cypress" />

describe("API Endpoints", () => {
  beforeEach(() => {
    cy.simpleLogin();
  });

  it("should access session endpoint", () => {
    cy.request("/api/auth/session").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("user");
    });
  });

  it("should handle protected routes", () => {
    cy.visit("/dashboard");
    cy.contains("My Doorcards").should("be.visible");
  });

  it("should handle API requests with authentication", () => {
    cy.request({
      url: "/api/auth/session",
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 401]);
    });
  });
});
