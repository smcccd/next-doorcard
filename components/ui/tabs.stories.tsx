import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Label } from './label';
import { Input } from './input';
import { Button } from './button';
import { Badge } from './badge';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p>Content for tab 1</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p>Content for tab 2</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p>Content for tab 3</p>
      </TabsContent>
    </Tabs>
  ),
};

export const CampusFilter: Story = {
  render: () => (
    <div className="w-[600px]">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Campuses</TabsTrigger>
          <TabsTrigger value="skyline">Skyline</TabsTrigger>
          <TabsTrigger value="csm">CSM</TabsTrigger>
          <TabsTrigger value="canada">Cañada</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Campuses</CardTitle>
              <CardDescription>Showing faculty from all campuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Total Faculty</span>
                <Badge variant="secondary">156 professors</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="skyline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Skyline College</CardTitle>
              <CardDescription>Faculty at Skyline College</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Faculty Count</span>
                <Badge variant="secondary">52 professors</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="csm" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>College of San Mateo</CardTitle>
              <CardDescription>Faculty at CSM</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Faculty Count</span>
                <Badge variant="secondary">58 professors</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="canada" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cañada College</CardTitle>
              <CardDescription>Faculty at Cañada College</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>Faculty Count</span>
                <Badge variant="secondary">46 professors</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

export const AccountSettings: Story = {
  render: () => (
    <div className="w-[600px]">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information that students will see.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Dr. Jane Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" defaultValue="Professor of Computer Science" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office">Office</Label>
                <Input id="office" defaultValue="Building 36, Room 301" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Ensure your account is using a secure password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input id="current" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input id="new" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Manage your notification and display preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive email updates about your schedule</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Public Profile</p>
                  <p className="text-sm text-gray-500">Make your profile visible to students</p>
                </div>
                <Button variant="outline" size="sm">Toggle</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

export const VerticalTabs: Story = {
  render: () => (
    <div className="flex gap-8">
      <Tabs defaultValue="overview" orientation="vertical" className="w-[600px]">
        <TabsList className="flex-col h-full w-[200px]">
          <TabsTrigger value="overview" className="w-full justify-start">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="w-full justify-start">Analytics</TabsTrigger>
          <TabsTrigger value="reports" className="w-full justify-start">Reports</TabsTrigger>
          <TabsTrigger value="settings" className="w-full justify-start">Settings</TabsTrigger>
        </TabsList>
        <div className="flex-1">
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Dashboard overview content goes here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Analytics and metrics content goes here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Reports and data exports go here.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Application settings go here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="home" className="w-[500px]">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="home">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </TabsTrigger>
        <TabsTrigger value="profile">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </TabsTrigger>
        <TabsTrigger value="messages">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Messages
        </TabsTrigger>
        <TabsTrigger value="settings">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="home">Home content</TabsContent>
      <TabsContent value="profile">Profile content</TabsContent>
      <TabsContent value="messages">Messages content</TabsContent>
      <TabsContent value="settings">Settings content</TabsContent>
    </Tabs>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-8">
      <Tabs defaultValue="tab1" className="w-[400px]">
        <TabsList className="bg-blue-100 dark:bg-blue-900">
          <TabsTrigger value="tab1" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Blue Tab 1
          </TabsTrigger>
          <TabsTrigger value="tab2" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Blue Tab 2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Blue themed tab content 1</TabsContent>
        <TabsContent value="tab2">Blue themed tab content 2</TabsContent>
      </Tabs>

      <Tabs defaultValue="tab1" className="w-[400px]">
        <TabsList className="h-12 p-1 bg-gray-100 rounded-lg">
          <TabsTrigger value="tab1" className="rounded-md data-[state=active]:shadow-sm">
            Modern Tab 1
          </TabsTrigger>
          <TabsTrigger value="tab2" className="rounded-md data-[state=active]:shadow-sm">
            Modern Tab 2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Modern styled content 1</TabsContent>
        <TabsContent value="tab2">Modern styled content 2</TabsContent>
      </Tabs>
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
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList className="dark:bg-gray-800 dark:border-gray-700">
        <TabsTrigger value="tab1" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
          Dark Tab 1
        </TabsTrigger>
        <TabsTrigger value="tab2" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
          Dark Tab 2
        </TabsTrigger>
        <TabsTrigger value="tab3" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
          Dark Tab 3
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="dark:text-gray-100">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            Dark mode content for tab 1
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="tab2" className="dark:text-gray-100">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            Dark mode content for tab 2
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="tab3" className="dark:text-gray-100">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="pt-6">
            Dark mode content for tab 3
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};