import type { Meta, StoryObj } from "@storybook/nextjs";
import { DarkModeToggle } from "./DarkModeToggle";

const meta = {
  title: "Navigation/DarkModeToggle",
  component: DarkModeToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
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
};
