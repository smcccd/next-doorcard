import type { Meta, StoryObj } from "@storybook/nextjs";
import { NavDropdown } from "./NavDropdown";

const meta = {
  title: "Navigation/NavDropdown",
  component: NavDropdown,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="bg-gray-800 p-4 rounded-lg">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    userDisplay: {
      control: "text",
      description: "The display name of the user",
    },
    isAdmin: {
      control: "boolean",
      description: "Whether the user has admin privileges",
    },
  },
} satisfies Meta<typeof NavDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    userDisplay: "Dr. Jane Smith",
    isAdmin: false,
  },
};

export const WithAdminAccess: Story = {
  args: {
    userDisplay: "Dr. John Doe",
    isAdmin: true,
  },
};

export const LongUserName: Story = {
  args: {
    userDisplay: "Dr. Christopher Alexander Johnson III",
    isAdmin: false,
  },
};

export const MobileView: Story = {
  args: {
    userDisplay: "Dr. Sarah Wilson",
    isAdmin: true,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const TabletView: Story = {
  args: {
    userDisplay: "Prof. Michael Chen",
    isAdmin: false,
  },
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
};

export const MultipleInstances: Story = {
  args: {
    userDisplay: "Faculty Member",
    isAdmin: false,
  },
  render: () => (
    <div className="flex gap-4">
      <NavDropdown userDisplay="Faculty Member 1" isAdmin={false} />
      <NavDropdown userDisplay="Admin User" isAdmin={true} />
      <NavDropdown userDisplay="Guest User" isAdmin={false} />
    </div>
  ),
};
