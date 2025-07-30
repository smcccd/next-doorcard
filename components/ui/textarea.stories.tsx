import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";
import { Textarea } from "./textarea";
import { Label } from "./label";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Whether the textarea is disabled",
    },
    rows: {
      control: { type: "number", min: 1, max: 20 },
      description: "Number of visible text lines",
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here...",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Type your message here..." />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="small">Small (3 rows)</Label>
        <Textarea id="small" placeholder="Small textarea" rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="medium">Medium (5 rows)</Label>
        <Textarea id="medium" placeholder="Medium textarea" rows={5} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="large">Large (8 rows)</Label>
        <Textarea id="large" placeholder="Large textarea" rows={8} />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="default-state">Default State</Label>
        <Textarea id="default-state" placeholder="Default textarea" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="disabled-state">Disabled State</Label>
        <Textarea
          id="disabled-state"
          placeholder="Disabled textarea"
          disabled
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="readonly-state">Read-only State</Label>
        <Textarea
          id="readonly-state"
          value="This is read-only content that cannot be edited."
          readOnly
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="error-state">Error State</Label>
        <Textarea
          id="error-state"
          placeholder="Invalid input"
          className="border-red-500 focus:border-red-500"
        />
        <p className="text-sm text-red-500">This field is required</p>
      </div>
    </div>
  ),
};

export const WithCharacterCount: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    const maxLength = 500;

    return (
      <div className="w-[400px] space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="Tell us about yourself..."
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
          rows={4}
        />
        <div className="flex justify-between text-sm">
          <p className="text-gray-500">Maximum {maxLength} characters</p>
          <p
            className={
              value.length === maxLength ? "text-red-500" : "text-gray-500"
            }
          >
            {value.length}/{maxLength}
          </p>
        </div>
      </div>
    );
  },
};

export const FormExamples: Story = {
  render: () => (
    <form className="space-y-6 w-[500px]">
      <div className="space-y-2">
        <Label htmlFor="description">Course Description</Label>
        <Textarea
          id="description"
          placeholder="Provide a brief description of the course..."
          rows={4}
        />
        <p className="text-sm text-gray-500">
          This will be displayed on your public profile
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="office-hours">Office Hours Details</Label>
        <Textarea
          id="office-hours"
          placeholder="Monday: 2-4 PM&#10;Wednesday: 10 AM - 12 PM&#10;By appointment on Fridays"
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">
          Additional Notes <span className="text-gray-500">(optional)</span>
        </Label>
        <Textarea
          id="notes"
          placeholder="Any additional information students should know..."
          rows={3}
        />
      </div>
    </form>
  ),
};

export const ResizeBehavior: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="resize-both">Resizable (default)</Label>
        <Textarea id="resize-both" placeholder="You can resize this textarea" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resize-none">No Resize</Label>
        <Textarea
          id="resize-none"
          placeholder="This textarea cannot be resized"
          className="resize-none"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resize-vertical">Vertical Resize Only</Label>
        <Textarea
          id="resize-vertical"
          placeholder="Can only resize vertically"
          className="resize-y"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resize-horizontal">Horizontal Resize Only</Label>
        <Textarea
          id="resize-horizontal"
          placeholder="Can only resize horizontally"
          className="resize-x"
        />
      </div>
    </div>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="custom-1">Minimal Style</Label>
        <Textarea
          id="custom-1"
          placeholder="Minimal border styling"
          className="border-0 border-b-2 rounded-none focus:ring-0"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="custom-2">Custom Background</Label>
        <Textarea
          id="custom-2"
          placeholder="Custom background color"
          className="bg-gray-50"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="custom-3">Monospace Font</Label>
        <Textarea
          id="custom-3"
          placeholder="console.log('Hello, World!');"
          className="font-mono text-sm"
          rows={6}
        />
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="dark-textarea" className="dark:text-gray-200">
          Dark Mode Textarea
        </Label>
        <Textarea
          id="dark-textarea"
          placeholder="This textarea works in dark mode"
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dark-custom" className="dark:text-gray-200">
          Custom Dark Styling
        </Label>
        <Textarea
          id="dark-custom"
          placeholder="Custom dark mode colors"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-500"
          rows={4}
        />
      </div>
    </div>
  ),
};
