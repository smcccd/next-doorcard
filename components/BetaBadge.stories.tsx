import type { Meta, StoryObj } from "@storybook/nextjs";
import { BetaBadge } from "./BetaBadge";

/**
 * BetaBadge displays a pre-production beta indicator in the navbar.
 *
 * ## Features
 * - Warning-styled badge with yellow/orange gradient
 * - Pulse animation to draw attention
 * - Responsive text: "Beta" on mobile, "Pre-Prod Beta" on desktop
 * - Info icon with tooltip explaining the beta status
 * - Always visible across all environments
 *
 * ## Usage
 * Used in the Navbar component to inform UAT testers that they're using a pre-production environment.
 */
const meta = {
  title: "Components/BetaBadge",
  component: BetaBadge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A badge component that indicates the application is in pre-production beta testing phase. Designed to be inline with the navbar logo.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof BetaBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default badge appearance with pulse animation
 */
export const Default: Story = {};

/**
 * Badge in a simulated navbar context
 */
export const InNavbar: Story = {
  decorators: [
    (Story) => (
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
        <div className="flex items-center">
          <span className="text-xl font-semibold text-smccd-blue-900 dark:text-white">
            Faculty Doorcard
          </span>
          <Story />
        </div>
      </div>
    ),
  ],
};

/**
 * Badge on dark background
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-900 p-4 rounded-lg">
        <div className="flex items-center">
          <span className="text-xl font-semibold text-white">
            Faculty Doorcard
          </span>
          <Story />
        </div>
      </div>
    ),
  ],
};

/**
 * Multiple badges to show consistency
 */
export const MultipleBadges: Story = {
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="flex items-center bg-white p-4 rounded-lg border">
          <span className="text-lg font-semibold">Version 1.0</span>
          <Story />
        </div>
        <div className="flex items-center bg-white p-4 rounded-lg border">
          <span className="text-lg font-semibold">Version 2.0</span>
          <Story />
        </div>
        <div className="flex items-center bg-white p-4 rounded-lg border">
          <span className="text-lg font-semibold">Version 3.0</span>
          <Story />
        </div>
      </div>
    ),
  ],
};
