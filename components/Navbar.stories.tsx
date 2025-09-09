import type { Meta, StoryObj } from "@storybook/nextjs";
import Navbar from "./Navbar";

const meta = {
  title: "Navigation/Navbar",
  component: Navbar,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Modern, professional navigation bar with improved typography, spacing, and visual hierarchy. Features clean design with proper contrast ratios, hover states, and responsive behavior.",
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Optimized layout using official SMCCD blue (#012147) with compressed district navigation dropdown. The shorter 'Login' button and streamlined branding prevent overflow on 15.4\" MacBook displays.",
      },
    },
  },
};

export const MobileView: Story = {
  name: "Mobile Responsive",
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
    docs: {
      description: {
        story:
          "Mobile-optimized layout with clean hamburger menu and improved touch targets. The mobile experience maintains the professional aesthetic while being touch-friendly.",
      },
    },
  },
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
    docs: {
      description: {
        story:
          "Tablet layout showing the responsive behavior between mobile and desktop views. Notice how the navigation adapts while maintaining visual consistency.",
      },
    },
  },
};

export const DarkMode: Story = {
  name: "Dark Theme",
  parameters: {
    backgrounds: {
      default: "dark",
    },
    docs: {
      description: {
        story:
          "Dark theme variant demonstrating the navbar's adaptive styling with proper contrast ratios and maintained readability across all interactive elements.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export const HighContrast: Story = {
  name: "High Contrast Mode",
  parameters: {
    docs: {
      description: {
        story:
          "Accessibility-focused high contrast version ensuring optimal readability for users with visual impairments while maintaining the modern design aesthetic.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="contrast-more">
        <Story />
      </div>
    ),
  ],
};

export const DesktopWide: Story = {
  name: "Wide Desktop",
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
    docs: {
      description: {
        story:
          "Wide desktop layout showcasing the full navigation with all district links visible and proper spacing across the entire header area.",
      },
    },
  },
};

export const InteractiveStates: Story = {
  name: "Interactive Elements",
  parameters: {
    docs: {
      description: {
        story:
          "Demonstration of hover states and interactive elements. Try hovering over the logo, navigation links, and Faculty Login button to see the smooth transitions and visual feedback.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div>
        <Story />
        <div className="p-8 bg-gray-50 dark:bg-gray-800 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            ↑ Hover over elements above to see interactive states
          </p>
          <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-500">
            <div>• Logo: Scale animation and color transition</div>
            <div>• Navigation links: Background highlight and color change</div>
            <div>
              • Faculty Login: Shadow elevation and background darkening
            </div>
            <div>• Browse Faculty: Blue background highlight</div>
          </div>
        </div>
      </div>
    ),
  ],
};

export const BrandingFocus: Story = {
  name: "Branding & Typography",
  parameters: {
    docs: {
      description: {
        story:
          "Focus on the improved branding elements: larger logo with hover animation, better typography hierarchy, and the descriptive subtitle for context.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div>
        <Story />
        <div className="p-8 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Typography Improvements
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Increased logo size to 48px for better visibility</li>
            <li>• Added descriptive subtitle "SMCCD Office Hours Portal"</li>
            <li>• Improved font weights and spacing throughout</li>
            <li>• Enhanced hover states with smooth transitions</li>
            <li>• Better visual hierarchy with color and size contrast</li>
          </ul>
        </div>
      </div>
    ),
  ],
};
