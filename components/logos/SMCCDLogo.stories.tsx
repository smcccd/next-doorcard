import type { Meta, StoryObj } from "@storybook/nextjs";
import SMCCDLogo from "./SMCCDLogo";

const meta = {
  title: "Components/SMCCDLogo",
  component: SMCCDLogo,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes to apply to the logo",
    },
  },
} satisfies Meta<typeof SMCCDLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomSize: Story = {
  args: {
    className: "w-32 h-32",
  },
};

export const Small: Story = {
  args: {
    className: "w-16 h-16",
  },
};

export const Large: Story = {
  args: {
    className: "w-48 h-48",
  },
};

export const InHeader: Story = {
  decorators: [
    (Story) => (
      <header className="bg-blue-900 text-white p-4 w-full">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Story />
            <div>
              <h1 className="text-xl font-bold">Faculty Portal</h1>
              <p className="text-blue-200 text-sm">
                San Mateo County Community College District
              </p>
            </div>
          </div>
          <nav className="flex gap-4">
            <a href="#" className="hover:text-blue-200">
              Dashboard
            </a>
            <a href="#" className="hover:text-blue-200">
              Profile
            </a>
            <a href="#" className="hover:text-blue-200">
              Help
            </a>
          </nav>
        </div>
      </header>
    ),
  ],
  args: {
    className: "w-12 h-12",
  },
};

export const InFooter: Story = {
  decorators: [
    (Story) => (
      <footer className="bg-gray-800 text-white p-8 w-full">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <Story />
            <div>
              <h3 className="font-semibold">SMCCD</h3>
              <p className="text-gray-400 text-sm">Serving San Mateo County</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Support
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    ),
  ],
  args: {
    className: "w-16 h-16",
  },
};

export const WithText: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <SMCCDLogo className="w-20 h-20" />
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Faculty Doorcard System
        </h2>
        <p className="text-gray-600">
          San Mateo County Community College District
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Connecting students with faculty across our three campuses
        </p>
      </div>
    </div>
  ),
};

export const Grayscale: Story = {
  args: {
    className: "w-24 h-24 grayscale",
  },
};

export const WithHoverEffect: Story = {
  args: {
    className: "w-24 h-24 hover:scale-110 transition-transform cursor-pointer",
  },
};

export const DarkMode: Story = {
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
  args: {
    className: "w-24 h-24",
  },
};
