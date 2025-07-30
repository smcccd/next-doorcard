import type { Meta, StoryObj } from "@storybook/nextjs";
import React from "react";
import { Button } from "./button";
import { useToast } from "../../hooks/use-toast";
import { Toaster } from "./toaster";
import { ToastAction } from "./toast";

const meta = {
  title: "UI/Toast",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const SimpleToastDemo = () => {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "Scheduled: Catch up",
          description: "Friday, February 10, 2023 at 5:57 PM",
        });
      }}
    >
      Show Toast
    </Button>
  );
};

export const Simple: Story = {
  render: () => <SimpleToastDemo />,
};

const ToastVariantsDemo = () => {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-4">
      <Button
        onClick={() => {
          toast({
            title: "Success!",
            description: "Your profile has been updated successfully.",
          });
        }}
      >
        Default Toast
      </Button>

      <Button
        variant="destructive"
        onClick={() => {
          toast({
            variant: "destructive",
            title: "Error!",
            description: "Something went wrong. Please try again.",
          });
        }}
      >
        Destructive Toast
      </Button>
    </div>
  );
};

export const Variants: Story = {
  render: () => <ToastVariantsDemo />,
};

const ToastWithActionDemo = () => {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "Undo Action",
          description: "Your doorcard has been deleted.",
          action: <ToastAction altText="Undo">Undo</ToastAction>,
        });
      }}
    >
      Toast with Action
    </Button>
  );
};

export const WithAction: Story = {
  render: () => <ToastWithActionDemo />,
};

const ToastExamplesDemo = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="font-semibold">Success Messages</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              toast({
                title: "✅ Saved Successfully",
                description: "Your changes have been saved.",
              });
            }}
          >
            Save Success
          </Button>
          <Button
            size="sm"
            onClick={() => {
              toast({
                title: "📧 Email Sent",
                description: "Your message has been sent to the student.",
              });
            }}
          >
            Email Sent
          </Button>
          <Button
            size="sm"
            onClick={() => {
              toast({
                title: "🎉 Profile Published",
                description: "Your doorcard is now visible to students.",
              });
            }}
          >
            Published
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Error Messages</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast({
                variant: "destructive",
                title: "❌ Save Failed",
                description: "Unable to save changes. Please try again.",
              });
            }}
          >
            Save Error
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast({
                variant: "destructive",
                title: "⚠️ Validation Error",
                description: "Please fill in all required fields.",
              });
            }}
          >
            Validation Error
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast({
                variant: "destructive",
                title: "🚫 Access Denied",
                description:
                  "You don't have permission to perform this action.",
              });
            }}
          >
            Permission Error
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Info Messages</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              toast({
                title: "ℹ️ Tip",
                description:
                  "You can edit your office hours in the settings page.",
              });
            }}
          >
            Show Tip
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              toast({
                title: "🔄 Syncing...",
                description: "Your data is being synchronized.",
              });
            }}
          >
            Syncing
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              toast({
                title: "📅 Reminder",
                description: "Office hours start in 15 minutes.",
              });
            }}
          >
            Reminder
          </Button>
        </div>
      </div>
    </div>
  );
};

export const Examples: Story = {
  render: () => <ToastExamplesDemo />,
};

const ToastWithCustomDurationDemo = () => {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-4">
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: "Quick Toast (2s)",
            description: "This will disappear quickly.",
            duration: 2000,
          });
        }}
      >
        2 Second Toast
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          toast({
            title: "Long Toast (10s)",
            description: "This toast will stay visible for longer.",
            duration: 10000,
          });
        }}
      >
        10 Second Toast
      </Button>
    </div>
  );
};

export const CustomDuration: Story = {
  render: () => <ToastWithCustomDurationDemo />,
};

const DoorcardToastsDemo = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Doorcard App Notifications</h3>
      <div className="grid grid-cols-1 gap-2">
        <Button
          onClick={() => {
            toast({
              title: "Office Hours Updated",
              description: "Your new schedule is now visible to students.",
            });
          }}
        >
          Update Office Hours
        </Button>
        <Button
          onClick={() => {
            toast({
              title: "Photo Uploaded",
              description: "Your profile photo has been updated successfully.",
            });
          }}
        >
          Upload Photo
        </Button>
        <Button
          onClick={() => {
            toast({
              title: "Student Appointment",
              description:
                "John Doe has scheduled an appointment for tomorrow at 2 PM.",
              action: <ToastAction altText="View">View</ToastAction>,
            });
          }}
        >
          New Appointment
        </Button>
        <Button
          onClick={() => {
            toast({
              variant: "destructive",
              title: "Session Expired",
              description: "Please log in again to continue.",
              action: <ToastAction altText="Login">Login</ToastAction>,
            });
          }}
        >
          Session Timeout
        </Button>
      </div>
    </div>
  );
};

export const DoorcardExamples: Story = {
  render: () => <DoorcardToastsDemo />,
};

const MultipleToastsDemo = () => {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "First Toast",
          description: "This is the first notification.",
        });
        setTimeout(() => {
          toast({
            title: "Second Toast",
            description: "This is the second notification.",
          });
        }, 1000);
        setTimeout(() => {
          toast({
            title: "Third Toast",
            description: "This is the third notification.",
          });
        }, 2000);
      }}
    >
      Show Multiple Toasts
    </Button>
  );
};

export const MultipleToasts: Story = {
  render: () => <MultipleToastsDemo />,
};
