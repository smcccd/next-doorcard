import type { Meta, StoryObj } from "@storybook/nextjs";
import { SkylineLogo } from "./SkylineLogo";

const meta: Meta<typeof SkylineLogo> = {
  title: "Components/Logos/SkylineLogo",
  component: SkylineLogo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A React component for the Skyline College logo with customizable colors and dimensions.",
      },
    },
  },
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes to apply to the SVG",
    },
    width: {
      control: { type: "number", min: 50, max: 1000, step: 10 },
      description: "Width of the logo (number or string)",
    },
    height: {
      control: { type: "number", min: 20, max: 400, step: 10 },
      description: "Height of the logo (number or string)",
    },
    fill: {
      control: "color",
      description: "Primary color for the logo (red parts)",
    },
    secondaryFill: {
      control: "color",
      description: "Secondary color for the logo (text parts)",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    width: 574.68,
    height: 202.23,
    fill: "#ee3c39",
    secondaryFill: "#231f20",
  },
};

export const Small: Story = {
  args: {
    width: 200,
    height: 70,
    fill: "#ee3c39",
    secondaryFill: "#231f20",
  },
};

export const Large: Story = {
  args: {
    width: 800,
    height: 280,
    fill: "#ee3c39",
    secondaryFill: "#231f20",
  },
};

export const CustomColors: Story = {
  args: {
    width: 400,
    height: 140,
    fill: "#0066cc",
    secondaryFill: "#333333",
  },
};

export const Monochrome: Story = {
  args: {
    width: 400,
    height: 140,
    fill: "#000000",
    secondaryFill: "#000000",
  },
};

export const Responsive: Story = {
  args: {
    width: "100%",
    height: "auto",
    fill: "#ee3c39",
    secondaryFill: "#231f20",
  },
  parameters: {
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
    height: 140,
    fill: "#ee3c39",
    secondaryFill: "#231f20",
    className: "shadow-lg rounded-lg p-4 bg-white",
  },
  parameters: {
    docs: {
      description: {
        story: "Logo with custom CSS classes for styling effects.",
      },
    },
  },
};
