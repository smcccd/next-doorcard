import type { Preview } from "@storybook/nextjs";
import React from "react";
import "../app/globals.css";
import { Inter, Source_Sans_3 } from "next/font/google";
import { DarkModeProvider } from "../components/providers/DarkModeProvider";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "../components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-source-sans",
});

// Enhanced Error Boundary for Storybook stories
class StorybookErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Storybook Story Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-700">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Story Error
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-2">
            This story encountered an error during rendering.
          </p>
          <details className="text-sm text-red-600 dark:text-red-400">
            <summary className="cursor-pointer font-medium">
              Error details
            </summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {this.state.error?.message}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-3 px-3 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded text-sm hover:bg-red-200 dark:hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global decorator to apply styles and providers with error boundary
const withProviders = (Story: any) => (
  <div
    className={`${inter.variable} ${sourceSans.variable} ${inter.className}`}
  >
    <SessionProvider session={null}>
      <DarkModeProvider>
        <StorybookErrorBoundary>
          <div className="p-4">
            <Story />
            <Toaster />
          </div>
        </StorybookErrorBoundary>
      </DarkModeProvider>
    </SessionProvider>
  </div>
);

const preview: Preview = {
  parameters: {
    // Enhanced controls configuration
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
      sort: "requiredFirst",
    },

    // Professional background options
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#f9fafb",
        },
        {
          name: "dark",
          value: "#111827",
        },
        {
          name: "white",
          value: "#ffffff",
        },
        {
          name: "gray-100",
          value: "#f3f4f6",
        },
      ],
    },

    // Professional viewport presets
    viewport: {
      viewports: {
        mobile1: {
          name: "Small Mobile",
          styles: { width: "320px", height: "568px" },
        },
        mobile2: {
          name: "Large Mobile",
          styles: { width: "414px", height: "896px" },
        },
        tablet: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1024px", height: "768px" },
        },
        largeDesktop: {
          name: "Large Desktop",
          styles: { width: "1440px", height: "900px" },
        },
      },
    },

    // Accessibility testing configuration - WCAG 2.1 AA compliant
    a11y: {
      // Configure accessibility testing for ADA compliance
      config: {
        rules: [
          {
            // Standard color contrast checking (AA level: 4.5:1 normal, 3:1 large)
            id: "color-contrast",
            enabled: true,
          },
          {
            // Enhanced color contrast (AAA level: 7:1 normal, 4.5:1 large)
            id: "color-contrast-enhanced",
            enabled: false, // Set to true for AAA compliance
          },
          {
            // Ensure all ARIA elements have required attributes
            id: "aria-required-attr",
            enabled: true,
          },
          {
            // Check for valid ARIA attributes
            id: "aria-valid-attr",
            enabled: true,
          },
          {
            // Ensure buttons have accessible names
            id: "button-name",
            enabled: true,
          },
          {
            // Ensure links have accessible names
            id: "link-name",
            enabled: true,
          },
          {
            // Ensure form inputs have labels
            id: "label",
            enabled: true,
          },
          {
            // Check for valid HTML lang attribute
            id: "html-has-lang",
            enabled: true,
          },
          {
            // Ensure images have alt text
            id: "image-alt",
            enabled: true,
          },
          {
            // Check for keyboard accessibility
            id: "scrollable-region-focusable",
            enabled: true,
          },
        ],
      },
      // Run specific WCAG 2.1 AA standards
      options: {
        runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
      },
      // Show violations in the accessibility panel
      context: "#storybook-root",
      manual: false,
    },

    // Actions configuration for better event tracking
    actions: {
      argTypesRegex: "^on[A-Z].*",
    },

    // Documentation configuration
    docs: {
      autodocs: "tag",
      defaultName: "Documentation",
    },
  },
  decorators: [withProviders],

  // Global story parameters
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
