import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "./select";
import { Label } from "./label";

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[250px]">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[250px] space-y-2">
      <Label htmlFor="select-demo">Choose an option</Label>
      <Select>
        <SelectTrigger id="select-demo">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const CampusSelect: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <Label htmlFor="campus">Select Campus</Label>
      <Select defaultValue="csm">
        <SelectTrigger id="campus">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Campuses</SelectItem>
          <SelectSeparator />
          <SelectItem value="csm">College of San Mateo</SelectItem>
          <SelectItem value="skyline">Skyline College</SelectItem>
          <SelectItem value="canada">Cañada College</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const TermSelect: Story = {
  render: () => (
    <div className="w-[250px] space-y-2">
      <Label htmlFor="term">Academic Term</Label>
      <Select>
        <SelectTrigger id="term">
          <SelectValue placeholder="Select a term" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>2024</SelectLabel>
            <SelectItem value="spring2024">Spring 2024</SelectItem>
            <SelectItem value="summer2024">Summer 2024</SelectItem>
            <SelectItem value="fall2024">Fall 2024</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>2023</SelectLabel>
            <SelectItem value="spring2023">Spring 2023</SelectItem>
            <SelectItem value="summer2023">Summer 2023</SelectItem>
            <SelectItem value="fall2023">Fall 2023</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <div className="w-[300px]">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a department" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>STEM</SelectLabel>
            <SelectItem value="cs">Computer Science</SelectItem>
            <SelectItem value="math">Mathematics</SelectItem>
            <SelectItem value="physics">Physics</SelectItem>
            <SelectItem value="chemistry">Chemistry</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Liberal Arts</SelectLabel>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="history">History</SelectItem>
            <SelectItem value="psychology">Psychology</SelectItem>
            <SelectItem value="sociology">Sociology</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Business</SelectLabel>
            <SelectItem value="accounting">Accounting</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="management">Management</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="w-[250px]">
        <Label htmlFor="disabled-select">Disabled Select</Label>
        <Select disabled>
          <SelectTrigger id="disabled-select">
            <SelectValue placeholder="Disabled" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-[250px]">
        <Label htmlFor="disabled-with-value">Disabled with Value</Label>
        <Select disabled defaultValue="selected">
          <SelectTrigger id="disabled-with-value">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="selected">Selected Option</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};

export const LongOptions: Story = {
  render: () => (
    <div className="w-[350px]">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a course" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cs101">
            CS 101 - Introduction to Computer Science
          </SelectItem>
          <SelectItem value="cs201">
            CS 201 - Data Structures and Algorithms
          </SelectItem>
          <SelectItem value="cs301">
            CS 301 - Advanced Software Engineering
          </SelectItem>
          <SelectItem value="cs401">
            CS 401 - Machine Learning and Artificial Intelligence
          </SelectItem>
          <SelectItem value="cs501">
            CS 501 - Distributed Systems and Cloud Computing
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const FormIntegration: Story = {
  render: () => (
    <form className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <input
          id="name"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Your name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="campus-form">Campus</Label>
        <Select>
          <SelectTrigger id="campus-form">
            <SelectValue placeholder="Select your campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csm">College of San Mateo</SelectItem>
            <SelectItem value="skyline">Skyline College</SelectItem>
            <SelectItem value="canada">Cañada College</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department-form">Department</Label>
        <Select>
          <SelectTrigger id="department-form">
            <SelectValue placeholder="Select your department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cs">Computer Science</SelectItem>
            <SelectItem value="math">Mathematics</SelectItem>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
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
    <div className="w-[300px] space-y-2">
      <Label htmlFor="dark-select" className="dark:text-gray-200">
        Select Option
      </Label>
      <Select>
        <SelectTrigger
          id="dark-select"
          className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        >
          <SelectValue placeholder="Choose an option" />
        </SelectTrigger>
        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
          <SelectItem
            value="option1"
            className="dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Option 1
          </SelectItem>
          <SelectItem
            value="option2"
            className="dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Option 2
          </SelectItem>
          <SelectItem
            value="option3"
            className="dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Option 3
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
