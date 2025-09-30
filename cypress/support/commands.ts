/// <reference types="cypress" />

// Custom command to check if server is running
Cypress.Commands.add("checkServer", () => {
  cy.task("ping").then((isServerRunning) => {
    if (!isServerRunning) {
      throw new Error(
        "Server is not running at " +
          Cypress.config("baseUrl") +
          ". Please start your development server before running tests."
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
    }
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
        "exist"
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
    }
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

          // Determine if we're in production environment
          const isProduction =
            Cypress.config().baseUrl?.includes("vercel.app") ||
            Cypress.config().baseUrl?.includes("https://");

          // Extract domain from baseUrl for production
          let cookieDomain = "localhost";
          if (isProduction && Cypress.config().baseUrl) {
            try {
              const url = new URL(Cypress.config().baseUrl);
              cookieDomain = url.hostname;
            } catch (e) {
              cy.log("Could not parse baseUrl, defaulting to localhost");
            }
          }

          // Set cookie without domain for localhost, with domain for production
          const cookieOptions: any = {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
          };

          if (isProduction) {
            cookieOptions.domain = cookieDomain;
            cookieOptions.secure = true;
          } else {
            cookieOptions.secure = false;
          }

          cy.setCookie(
            "next-auth.session-token",
            token as string,
            cookieOptions
          );

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
      }
    );
  }
);

// Production-ready login command that works in all environments
Cypress.Commands.add(
  "productionLogin",
  (userEmail = "besnyib@smccd.edu", userName = "Test User") => {
    // Always use programmatic authentication for reliability
    cy.task("createAuthToken", {
      email: userEmail,
      name: userName,
      id: `test-${userEmail.replace("@", "-").replace(".", "-")}`,
      role: "ADMIN",
    }).then((token) => {
      if (!token) {
        throw new Error("Failed to create auth token");
      }

      // Determine environment settings
      const isProduction =
        Cypress.config().baseUrl?.includes("vercel.app") ||
        Cypress.config().baseUrl?.includes("https://");

      let cookieDomain = "localhost";
      if (isProduction && Cypress.config().baseUrl) {
        try {
          const url = new URL(Cypress.config().baseUrl);
          cookieDomain = url.hostname;
        } catch (e) {
          cy.log("Could not parse baseUrl, defaulting to localhost");
        }
      }

      // Set cookie without domain restriction for localhost
      cy.setCookie("next-auth.session-token", token as string, {
        path: "/",
        httpOnly: true,
        secure: false, // Always false for localhost testing
        sameSite: "lax",
      });

      // Verify the token was set before navigation
      cy.getCookie("next-auth.session-token")
        .should("exist")
        .then((cookie) => {
          cy.log(`Auth cookie set: ${cookie?.value?.substring(0, 50)}...`);
        });

      // Test the auth session endpoint first to ensure token works
      cy.request({
        url: "/api/auth/session",
        failOnStatusCode: false,
      }).then((resp) => {
        cy.log(`Session API response: ${resp.status}`);
        if (resp.body?.user) {
          cy.log(`✅ Auth working - user: ${resp.body.user.email}`);
        } else {
          cy.log(
            `❌ Auth not working - response: ${JSON.stringify(resp.body)}`
          );
        }
      });

      // Navigate directly to dashboard - no login page needed
      cy.visit("/dashboard");

      // Wait for page to load and check URL
      cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard");
      cy.contains("My Doorcards", { timeout: 10000 }).should("be.visible");
    });
  }
);

// Simple login command for tests - always uses programmatic auth for reliability
Cypress.Commands.add("simpleLogin", (userEmail = "besnyib@smccd.edu") => {
  // Use the exact same approach as the working auth-test.cy.ts
  cy.task("createAuthToken", {
    email: userEmail,
    name: "Test User",
    id: `test-${userEmail.replace("@", "-").replace(".", "-")}`,
    role: "ADMIN",
  }).then((token) => {
    expect(token).to.exist;

    // Set the cookie exactly as in the working test
    cy.setCookie("next-auth.session-token", token as string, {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    // Verify cookie was set
    cy.getCookie("next-auth.session-token").should("exist");

    // Navigate to dashboard directly - this is what works in the standalone test
    cy.visit("/dashboard");

    // Check final URL - if it includes /login, auth failed; if /dashboard, success
    cy.location("pathname", { timeout: 10000 }).then((pathname) => {
      if (pathname === "/login") {
        throw new Error("Authentication failed - redirected to login");
      }
      expect(pathname).to.equal("/dashboard");
    });

    cy.contains("My Doorcards", { timeout: 10000 }).should("be.visible");
  });
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

// Interactive OneLogin authentication with MFA support
Cypress.Commands.add("interactiveOneLoginAuth", (userRole = "FACULTY", options = {}) => {
  const defaultOptions = {
    persistSession: Cypress.env("PERSIST_SESSIONS") || true,
    mfaTimeout: Cypress.env("MFA_WAIT_TIME") || 60000,
    skipIfCached: true,
    ...options
  };

  const sessionKey = `onelogin-${userRole}`;

  cy.session(
    sessionKey,
    () => {
      // Check for cached session first
      if (defaultOptions.skipIfCached && defaultOptions.persistSession) {
        cy.task("loadSession", userRole).then((cachedSession) => {
          if (cachedSession) {
            cy.log(`Using cached session for ${userRole}`);
            cy.setCookie("next-auth.session-token", cachedSession.sessionToken, {
              path: "/",
              httpOnly: true,
              secure: false,
              sameSite: "lax",
            });
            return;
          }
        });
      }

      cy.log(`Starting interactive OneLogin authentication for ${userRole}`);
      
      // Navigate to login page
      cy.visit("/login");
      
      // Click OneLogin signin button
      cy.get('button:contains("Sign in with OneLogin")')
        .should("be.visible")
        .click();

      // Wait for OneLogin redirect - user will manually enter credentials
      cy.origin("https://smccd.onelogin.com", () => {
        cy.log("🔐 MANUAL LOGIN REQUIRED");
        cy.log("Please enter your OneLogin credentials in the browser");
        cy.log("This test will wait for you to complete authentication...");
        
        // Wait for OneLogin login form
        cy.get('input[type="email"], input[name="username"], input[name="user_name"]', 
          { timeout: 10000 }
        ).should("be.visible");

        // Pause execution and display instructions
        cy.window().then((win) => {
          // Create a visual overlay with instructions
          const overlay = win.document.createElement("div");
          overlay.innerHTML = `
            <div style="
              position: fixed; 
              top: 0; 
              left: 0; 
              width: 100%; 
              height: 100%; 
              background: rgba(0,0,0,0.8); 
              z-index: 10000; 
              display: flex; 
              justify-content: center; 
              align-items: center;
              font-family: Arial, sans-serif;
            ">
              <div style="
                background: white; 
                padding: 30px; 
                border-radius: 10px; 
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
              ">
                <h2 style="color: #333; margin-bottom: 20px;">🔐 Manual Login Required</h2>
                <p style="color: #666; margin-bottom: 15px;">Please complete the OneLogin authentication:</p>
                <ol style="text-align: left; color: #666; margin-bottom: 20px;">
                  <li>Enter your SMCCD username and password</li>
                  <li>Complete MFA challenge (if prompted)</li>
                  <li>Wait for redirect to dashboard</li>
                </ol>
                <p style="color: #999; font-size: 12px;">Test will continue automatically after authentication</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                  style="background: #007cba; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                  I understand - Continue
                </button>
              </div>
            </div>
          `;
          win.document.body.appendChild(overlay);
        });

        // Wait for user to manually complete authentication
        // Look for redirect back to application or success indicators
        cy.url({ timeout: defaultOptions.mfaTimeout }).should("not.contain", "onelogin.com");
      });

      // Back in the main application - verify authentication succeeded
      cy.url({ timeout: 15000 }).should("include", "/dashboard");
      cy.contains("My Doorcards", { timeout: 10000 }).should("be.visible");

      // Save session for reuse if persistence is enabled
      if (defaultOptions.persistSession) {
        cy.getCookie("next-auth.session-token").then((cookie) => {
          if (cookie) {
            cy.task("saveSession", {
              userRole,
              sessionToken: cookie.value,
              timestamp: Date.now()
            });
          }
        });
      }
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
    }
  );
});

// Flexible authentication command that adapts to testing mode
Cypress.Commands.add("authenticateAs", (userRole = "FACULTY", options = {}) => {
  const authMode = Cypress.env("AUTH_MODE") || "manual";
  
  cy.task("logTestEnvironment");
  
  switch (authMode) {
    case "manual":
    case "interactive":
      return cy.interactiveOneLoginAuth(userRole, options);
      
    case "programmatic":
      const userConfig = Cypress.env("ONELOGIN_TEST_USERS")[userRole] || 
                        { role: userRole, college: "SKYLINE" };
      return cy.fastLogin(`test-${userRole.toLowerCase()}@smccd.edu`, `Test ${userRole}`, userConfig);
      
    case "mock":
      return cy.simpleLogin(`mock-${userRole.toLowerCase()}@smccd.edu`);
      
    default:
      // Fallback: try manual first, then programmatic
      if (Cypress.env("INTERACTIVE_LOGIN")) {
        return cy.interactiveOneLoginAuth(userRole, options);
      } else {
        return cy.fastLogin(`fallback-${userRole.toLowerCase()}@smccd.edu`, `Test ${userRole}`);
      }
  }
});

// Session management commands
Cypress.Commands.add("clearAuthSessions", () => {
  cy.task("clearSessions");
  cy.clearCookies();
  cy.clearLocalStorage();
});

Cypress.Commands.add("switchUser", (newUserRole) => {
  cy.log(`Switching from current user to ${newUserRole}`);
  cy.clearAuthSessions();
  cy.authenticateAs(newUserRole);
});

// MFA simulation for testing environments
Cypress.Commands.add("simulateMFA", (code = "123456") => {
  // Look for common MFA input patterns
  const mfaSelectors = [
    'input[name*="code"]',
    'input[name*="token"]', 
    'input[name*="otp"]',
    'input[placeholder*="code"]',
    'input[type="tel"][maxlength="6"]',
    'input[autocomplete*="one-time-code"]'
  ];

  mfaSelectors.forEach(selector => {
    cy.get("body").then($body => {
      if ($body.find(selector).length > 0) {
        cy.get(selector).type(code);
        cy.get('button[type="submit"], button:contains("Verify"), button:contains("Continue")')
          .first()
          .click();
        return;
      }
    });
  });
});

// Enhanced login with role-based testing
Cypress.Commands.add("loginAsRole", (role) => {
  const roles = {
    FACULTY: { email: "faculty@smccd.edu", permissions: ["view_own_doorcards", "create_doorcard"] },
    ADMIN: { email: "admin@smccd.edu", permissions: ["view_all_doorcards", "admin_panel"] },
    STAFF: { email: "staff@smccd.edu", permissions: ["view_own_doorcards"] }
  };

  const roleConfig = roles[role] || roles.FACULTY;
  
  cy.authenticateAs(role).then(() => {
    // Verify role-specific permissions after login
    cy.visit("/dashboard");
    
    if (roleConfig.permissions.includes("admin_panel")) {
      cy.get('a[href*="/admin"], button:contains("Admin")')
        .should("exist");
    }
    
    if (roleConfig.permissions.includes("create_doorcard")) {
      cy.get('button:contains("New Doorcard"), a:contains("Create")')
        .should("exist");
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
  }
);

// Custom command to handle form validation more reliably
Cypress.Commands.add("submitFormAndCheckValidation", (expectedErrors = []) => {
  cy.get(
    'button[type="submit"], button:contains("Next"), button:contains("Submit")'
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
      fastLogin(userEmail?: string, userName?: string, userConfig?: any): Chainable<void>;
      productionLogin(userEmail?: string, userName?: string): Chainable<void>;
      simpleLogin(userEmail?: string): Chainable<void>;
      
      // New OneLogin authentication commands
      interactiveOneLoginAuth(userRole?: string, options?: any): Chainable<void>;
      authenticateAs(userRole?: string, options?: any): Chainable<void>;
      clearAuthSessions(): Chainable<void>;
      switchUser(newUserRole: string): Chainable<void>;
      simulateMFA(code?: string): Chainable<void>;
      loginAsRole(role: string): Chainable<void>;
      
      // Existing commands
      createTestDoorcard(options?: any): Chainable<any>;
      deleteDoorcard(doorcardId: string): Chainable<any>;
      cleanupTestData(): Chainable<void>;
      waitForElement(
        selector: string,
        options?: any
      ): Chainable<JQuery<HTMLElement>>;
      fillDoorcardForm(formData: any): Chainable<void>;
      checkAccessibility(context?: any, options?: any): Chainable<void>;
      typeRealistic(text: string, options?: any): Chainable<void>;
      submitFormAndCheckValidation(
        expectedErrors?: string[]
      ): Chainable<boolean>;
    }
  }
}

export {};
