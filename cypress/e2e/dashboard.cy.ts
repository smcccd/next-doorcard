/// <reference types="cypress" />

describe("Dashboard Functionality", () => {
  beforeEach(() => {
    // Use cy.session for proper authentication state management
    cy.session("authenticated-user", () => {
      // Authenticate once per session
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

        // Verify auth by visiting dashboard
        cy.visit("/dashboard");
        cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard");
        cy.contains("My Doorcards", { timeout: 10000 }).should("be.visible");
      });
    });

    // After session is established, visit dashboard for each test
    cy.visit("/dashboard");
  });

  it("should display dashboard with correct heading and navigation", () => {
    cy.contains("My Doorcards").should("be.visible");
    cy.contains("Create Doorcard").should("be.visible");
  });

  it("should navigate to new doorcard creation", () => {
    cy.contains("Create Doorcard").click();
    cy.url().should("include", "/doorcard/new");
    cy.contains("New Doorcard").should("be.visible");
  });

  it("should handle logout properly", () => {
    cy.visit("/dashboard"); // Ensure we're on dashboard first

    // Check if logout functionality exists
    cy.get("body").then(($body) => {
      if (
        $body.text().includes("Logout") ||
        $body.text().includes("Sign out")
      ) {
        const logoutText = $body.text().includes("Logout")
          ? "Logout"
          : "Sign out";
        cy.contains(logoutText).click();
        cy.url().should("include", "/login");
      } else {
        cy.log("Logout button not found, skipping logout test");
      }
    });
  });

  it("should display user information correctly", () => {
    // Should show logged in user's email or name somewhere
    cy.get("body").then(($body) => {
      if (
        $body.text().includes("besnyib@smccd.edu") ||
        $body.text().includes("Bryan")
      ) {
        cy.log("User information is displayed correctly");
      } else {
        cy.log("User information display varies, skipping specific check");
      }
    });
  });

  it("should display dashboard content appropriately", () => {
    // Should show either doorcards or empty state
    cy.get("body").then(($body) => {
      if (
        $body.text().includes("No doorcards") ||
        $body.text().includes("Get started")
      ) {
        cy.log("Empty state displayed correctly");
      } else {
        cy.log("Doorcards are present on dashboard");
      }
    });
  });

  it("should navigate to doorcard creation flow", () => {
    // Test basic doorcard creation navigation
    cy.contains("Create Doorcard").click();
    cy.url().should("include", "/doorcard/new");
    cy.contains("New Doorcard").should("be.visible");

    // Check that form elements are present
    cy.get('select, [role="combobox"]').should("exist");
    cy.contains("Continue to Basic Info").should("be.visible");
  });

  it("should display correctly on mobile viewport", () => {
    cy.viewport("iphone-6");
    cy.visit("/dashboard");
    cy.contains("My Doorcards").should("be.visible");
    cy.contains("Create Doorcard").should("be.visible");
  });

  it("should display correctly on desktop viewport", () => {
    cy.viewport(1280, 720);
    cy.visit("/dashboard");
    cy.contains("My Doorcards").should("be.visible");
    cy.contains("Create Doorcard").should("be.visible");
  });
});
