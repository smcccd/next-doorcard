import type { Meta, StoryObj } from "@storybook/nextjs";
import { DarkModeToggle } from "./DarkModeToggle";

const meta = {
  title: "Navigation/DarkModeToggle",
  component: DarkModeToggle,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A toggle component that switches between light and dark themes. Integrates with the DarkModeProvider context and persists theme preference.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    // No direct props, but component responds to theme context
    className: {
      control: { type: "text" },
      description: "Additional CSS classes to apply to the toggle button",
    },
  },
} satisfies Meta<typeof DarkModeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <DarkModeToggle />,
};

export const InLightMode: Story = {
  decorators: [
    (Story) => (
      <div className="p-8 bg-white rounded-lg">
        <Story />
      </div>
    ),
  ],
  render: () => <DarkModeToggle />,
};

export const InDarkMode: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="dark p-8 bg-gray-900 rounded-lg">
        <Story />
      </div>
    ),
  ],
  render: () => <DarkModeToggle />,
};

export const InCard: Story = {
  decorators: [
    (Story) => (
      <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold dark:text-white">Display Settings</h3>
          <Story />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Toggle between light and dark mode
        </p>
      </div>
    ),
  ],
  render: () => <DarkModeToggle />,
};

export const MultipleToggles: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h4 className="font-medium mb-2 dark:text-white">Primary Toggle</h4>
        <DarkModeToggle />
      </div>
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <h4 className="font-medium mb-2 dark:text-white">Secondary Toggle</h4>
        <DarkModeToggle />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        All toggles are synchronized
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Multiple toggle instances are synchronized through the shared context. Clicking any toggle affects all instances.",
      },
    },
  },
};

// Accessibility focused story
export const AccessibilityTest: Story = {
  render: () => <DarkModeToggle />,
  parameters: {
    docs: {
      description: {
        story:
          "Toggle configured for accessibility testing. Should have proper ARIA labels, keyboard navigation, and screen reader support.",
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
          {
            id: "keyboard",
            enabled: true,
          },
          {
            id: "aria-required-attr",
            enabled: true,
          },
        ],
      },
      context: "#storybook-root",
    },
  },
};

// Interactive example for testing
export const InteractiveDemo: Story = {
  render: () => (
    <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">
            Theme Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Switch between light and dark modes
          </p>
        </div>
        <DarkModeToggle />
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Background and text colors will change when you toggle the theme.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Interactive demo showing the toggle in a realistic UI context with proper styling that responds to theme changes.",
      },
    },
  },
};
