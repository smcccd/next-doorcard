import type { Meta, StoryObj } from "@storybook/nextjs";
import { Badge } from "./badge";
import { Check, X, AlertCircle, Clock, User } from "lucide-react";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "secondary", "destructive", "outline"],
      description: "The visual style of the badge",
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Badge",
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const CollegeBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge variant="outline" className="font-medium">
        CSM
      </Badge>
      <Badge variant="outline" className="font-medium">
        Skyline
      </Badge>
      <Badge variant="outline" className="font-medium">
        Cañada
      </Badge>
      <Badge variant="default" className="bg-blue-600">
        All Campuses
      </Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
        <Check className="mr-1 h-3 w-3" />
        Active
      </Badge>
      <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
        <X className="mr-1 h-3 w-3" />
        Inactive
      </Badge>
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
        <AlertCircle className="mr-1 h-3 w-3" />
        Pending
      </Badge>
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
        <Clock className="mr-1 h-3 w-3" />
        In Progress
      </Badge>
    </div>
  ),
};

export const CountBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Professors:</span>
        <Badge variant="secondary">42</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Office Hours:</span>
        <Badge variant="secondary">3 available</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Results:</span>
        <Badge variant="secondary">15 professors</Badge>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Badge className="text-xs px-2 py-0.5">Extra Small</Badge>
      <Badge className="text-sm px-2.5 py-0.5">Small</Badge>
      <Badge>Default</Badge>
      <Badge className="text-base px-3 py-1">Large</Badge>
      <Badge className="text-lg px-4 py-1.5">Extra Large</Badge>
    </div>
  ),
};

export const CustomColors: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Term Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-purple-100 text-purple-800">Spring 2024</Badge>
          <Badge className="bg-orange-100 text-orange-800">Fall 2024</Badge>
          <Badge className="bg-teal-100 text-teal-800">Summer 2024</Badge>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Department Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-indigo-100 text-indigo-800">
            Computer Science
          </Badge>
          <Badge className="bg-pink-100 text-pink-800">Mathematics</Badge>
          <Badge className="bg-cyan-100 text-cyan-800">Engineering</Badge>
        </div>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge variant="secondary">
        <User className="mr-1 h-3 w-3" />
        Faculty
      </Badge>
      <Badge variant="outline">
        <Clock className="mr-1 h-3 w-3" />
        Office Hours
      </Badge>
      <Badge>
        42
        <User className="ml-1 h-3 w-3" />
      </Badge>
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
    <div className="flex flex-wrap gap-4">
      <Badge className="dark:bg-gray-700 dark:text-gray-200">
        Default Dark
      </Badge>
      <Badge
        variant="secondary"
        className="dark:bg-gray-600 dark:text-gray-200"
      >
        Secondary Dark
      </Badge>
      <Badge
        variant="outline"
        className="dark:border-gray-600 dark:text-gray-200"
      >
        Outline Dark
      </Badge>
      <Badge className="bg-blue-600 text-white dark:bg-blue-500">
        Custom Dark
      </Badge>
    </div>
  ),
};
