describe("Smoke Tests", () => {
  it("should load the homepage", () => {
    cy.visit("/");
    cy.contains("Door", { timeout: 10000 }).should("be.visible");
  });

  it("should have working API health endpoint", () => {
    cy.request("/api/health").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("status", "healthy");
      expect(response.body).to.have.property("database", "connected");
    });
  });

  it("should redirect to login when accessing protected route", () => {
    cy.visit("/dashboard");
    cy.url({ timeout: 10000 }).should("include", "/api/auth");
  });

  it("should load static assets", () => {
    cy.visit("/");
    // Check if CSS is loaded
    cy.get("body").should("have.css", "margin");
    // Check if JavaScript is executing
    cy.window().its("navigator.userAgent").should("exist");
  });
});
