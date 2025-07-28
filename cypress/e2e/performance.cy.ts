/// <reference types="cypress" />

describe("Performance Testing", () => {
  beforeEach(() => {
    cy.simpleLogin();
  });

  it("should load dashboard within performance budget", () => {
    const startTime = Date.now();
    cy.visit("/dashboard");
    cy.contains("My Doorcards")
      .should("be.visible")
      .then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // 5 second budget
      });
  });

  it("should load login page quickly", () => {
    cy.clearCookies();
    cy.clearLocalStorage();

    const startTime = Date.now();
    cy.visit("/login");
    cy.contains("Login")
      .should("be.visible")
      .then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3 second budget for login
      });
  });

  it("should have fast API response times", () => {
    const startTime = Date.now();
    cy.request("/api/auth/session").then((response) => {
      const responseTime = Date.now() - startTime;
      expect(response.status).to.eq(200);
      expect(responseTime).to.be.lessThan(2000); // API should respond within 2 seconds
    });
  });
});
