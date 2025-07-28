import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';
import { Input } from './input';
import { Checkbox } from './checkbox';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const meta = {
  title: 'UI/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Label',
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="name@example.com" />
    </div>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" placeholder="Type your message here..." />
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
        I agree to the terms and conditions
      </Label>
    </div>
  ),
};

export const WithSelect: Story = {
  render: () => (
    <div className="space-y-2 w-[200px]">
      <Label htmlFor="campus">Select Campus</Label>
      <Select>
        <SelectTrigger id="campus">
          <SelectValue placeholder="Choose a campus" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csm">College of San Mateo</SelectItem>
          <SelectItem value="skyline">Skyline College</SelectItem>
          <SelectItem value="canada">Cañada College</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="required-field">
          Required Field <span className="text-red-500">*</span>
        </Label>
        <Input id="required-field" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="optional-field">
          Optional Field <span className="text-gray-500 text-sm">(optional)</span>
        </Label>
        <Input id="optional-field" />
      </div>
    </div>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" />
        <p className="text-sm text-gray-500">
          This will be your public display name
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" />
        <p className="text-sm text-gray-500">
          Must be at least 8 characters long
        </p>
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="disabled-input" className="opacity-50">
        Disabled Field
      </Label>
      <Input id="disabled-input" disabled placeholder="This field is disabled" />
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="form-name">Full Name <span className="text-red-500">*</span></Label>
        <Input id="form-name" placeholder="John Doe" required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="form-email">Email Address <span className="text-red-500">*</span></Label>
        <Input id="form-email" type="email" placeholder="john@example.com" required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="form-office">Office Number</Label>
        <Input id="form-office" placeholder="36-301" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="form-bio">Bio</Label>
        <Textarea id="form-bio" placeholder="Tell us about yourself..." rows={4} />
        <p className="text-sm text-gray-500">Maximum 500 characters</p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="form-public" />
        <Label htmlFor="form-public" className="text-sm font-normal cursor-pointer">
          Make my profile public
        </Label>
      </div>
    </form>
  ),
};

export const ScreenReaderOnly: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <Input id="search" placeholder="Search..." />
        <p className="text-sm text-gray-500 mt-2">
          The label above is visually hidden but accessible to screen readers
        </p>
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dark-input" className="dark:text-gray-200">
          Dark Mode Label
        </Label>
        <Input 
          id="dark-input" 
          placeholder="Dark mode input"
          className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="dark-checkbox" />
        <Label htmlFor="dark-checkbox" className="text-sm font-normal cursor-pointer dark:text-gray-200">
          Enable notifications
        </Label>
      </div>
    </div>
  ),
};