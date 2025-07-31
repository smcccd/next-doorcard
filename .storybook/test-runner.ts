import type { TestRunnerConfig } from "@storybook/test-runner";
import { injectAxe, checkA11y, configureAxe } from "axe-playwright";

const config: TestRunnerConfig = {
  async preVisit(page) {
    // Inject axe-core before each story renders
    await injectAxe(page);
  },

  async postVisit(page, context) {
    // Configure axe-core with project-specific rules
    await configureAxe(page, {
      rules: [
        // Ensure proper color contrast
        {
          id: "color-contrast",
          enabled: true,
        },
        // Check for proper heading structure
        {
          id: "heading-order",
          enabled: true,
        },
        // Ensure all images have alt text
        {
          id: "image-alt",
          enabled: true,
        },
        // Check for proper form labels
        {
          id: "label",
          enabled: true,
        },
        // Ensure keyboard accessibility
        {
          id: "keyboard",
          enabled: true,
        },
        // Check ARIA attributes
        {
          id: "aria-valid-attr",
          enabled: true,
        },
        {
          id: "aria-required-attr",
          enabled: true,
        },
        // Check for proper landmarks
        {
          id: "landmark-unique",
          enabled: true,
        },
        // Ensure sufficient text size
        {
          id: "meta-viewport",
          enabled: true,
        },
      ],
    });

    // Run accessibility checks on the current story
    await checkA11y(
      page,
      "#storybook-root",
      {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      },
      true,
      "v2"
    );
  },

  // Configure test timeouts and retries
  testTimeout: 60000,

  // Skip certain stories if needed (for performance or stability)
  skipStories: [
    // Example: Skip stories that are known to have accessibility issues during development
    // 'Components/ErrorBoundary--Error State',
  ],

  // Configure which browsers to test against
  browsers: ["chromium"],
};

export default config;
