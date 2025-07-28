import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a dialog description that explains what this dialog is about.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Dialog content goes here.</p>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const LoginDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Login</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login to your account</DialogTitle>
          <DialogDescription>
            Enter your email and password to access your faculty portal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@college.edu" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Login</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const EditProfileDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="Dr. Jane Smith" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" defaultValue="Professor of Computer Science" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="office">Office Number</Label>
            <Input id="office" defaultValue="36-301" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              defaultValue="I teach computer science courses with a focus on software engineering and web development."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const ConfirmationDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive">Delete Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const InformationDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View Details</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Office Hours Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-medium mb-1">Regular Hours</h4>
            <p className="text-sm text-gray-600">
              Monday & Wednesday: 2:00 PM - 4:00 PM<br />
              Friday: 10:00 AM - 12:00 PM
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Location</h4>
            <p className="text-sm text-gray-600">
              Building 36, Room 301<br />
              College of San Mateo
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Note</h4>
            <p className="text-sm text-gray-600">
              Office hours may change during finals week. Please check the online schedule for updates.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Got it</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const NestedDialogs: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open First Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>First Dialog</DialogTitle>
          <DialogDescription>
            This dialog contains another dialog trigger.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Second Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Second Dialog</DialogTitle>
                <DialogDescription>
                  This is a nested dialog.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button>Close</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const LongContentDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Terms of Service</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>
            Last updated: January 1, 2024
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-medium mb-2">1. Acceptance of Terms</h3>
            <p className="text-sm text-gray-600">
              By accessing and using this service, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please 
              do not use this service.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">2. Use License</h3>
            <p className="text-sm text-gray-600">
              Permission is granted to temporarily download one copy of the materials (information 
              or software) on our website for personal, non-commercial transitory viewing only. 
              This is the grant of a license, not a transfer of title.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">3. Disclaimer</h3>
            <p className="text-sm text-gray-600">
              The materials on our website are provided on an 'as is' basis. We make no warranties, 
              expressed or implied, and hereby disclaim and negate all other warranties including, 
              without limitation, implied warranties or conditions of merchantability, fitness for 
              a particular purpose, or non-infringement of intellectual property or other violation 
              of rights.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">4. Limitations</h3>
            <p className="text-sm text-gray-600">
              In no event shall our company or its suppliers be liable for any damages (including, 
              without limitation, damages for loss of data or profit, or due to business interruption) 
              arising out of the use or inability to use the materials on our website.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Decline</Button>
          </DialogClose>
          <Button>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Custom Dialog</Button>
      </DialogTrigger>
      <DialogContent className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <DialogHeader>
          <DialogTitle className="text-blue-900">Welcome!</DialogTitle>
          <DialogDescription className="text-blue-700">
            This dialog has custom styling applied.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-blue-800">
            You can customize the appearance of dialogs using Tailwind classes.
          </p>
        </div>
        <DialogFooter>
          <Button className="bg-blue-600 hover:bg-blue-700">Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dark Dialog</Button>
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Dark Mode Dialog</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            This dialog is styled for dark mode.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="dark:text-gray-300">
            All dialog content respects the dark mode theme.
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
              Cancel
            </Button>
          </DialogClose>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};