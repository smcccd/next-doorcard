import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProfileBanner } from './ProfileBanner';
import { SessionProvider } from 'next-auth/react';

const meta = {
  title: 'Components/ProfileBanner',
  component: ProfileBanner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const { session } = context.args;
      return (
        <SessionProvider session={session}>
          <div className="w-[600px]">
            <Story />
          </div>
        </SessionProvider>
      );
    },
  ],
} satisfies Meta<typeof ProfileBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShowsBanner: Story = {
  args: {
    session: {
      user: {
        id: '1',
        name: 'user123', // Generic username
        email: 'user123@college.edu',
      },
      expires: '2024-12-31',
    },
  },
};

export const GenericEmailName: Story = {
  args: {
    session: {
      user: {
        id: '1',
        name: 'jsmith', // Matches email prefix
        email: 'jsmith@college.edu',
      },
      expires: '2024-12-31',
    },
  },
};

export const NoName: Story = {
  args: {
    session: {
      user: {
        id: '1',
        name: null, // No name set
        email: 'faculty@college.edu',
      },
      expires: '2024-12-31',
    },
  },
};

export const EmptyName: Story = {
  args: {
    session: {
      user: {
        id: '1',
        name: '', // Empty name
        email: 'professor@college.edu',
      },
      expires: '2024-12-31',
    },
  },
};

export const HiddenForCompleteName: Story = {
  args: {
    session: {
      user: {
        id: '1',
        name: 'Dr. Jane Smith', // Complete name - banner should not show
        email: 'jsmith@college.edu',
      },
      expires: '2024-12-31',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'When user has a complete name, the banner is hidden (component returns null).',
      },
    },
  },
};

export const HiddenWhenLoggedOut: Story = {
  args: {
    session: null, // No session - banner should not show
  },
  parameters: {
    docs: {
      description: {
        story: 'When user is not logged in, the banner is hidden (component returns null).',
      },
    },
  },
};

export const InDashboardContext: Story = {
  args: {
    session: {
      user: {
        id: '1',
        name: 'tempuser',
        email: 'tempuser@college.edu',
      },
      expires: '2024-12-31',
    },
  },
  decorators: [
    (Story, context) => {
      const { session } = context.args;
      return (
        <SessionProvider session={session}>
          <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Faculty Dashboard</h1>
            <Story />
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="font-semibold mb-2">Quick Stats</h2>
                <p className="text-gray-600">Your doorcard statistics</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="font-semibold mb-2">Recent Activity</h2>
                <p className="text-gray-600">Latest updates and changes</p>
              </div>
            </div>
          </div>
        </SessionProvider>
      );
    },
  ],
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story, context) => {
      const { session } = context.args;
      return (
        <div className="dark">
          <SessionProvider session={session}>
            <div className="w-[600px] dark:bg-gray-900 p-4 rounded-lg">
              <Story />
            </div>
          </SessionProvider>
        </div>
      );
    },
  ],
  args: {
    session: {
      user: {
        id: '1',
        name: 'newuser',
        email: 'newuser@college.edu',
      },
      expires: '2024-12-31',
    },
  },
};