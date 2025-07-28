import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import SiteIndex from './SiteIndex';

const meta = {
  title: 'Navigation/SiteIndex',
  component: SiteIndex,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      navigation: {
        pathname: '/dashboard',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SiteIndex>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OnHomePage: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/',
      },
    },
  },
};

export const OnDashboard: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/dashboard',
      },
    },
  },
};

export const OnProfile: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/profile',
      },
    },
  },
};

export const WithCustomStyling: Story = {
  decorators: [
    (Story) => (
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <Story />
        <div className="p-8">
          <p className="text-gray-600 dark:text-gray-400">
            The SiteIndex component provides breadcrumb navigation
          </p>
        </div>
      </div>
    ),
  ],
};