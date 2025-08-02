/**
 * Standardized Storybook Story Template
 *
 * Use this template as a starting point for creating new component stories.
 * This ensures consistency across all stories in the project.
 */

import type { Meta, StoryObj } from "@storybook/nextjs";
// import { YourComponent } from "./YourComponent";

// Replace with your actual component
const YourComponent = ({ children, ...props }: any) => (
  <div {...props}>{children}</div>
);

const meta = {
  // Use hierarchical naming: Category/ComponentName
  title: "Category/ComponentName",
  component: YourComponent,
  parameters: {
    // Center component in canvas (good for small components)
    layout: "centered",
    // Add component documentation
    docs: {
      description: {
        component:
          "Brief description of what this component does and how to use it.",
      },
    },
  },
  // Enable auto-generated documentation
  tags: ["autodocs"],
  // Define component props with proper controls
  argTypes: {
    children: {
      control: { type: "text" },
      description: "The content to render inside the component",
    },
    className: {
      control: { type: "text" },
      description: "Additional CSS classes to apply",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Whether the component is disabled",
    },
    variant: {
      control: { type: "select" },
      options: ["default", "primary", "secondary"],
      description: "Visual variant of the component",
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "Size variant of the component",
    },
    // Add event handlers for actions
    onClick: {
      action: "clicked",
      description: "Callback fired when the component is clicked",
    },
    onFocus: {
      action: "focused",
      description: "Callback fired when the component receives focus",
    },
  },
  // Set default args that work for most stories
  args: {
    children: "Component Content",
  },
} satisfies Meta<typeof YourComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story - shows the component in its most basic state
export const Default: Story = {
  args: {
    children: "Default Component",
  },
};

// Interactive story - shows component with various controls
export const Interactive: Story = {
  args: {
    children: "Interactive Component",
  },
  parameters: {
    docs: {
      description: {
        story: "Use the controls below to interact with the component.",
      },
    },
  },
};

// All variants story - shows all visual variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <YourComponent variant="default">Default</YourComponent>
      <YourComponent variant="primary">Primary</YourComponent>
      <YourComponent variant="secondary">Secondary</YourComponent>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available visual variants of the component.",
      },
    },
  },
};

// All sizes story - shows all size variants
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <YourComponent size="sm">Small</YourComponent>
      <YourComponent size="md">Medium</YourComponent>
      <YourComponent size="lg">Large</YourComponent>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available size variants of the component.",
      },
    },
  },
};

// States story - shows different component states
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <YourComponent>Default State</YourComponent>
      <YourComponent disabled>Disabled State</YourComponent>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different states the component can be in.",
      },
    },
  },
};

// With custom styling
export const WithCustomStyling: Story = {
  args: {
    children: "Custom Styled",
    className: "bg-blue-100 dark:bg-blue-900 p-4 rounded-lg border",
  },
  parameters: {
    docs: {
      description: {
        story: "Component with custom CSS classes applied.",
      },
    },
  },
};

// Accessibility focused story
export const AccessibilityTest: Story = {
  args: {
    children: "Accessible Component",
    "aria-label": "Accessible component example",
    role: "button",
    tabIndex: 0,
  },
  parameters: {
    docs: {
      description: {
        story: "Component configured for accessibility testing.",
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
        ],
      },
      context: "#storybook-root",
    },
  },
};

// Error state story (if applicable)
export const ErrorState: Story = {
  render: () => (
    <div className="p-4 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20">
      <YourComponent>Component in Error State</YourComponent>
      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
        This shows how the component handles error states.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "How the component appears when in an error state.",
      },
    },
  },
};

// Loading state story (if applicable)
export const LoadingState: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
      <YourComponent disabled>Loading...</YourComponent>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Component in a loading state.",
      },
    },
  },
};

// Responsive behavior story
export const ResponsiveBehavior: Story = {
  render: () => (
    <div className="w-full space-y-4">
      <div className="w-full max-w-xs">
        <h4 className="text-sm font-medium mb-2">Mobile (xs)</h4>
        <YourComponent className="w-full">Mobile View</YourComponent>
      </div>
      <div className="w-full max-w-md">
        <h4 className="text-sm font-medium mb-2">Tablet (md)</h4>
        <YourComponent className="w-full">Tablet View</YourComponent>
      </div>
      <div className="w-full max-w-lg">
        <h4 className="text-sm font-medium mb-2">Desktop (lg)</h4>
        <YourComponent className="w-full">Desktop View</YourComponent>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "How the component behaves on different screen sizes.",
      },
    },
  },
};
