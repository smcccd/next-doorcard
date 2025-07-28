import type { Meta, StoryObj } from '@storybook/react';
import CollegeLogo from './CollegeLogo';

const meta = {
  title: 'Components/CollegeLogo',
  component: CollegeLogo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    college: {
      control: { type: 'select' },
      options: ['CSM', 'SKYLINE', 'CANADA'],
      description: 'The college to display the logo for',
    },
    variant: {
      control: { type: 'select' },
      options: ['full', 'icon', 'inline'],
      description: 'The display variant of the logo',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'The size of the logo',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof CollegeLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    college: 'CSM',
  },
};

export const AllColleges: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-2">
        <h3 className="font-semibold">College of San Mateo</h3>
        <CollegeLogo college="CSM" />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Skyline College</h3>
        <CollegeLogo college="SKYLINE" />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Cañada College</h3>
        <CollegeLogo college="CANADA" />
      </div>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="font-semibold">Full Variant</h3>
        <div className="flex gap-4">
          <CollegeLogo college="CSM" variant="full" />
          <CollegeLogo college="SKYLINE" variant="full" />
          <CollegeLogo college="CANADA" variant="full" />
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold">Icon Variant</h3>
        <div className="flex gap-4">
          <CollegeLogo college="CSM" variant="icon" />
          <CollegeLogo college="SKYLINE" variant="icon" />
          <CollegeLogo college="CANADA" variant="icon" />
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold">Inline Variant</h3>
        <div className="space-y-2">
          <p>Welcome to <CollegeLogo college="CSM" variant="inline" /></p>
          <p>Welcome to <CollegeLogo college="SKYLINE" variant="inline" /></p>
          <p>Welcome to <CollegeLogo college="CANADA" variant="inline" /></p>
        </div>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="font-semibold">Small Size</h3>
        <div className="flex gap-4 items-center">
          <CollegeLogo college="CSM" size="sm" />
          <CollegeLogo college="SKYLINE" size="sm" />
          <CollegeLogo college="CANADA" size="sm" />
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold">Medium Size (Default)</h3>
        <div className="flex gap-4 items-center">
          <CollegeLogo college="CSM" size="md" />
          <CollegeLogo college="SKYLINE" size="md" />
          <CollegeLogo college="CANADA" size="md" />
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold">Large Size</h3>
        <div className="flex gap-4 items-center">
          <CollegeLogo college="CSM" size="lg" />
          <CollegeLogo college="SKYLINE" size="lg" />
          <CollegeLogo college="CANADA" size="lg" />
        </div>
      </div>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <CollegeLogo college="CSM" variant="full" size="md" />
          <span className="text-sm text-gray-500">Faculty Portal</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">Welcome to CSM</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Access your faculty resources and manage your doorcard information.
        </p>
      </div>

      <div className="flex gap-4">
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded flex-1">
          <CollegeLogo college="SKYLINE" variant="icon" size="sm" className="mb-2" />
          <p className="text-sm">52 Faculty Members</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded flex-1">
          <CollegeLogo college="CANADA" variant="icon" size="sm" className="mb-2" />
          <p className="text-sm">46 Faculty Members</p>
        </div>
      </div>
    </div>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-4">
      <CollegeLogo 
        college="CSM" 
        className="text-blue-600 dark:text-blue-400" 
      />
      <CollegeLogo 
        college="SKYLINE" 
        className="text-green-600 dark:text-green-400" 
      />
      <CollegeLogo 
        college="CANADA" 
        className="text-purple-600 dark:text-purple-400" 
      />
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="space-y-4">
      <CollegeLogo college="CSM" />
      <CollegeLogo college="SKYLINE" />
      <CollegeLogo college="CANADA" />
    </div>
  ),
};