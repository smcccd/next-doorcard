// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Import accessibility testing
import "cypress-axe";

// Import cypress testing library commands
import "@testing-library/cypress/add-commands";

// Import real events for better user simulation
import "cypress-real-events/support";

// Add custom commands for better accessibility testing
Cypress.Commands.add("tab", { prevSubject: "optional" }, (subject) => {
  return cy.realPress("Tab");
});

declare global {
  namespace Cypress {
    interface Chainable {
      tab(): Chainable<void>;
      checkServer(): Chainable<void>;
      waitForServer(): Chainable<void>;
      login(email: string, password: string): Chainable<void>;
      loginAsTestUser(): Chainable<void>;
      fastLogin(userEmail?: string, userName?: string): Chainable<void>;
      simpleLogin(userEmail?: string): Chainable<void>;
      createTestDoorcard(options?: any): Chainable<any>;
      deleteDoorcard(doorcardId: string): Chainable<any>;
      checkAccessibility(): Chainable<void>;
    }
  }
}
