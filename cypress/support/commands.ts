/// <reference types="cypress" />

// Custom command to check if server is running
Cypress.Commands.add("checkServer", () => {
  cy.task("ping").then((isServerRunning) => {
    if (!isServerRunning) {
      throw new Error(
        "Server is not running at " +
          Cypress.config("baseUrl") +
          ". Please start your development server before running tests.",
      );
    }
  });
});

// Custom command to wait for server to be ready
Cypress.Commands.add("waitForServer", () => {
  cy.request({
    method: "GET",
    url: "/",
    retryOnStatusCodeFailure: true,
    timeout: 30000,
  }).then(() => {
    cy.log("✅ Server is ready");
  });
});

// Custom command to log in a user
Cypress.Commands.add("login", (email, password) => {
  cy.session(
    [email, password],
    () => {
      cy.visit("/login");

      // Wait for the page to load and then click "Show development login"
      cy.contains("Show development login", { timeout: 10000 })
        .should("be.visible")
        .click();

      // Wait for the form to appear and then fill it out
      cy.get('input[name="email"]', { timeout: 10000 })
        .should("be.visible")
        .clear()
        .type(email);
      if (password) {
        cy.get('input[name="password"]', { timeout: 10000 })
          .should("be.visible")
          .clear()
          .type(password);
      }
      cy.get('button[type="submit"]').should("be.visible").click();
      cy.url().should("include", "/dashboard");
    },
    {
      cacheAcrossSpecs: true,
      validate: () => {
        cy.getCookie("next-auth.session-token").should("exist");
      },
    },
  );
});

// Custom command to log in as the main test user
Cypress.Commands.add("loginAsTestUser", () => {
  cy.session(
    "test-user-session",
    () => {
      cy.visit("/login");

      // Wait for the page to load and then click "Show development login"
      cy.contains("Show development login", { timeout: 10000 })
        .should("be.visible")
        .click();

      // Wait for the form to appear and then fill it out
      cy.get('input[name="email"]', { timeout: 10000 })
        .should("be.visible")
        .clear()
        .type("besnyib@smccd.edu");
      cy.get('input[name="password"]', { timeout: 10000 })
        .should("be.visible")
        .clear()
        .type("password123");
      cy.get('button[type="submit"]').should("be.visible").click();

      // Wait for authentication to complete fully
      cy.url({ timeout: 15000 }).should("include", "/dashboard");

      // Critical: Wait for session cookie to be set
      cy.getCookie("next-auth.session-token", { timeout: 10000 }).should(
        "exist",
      );

      // Additional guard: Ensure the session is fully established
      cy.window().then((win) => {
        // Wait a bit for any async auth processes to complete
        cy.wait(1000);
      });
    },
    {
      cacheAcrossSpecs: true,
      validate: () => {
        // More reliable validation: check both cookie and API response
        cy.getCookie("next-auth.session-token").should("exist");
        cy.request({
          url: "/api/auth/session",
          failOnStatusCode: false,
          timeout: 10000,
        }).then((resp) => {
          expect(resp.status).to.eq(200);
          expect(resp.body).to.have.property("user");
          expect(resp.body.user).to.have.property("email");
        });
      },
    },
  );
});

// Fast JWT-based login command that bypasses the full authentication flow
Cypress.Commands.add(
  "fastLogin",
  (userEmail = "besnyib@smccd.edu", userName = "Test User") => {
    cy.session(
      `fast-login-${userEmail}`,
      () => {
        // Create a JWT token directly without going through the login flow
        cy.task("createAuthToken", {
          email: userEmail,
          name: userName,
          id: `test-${userEmail.replace("@", "-").replace(".", "-")}`,
          role: "ADMIN",
        }).then((token) => {
          if (!token) {
            throw new Error("Failed to create auth token");
          }

          cy.log("Setting auth token cookie");
          cy.setCookie("next-auth.session-token", token as string, {
            domain: "localhost",
            path: "/",
            httpOnly: true,
            secure: false,
            sameSite: "lax",
          });

          // Verify the token was set
          cy.getCookie("next-auth.session-token").should("exist");
        });

        // Verify the token works by visiting a protected page
        cy.visit("/dashboard");
        cy.url({ timeout: 10000 }).should("include", "/dashboard");
        cy.contains("My Doorcards", { timeout: 5000 }).should("be.visible");
      },
      {
        cacheAcrossSpecs: true,
        validate: () => {
          cy.getCookie("next-auth.session-token").should("exist");
          cy.request({
            url: "/api/auth/session",
            failOnStatusCode: false,
            timeout: 5000,
          }).then((resp) => {
            expect(resp.status).to.eq(200);
            expect(resp.body).to.have.property("user");
          });
        },
      },
    );
  },
);

// Simple login command for tests (no session caching to avoid timeouts)
Cypress.Commands.add("simpleLogin", (userEmail = "besnyib@smccd.edu") => {
  cy.visit("/login");
  cy.contains("Show development login", { timeout: 10000 })
    .should("be.visible")
    .click();
  cy.get('input[name="email"]', { timeout: 10000 })
    .should("be.visible")
    .clear()
    .type(userEmail);
  cy.get('input[name="password"]', { timeout: 10000 })
    .should("be.visible")
    .clear()
    .type("password123");
  cy.get('button[type="submit"]').should("be.visible").click();
  cy.url({ timeout: 15000 }).should("include", "/dashboard");
  cy.contains("My Doorcards", { timeout: 10000 }).should("be.visible");
});

// Custom command to create a test doorcard
Cypress.Commands.add("createTestDoorcard", (options = {}) => {
  const defaults = {
    campus: "SKYLINE",
    term: "FALL",
    year: new Date().getFullYear() + 1,
    name: "Test Professor",
    doorcardName: "Test Doorcard",
    officeNumber: "Room 123",
    email: "test@smccd.edu",
    phone: "(650) 123-4567",
    appointments: [],
  };

  const doorcardData = { ...defaults, ...options };

  return cy
    .request({
      method: "POST",
      url: "/api/doorcards",
      body: doorcardData,
    })
    .then((response) => {
      expect(response.status).to.be.oneOf([200, 201]);
      return response.body.doorcard;
    });
});

// Custom command to delete a doorcard
Cypress.Commands.add("deleteDoorcard", (doorcardId) => {
  return cy.request({
    method: "DELETE",
    url: `/api/doorcards/${doorcardId}`,
    failOnStatusCode: false,
  });
});

// Custom command to clean up test data
Cypress.Commands.add("cleanupTestData", () => {
  // Clean up drafts
  cy.request({
    method: "DELETE",
    url: "/api/doorcards/draft?all=true",
    failOnStatusCode: false,
  });

  // Get all doorcards and delete test ones
  cy.request({
    method: "GET",
    url: "/api/doorcards",
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200 && response.body.doorcards) {
      response.body.doorcards.forEach((doorcard: any) => {
        if (
          doorcard.name?.includes("Test") ||
          doorcard.doorcardName?.includes("Test") ||
          doorcard.name?.includes("API") ||
          doorcard.name?.includes("Cypress")
        ) {
          cy.deleteDoorcard(doorcard.id);
        }
      });
    }
  });
});

// Custom command to wait for element with better error handling
Cypress.Commands.add("waitForElement", (selector, options = {}) => {
  const defaultOptions = { timeout: 10000, ...options };
  return cy.get(selector, defaultOptions).should("be.visible");
});

// Custom command to fill out doorcard form step by step
Cypress.Commands.add("fillDoorcardForm", (formData) => {
  // Step 1: Campus, Term, Year
  if (formData.campus) {
    cy.get("#college").click();
    cy.contains('[role="option"]', formData.campus).click();
  }
  if (formData.term) {
    cy.get("#term").click();
    cy.contains('[role="option"]', formData.term).click();
  }
  if (formData.year) {
    cy.get("#year").click();
    cy.contains('[role="option"]', formData.year.toString()).click();
  }
  if (formData.campus && formData.term && formData.year) {
    cy.contains("button", "Next").click();
  }

  // Step 2: Basic Information
  if (formData.name) {
    cy.get("#name").clear().type(formData.name);
  }
  if (formData.doorcardName) {
    cy.get("#doorcardName").clear().type(formData.doorcardName);
  }
  if (formData.officeNumber) {
    cy.get("#officeNumber").clear().type(formData.officeNumber);
  }
  if (formData.email) {
    cy.get("#email").clear().type(formData.email);
  }
  if (formData.phone) {
    cy.get("#phone").clear().type(formData.phone);
  }
  if (formData.name && formData.doorcardName) {
    cy.contains("button", "Next").click();
  }

  // Step 3: Time Blocks
  if (formData.appointments && formData.appointments.length > 0) {
    formData.appointments.forEach((appointment: any) => {
      cy.get("#day").click();
      cy.contains('[role="option"]', appointment.day).click();
      cy.get("#activity").click();
      cy.contains('[role="option"]', appointment.activity).click();
      cy.get("#category").click();
      cy.contains('[role="option"]', appointment.category).click();
      cy.get("#location").clear().type(appointment.location);
      cy.get("#startTime").clear().type(appointment.startTime);
      cy.get("#endTime").clear().type(appointment.endTime);
      cy.contains("button", "Add Time Block").click();
    });
  }
});

// Custom command to check accessibility with better reporting
Cypress.Commands.add("checkAccessibility", (context?, options?) => {
  cy.injectAxe();
  cy.checkA11y(context, options, (violations) => {
    if (violations.length > 0) {
      cy.log(`Found ${violations.length} accessibility violations:`);
      violations.forEach((violation) => {
        cy.log(`- ${violation.id}: ${violation.description}`);
      });
    }
  });
});

// Custom command to simulate realistic user typing
Cypress.Commands.add(
  "typeRealistic",
  { prevSubject: "element" },
  (subject, text, options = {}) => {
    const defaultOptions = { delay: 50, ...options };
    return cy.wrap(subject).type(text, defaultOptions);
  },
);

// Custom command to handle form validation more reliably
Cypress.Commands.add("submitFormAndCheckValidation", (expectedErrors = []) => {
  cy.get(
    'button[type="submit"], button:contains("Next"), button:contains("Submit")',
  ).click();

  expectedErrors.forEach((error) => {
    cy.contains(error).should("be.visible");
  });

  return expectedErrors.length === 0;
});

// Declare custom commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      checkServer(): Chainable<void>;
      waitForServer(): Chainable<void>;
      login(email: string, password: string): Chainable<void>;
      loginAsTestUser(): Chainable<void>;
      fastLogin(userEmail?: string, userName?: string): Chainable<void>;
      createTestDoorcard(options?: any): Chainable<any>;
      deleteDoorcard(doorcardId: string): Chainable<any>;
      cleanupTestData(): Chainable<void>;
      waitForElement(
        selector: string,
        options?: any,
      ): Chainable<JQuery<HTMLElement>>;
      fillDoorcardForm(formData: any): Chainable<void>;
      checkAccessibility(context?: any, options?: any): Chainable<void>;
      typeRealistic(text: string, options?: any): Chainable<void>;
      submitFormAndCheckValidation(
        expectedErrors?: string[],
      ): Chainable<boolean>;
    }
  }
}

export {};
