import type { Meta, StoryObj } from '@storybook/nextjs';
import { Input } from './input';
import { Label } from './label';
import { Search, Mail, Lock, User, Calendar } from 'lucide-react';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time'],
      description: 'The type of input',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the input',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Types: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <div>
        <Label htmlFor="text">Text Input</Label>
        <Input id="text" type="text" placeholder="Enter text..." />
      </div>
      <div>
        <Label htmlFor="email">Email Input</Label>
        <Input id="email" type="email" placeholder="name@example.com" />
      </div>
      <div>
        <Label htmlFor="password">Password Input</Label>
        <Input id="password" type="password" placeholder="Enter password..." />
      </div>
      <div>
        <Label htmlFor="number">Number Input</Label>
        <Input id="number" type="number" placeholder="123" />
      </div>
      <div>
        <Label htmlFor="date">Date Input</Label>
        <Input id="date" type="date" />
      </div>
      <div>
        <Label htmlFor="search">Search Input</Label>
        <Input id="search" type="search" placeholder="Search..." />
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <div>
        <Label htmlFor="search-icon">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input id="search-icon" className="pl-10" placeholder="Search professors..." />
        </div>
      </div>
      <div>
        <Label htmlFor="email-icon">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input id="email-icon" type="email" className="pl-10" placeholder="name@example.com" />
        </div>
      </div>
      <div>
        <Label htmlFor="password-icon">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input id="password-icon" type="password" className="pl-10" placeholder="Enter password" />
        </div>
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <div>
        <Label htmlFor="default-state">Default State</Label>
        <Input id="default-state" placeholder="Default input" />
      </div>
      <div>
        <Label htmlFor="focus-state">Focus State (click to focus)</Label>
        <Input id="focus-state" placeholder="Click to see focus state" />
      </div>
      <div>
        <Label htmlFor="disabled-state">Disabled State</Label>
        <Input id="disabled-state" placeholder="Disabled input" disabled />
      </div>
      <div>
        <Label htmlFor="readonly-state">Read-only State</Label>
        <Input id="readonly-state" value="Read-only value" readOnly />
      </div>
      <div>
        <Label htmlFor="error-state">Error State</Label>
        <Input 
          id="error-state" 
          placeholder="Invalid input" 
          className="border-red-500 focus:border-red-500 focus:ring-red-500"
        />
        <p className="text-sm text-red-500 mt-1">This field is required</p>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <div>
        <Label htmlFor="small">Small Input</Label>
        <Input id="small" placeholder="Small size" className="h-8 text-sm" />
      </div>
      <div>
        <Label htmlFor="default-size">Default Input</Label>
        <Input id="default-size" placeholder="Default size" />
      </div>
      <div>
        <Label htmlFor="large">Large Input</Label>
        <Input id="large" placeholder="Large size" className="h-12 text-lg" />
      </div>
    </div>
  ),
};

export const ProfessorSearch: Story = {
  render: () => (
    <div className="w-[500px]">
      <Label htmlFor="professor-search" className="sr-only">
        Search for professor
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-400" />
        <Input
          id="professor-search"
          placeholder="Type professor's name (e.g., John Smith, Dr. Johnson)..."
          className="pl-10 h-12 text-base border-2 focus:border-blue-500"
        />
      </div>
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
    <div className="space-y-4 w-[350px]">
      <div>
        <Label htmlFor="dark-input" className="dark:text-gray-200">Dark Mode Input</Label>
        <Input 
          id="dark-input" 
          placeholder="Dark mode input" 
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
        />
      </div>
      <div>
        <Label htmlFor="dark-search" className="dark:text-gray-200">Search in Dark Mode</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input 
            id="dark-search" 
            placeholder="Search..." 
            className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
        </div>
      </div>
    </div>
  ),
};