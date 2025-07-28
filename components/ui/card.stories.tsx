import type { Meta, StoryObj } from '@storybook/nextjs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Badge } from './badge';
import { Clock, MapPin, Calendar } from 'lucide-react';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here. This is where the main content of the card is displayed.</p>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">Card footer</p>
      </CardFooter>
    </Card>
  ),
};

export const SimpleCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Simple Card</CardTitle>
      </CardHeader>
      <CardContent>
        <p>A simple card with just a title and content.</p>
      </CardContent>
    </Card>
  ),
};

export const LoginForm: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="name@example.com" type="email" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Login</Button>
      </CardFooter>
    </Card>
  ),
};

export const ProfessorCard: Story = {
  render: () => (
    <Card className="w-[400px] cursor-pointer hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg">Dr. Jane Smith</h3>
              <p className="text-sm text-gray-600">Professor of Computer Science</p>
            </div>
            <Badge variant="outline">CSM</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="font-medium">Office 36-301</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>3 office hours available</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <span>Spring 2024</span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600">Click to view schedule and contact info →</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <div className="grid gap-4">
      <Card className="w-[350px] hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle>Hoverable Card</CardTitle>
          <CardDescription>Hover over this card to see the shadow effect</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card has hover effects applied.</p>
        </CardContent>
      </Card>
      
      <Card className="w-[350px] border-2 border-blue-200">
        <CardHeader>
          <CardTitle>Custom Border</CardTitle>
          <CardDescription>This card has a custom border color</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Cards can be customized with Tailwind classes.</p>
        </CardContent>
      </Card>
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
    <Card className="w-[350px] dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="dark:text-white">Dark Mode Card</CardTitle>
        <CardDescription className="dark:text-gray-400">This card works in dark mode</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="dark:text-gray-300">Card content is properly styled for dark mode.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};