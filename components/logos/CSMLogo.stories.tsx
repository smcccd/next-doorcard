import type { Meta, StoryObj } from "@storybook/nextjs";
import { CSMLogo } from "./CSMLogo";

const meta: Meta<typeof CSMLogo> = {
  title: "Components/Logos/CSMLogo",
  component: CSMLogo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A React component for the College of San Mateo logo with customizable colors and dimensions.",
      },
    },
  },
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes to apply to the SVG",
    },
    width: {
      control: { type: "number", min: 100, max: 1000, step: 10 },
      description: "Width of the logo (number or string)",
    },
    height: {
      control: { type: "number", min: 20, max: 300, step: 10 },
      description: "Height of the logo (number or string)",
    },
    fill: {
      control: "color",
      description: "Color for the logo (default: white)",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    width: 560.4,
    height: 110.8,
    fill: "#ffffff",
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};

export const Small: Story = {
  args: {
    width: 200,
    height: 40,
    fill: "#ffffff",
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};

export const Large: Story = {
  args: {
    width: 800,
    height: 160,
    fill: "#ffffff",
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};

export const CustomColor: Story = {
  args: {
    width: 400,
    height: 80,
    fill: "#0066cc",
  },
  parameters: {
    backgrounds: {
      default: "light",
    },
  },
};

export const DarkOnLight: Story = {
  args: {
    width: 400,
    height: 80,
    fill: "#000000",
  },
  parameters: {
    backgrounds: {
      default: "light",
    },
  },
};

export const Responsive: Story = {
  args: {
    width: "100%",
    height: "auto",
    fill: "#ffffff",
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
    docs: {
      description: {
        story:
          "Logo with responsive sizing using percentage width and auto height.",
      },
    },
  },
};

export const WithCustomClass: Story = {
  args: {
    width: 400,
    height: 80,
    fill: "#ffffff",
    className: "shadow-lg rounded-lg p-4 bg-gray-800",
  },
  parameters: {
    backgrounds: {
      default: "light",
    },
    docs: {
      description: {
        story: "Logo with custom CSS classes for styling effects.",
      },
    },
  },
};
