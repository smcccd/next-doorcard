import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    checked: {
      control: { type: "boolean" },
      description: "The controlled checked state of the checkbox",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Whether the checkbox is disabled",
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Checkbox />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms" className="cursor-pointer">
        Accept terms and conditions
      </Label>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="unchecked" />
        <Label htmlFor="unchecked">Unchecked</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="checked" defaultChecked />
        <Label htmlFor="checked">Checked</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled" disabled />
        <Label htmlFor="disabled" className="opacity-50">
          Disabled
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked" className="opacity-50">
          Disabled Checked
        </Label>
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4 border rounded-lg p-4 w-[400px]">
      <h3 className="font-semibold mb-4">Email Preferences</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox id="marketing" defaultChecked />
          <Label
            htmlFor="marketing"
            className="text-sm font-normal cursor-pointer"
          >
            Send me marketing emails
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="updates" defaultChecked />
          <Label
            htmlFor="updates"
            className="text-sm font-normal cursor-pointer"
          >
            Send me product updates
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="newsletter" />
          <Label
            htmlFor="newsletter"
            className="text-sm font-normal cursor-pointer"
          >
            Subscribe to newsletter
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="notifications" defaultChecked />
          <Label
            htmlFor="notifications"
            className="text-sm font-normal cursor-pointer"
          >
            Enable push notifications
          </Label>
        </div>
      </div>
    </form>
  ),
};

export const ProfileSettings: Story = {
  render: () => (
    <div className="space-y-6 w-[500px]">
      <div className="space-y-4">
        <h3 className="font-semibold">Privacy Settings</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox id="public-profile" className="mt-0.5" />
            <div>
              <Label
                htmlFor="public-profile"
                className="text-sm font-medium cursor-pointer"
              >
                Make my profile public
              </Label>
              <p className="text-sm text-gray-500">
                Allow other users to see your profile information
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="show-email" className="mt-0.5" />
            <div>
              <Label
                htmlFor="show-email"
                className="text-sm font-medium cursor-pointer"
              >
                Show email address
              </Label>
              <p className="text-sm text-gray-500">
                Display your email on your public profile
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="show-office" className="mt-0.5" defaultChecked />
            <div>
              <Label
                htmlFor="show-office"
                className="text-sm font-medium cursor-pointer"
              >
                Show office hours
              </Label>
              <p className="text-sm text-gray-500">
                Make your office hours visible to students
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-start space-x-2">
        <Checkbox id="agree" required />
        <div>
          <Label htmlFor="agree" className="text-sm font-medium cursor-pointer">
            I agree to the terms and conditions{" "}
            <span className="text-red-500">*</span>
          </Label>
          <p className="text-sm text-gray-500">You must agree to continue</p>
        </div>
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">
        Continue
      </button>
    </div>
  ),
};

export const IndeterminateState: Story = {
  render: () => {
    const [checkedItems, setCheckedItems] = React.useState([
      true,
      false,
      false,
    ]);
    const allChecked = checkedItems.every(Boolean);
    const isIndeterminate = checkedItems.some(Boolean) && !allChecked;

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b">
          <Checkbox
            id="select-all"
            checked={
              allChecked ? true : isIndeterminate ? "indeterminate" : false
            }
            onCheckedChange={(checked) => {
              setCheckedItems([
                checked === true,
                checked === true,
                checked === true,
              ]);
            }}
          />
          <Label htmlFor="select-all" className="font-medium cursor-pointer">
            Select All
          </Label>
        </div>
        <div className="space-y-2 pl-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="item-1"
              checked={checkedItems[0]}
              onCheckedChange={(checked) => {
                const newItems = [...checkedItems];
                newItems[0] = checked === true;
                setCheckedItems(newItems);
              }}
            />
            <Label htmlFor="item-1" className="cursor-pointer">
              Item 1
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="item-2"
              checked={checkedItems[1]}
              onCheckedChange={(checked) => {
                const newItems = [...checkedItems];
                newItems[1] = checked === true;
                setCheckedItems(newItems);
              }}
            />
            <Label htmlFor="item-2" className="cursor-pointer">
              Item 2
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="item-3"
              checked={checkedItems[2]}
              onCheckedChange={(checked) => {
                const newItems = [...checkedItems];
                newItems[2] = checked === true;
                setCheckedItems(newItems);
              }}
            />
            <Label htmlFor="item-3" className="cursor-pointer">
              Item 3
            </Label>
          </div>
        </div>
      </div>
    );
  },
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="custom-1"
          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
        />
        <Label htmlFor="custom-1">Green checkbox</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="custom-2" className="h-5 w-5" />
        <Label htmlFor="custom-2">Larger checkbox</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="custom-3" className="rounded-full" />
        <Label htmlFor="custom-3">Rounded checkbox</Label>
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
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="dark-1" />
        <Label htmlFor="dark-1" className="dark:text-gray-200">
          Dark mode checkbox
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="dark-2" defaultChecked />
        <Label htmlFor="dark-2" className="dark:text-gray-200">
          Checked in dark mode
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="dark-3" disabled />
        <Label htmlFor="dark-3" className="dark:text-gray-400">
          Disabled in dark mode
        </Label>
      </div>
    </div>
  ),
};
