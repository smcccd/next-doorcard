import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";
import ErrorBoundary from "./ErrorBoundary";

// Component that will throw an error for testing
const ErrorComponent = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    throw new Error("This is a test error for the ErrorBoundary");
  }
  return (
    <div className="p-4 bg-green-100 rounded">Component working correctly!</div>
  );
};

const meta = {
  title: "Components/ErrorBoundary",
  component: ErrorBoundary,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    children: <ErrorComponent shouldError={false} />,
  },
  render: () => (
    <ErrorBoundary>
      <ErrorComponent shouldError={false} />
    </ErrorBoundary>
  ),
};

export const WithError: Story = {
  args: {
    children: <ErrorComponent shouldError={true} />,
  },
  render: () => (
    <ErrorBoundary>
      <ErrorComponent shouldError={true} />
    </ErrorBoundary>
  ),
};

export const NestedComponents: Story = {
  args: {
    children: <div>Nested content</div>,
  },
  render: () => (
    <ErrorBoundary>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-100 rounded">
            <h3 className="font-semibold">Working Component</h3>
            <p>This component works fine</p>
          </div>
          <ErrorBoundary>
            <ErrorComponent shouldError={true} />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  ),
};

export const MultipleErrorBoundaries: Story = {
  args: {
    children: <div>Multiple boundaries content</div>,
  },
  render: () => (
    <div className="space-y-6">
      <ErrorBoundary>
        <div className="p-4 bg-green-100 rounded">
          <h3 className="font-semibold">Section 1 - Working</h3>
          <ErrorComponent shouldError={false} />
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <div className="p-4 bg-red-100 rounded">
          <h3 className="font-semibold">Section 2 - Error</h3>
          <ErrorComponent shouldError={true} />
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <div className="p-4 bg-green-100 rounded">
          <h3 className="font-semibold">Section 3 - Working</h3>
          <ErrorComponent shouldError={false} />
        </div>
      </ErrorBoundary>
    </div>
  ),
};
