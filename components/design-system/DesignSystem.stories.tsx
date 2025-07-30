"use client";

import type { Meta, StoryObj } from "@storybook/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const meta: Meta = {
  title: "Design System/Colors & Typography",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Complete color palette and typography system for the Next Doorcard application.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ColorPalette: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Color Palette</h2>

        {/* Primary Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Primary Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 w-full bg-blue-600 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Blue 600</div>
                <div className="text-gray-500">#2563eb</div>
                <div className="text-gray-500">Primary</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-blue-700 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Blue 700</div>
                <div className="text-gray-500">#1d4ed8</div>
                <div className="text-gray-500">Primary Dark</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-blue-500 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Blue 500</div>
                <div className="text-gray-500">#3b82f6</div>
                <div className="text-gray-500">Primary Light</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-blue-100 rounded-lg shadow-sm border"></div>
              <div className="text-sm">
                <div className="font-medium">Blue 100</div>
                <div className="text-gray-500">#dbeafe</div>
                <div className="text-gray-500">Primary Subtle</div>
              </div>
            </div>
          </div>
        </div>

        {/* Semantic Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Semantic Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 w-full bg-green-500 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Green 500</div>
                <div className="text-gray-500">#22c55e</div>
                <div className="text-gray-500">Success</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-red-500 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Red 500</div>
                <div className="text-gray-500">#ef4444</div>
                <div className="text-gray-500">Error</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-yellow-500 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Yellow 500</div>
                <div className="text-gray-500">#eab308</div>
                <div className="text-gray-500">Warning</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-purple-500 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Purple 500</div>
                <div className="text-gray-500">#a855f7</div>
                <div className="text-gray-500">Info</div>
              </div>
            </div>
          </div>
        </div>

        {/* Neutral Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Neutral Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="h-20 w-full bg-gray-900 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Gray 900</div>
                <div className="text-gray-500">#111827</div>
                <div className="text-gray-500">Text Primary</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-gray-700 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Gray 700</div>
                <div className="text-gray-500">#374151</div>
                <div className="text-gray-500">Text Secondary</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-gray-400 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Gray 400</div>
                <div className="text-gray-500">#9ca3af</div>
                <div className="text-gray-500">Text Muted</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-gray-100 rounded-lg shadow-sm border"></div>
              <div className="text-sm">
                <div className="font-medium">Gray 100</div>
                <div className="text-gray-500">#f3f4f6</div>
                <div className="text-gray-500">Background</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-white rounded-lg shadow-sm border-2"></div>
              <div className="text-sm">
                <div className="font-medium">White</div>
                <div className="text-gray-500">#ffffff</div>
                <div className="text-gray-500">Surface</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dark Mode Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Dark Mode Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 w-full bg-gray-800 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Gray 800</div>
                <div className="text-gray-500">#1f2937</div>
                <div className="text-gray-500">Dark Surface</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-gray-900 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Gray 900</div>
                <div className="text-gray-500">#111827</div>
                <div className="text-gray-500">Dark Background</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-blue-400 rounded-lg shadow-sm"></div>
              <div className="text-sm">
                <div className="font-medium">Blue 400</div>
                <div className="text-gray-500">#60a5fa</div>
                <div className="text-gray-500">Dark Primary</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-20 w-full bg-gray-100 rounded-lg shadow-sm border"></div>
              <div className="text-sm">
                <div className="font-medium">Gray 100</div>
                <div className="text-gray-500">#f3f4f6</div>
                <div className="text-gray-500">Dark Text</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Typography System</h2>

        {/* Font Families */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Font Families</h3>
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="font-sans">
                  <div className="text-sm text-gray-500 mb-2">
                    Inter (Primary)
                  </div>
                  <div className="text-lg">
                    The quick brown fox jumps over the lazy dog
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Used for UI elements, body text, and general content
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div style={{ fontFamily: "Source Sans 3" }}>
                  <div className="text-sm text-gray-500 mb-2">
                    Source Sans 3 (Secondary)
                  </div>
                  <div className="text-lg">
                    The quick brown fox jumps over the lazy dog
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Used for headings and display text
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Heading Styles */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Heading Styles</h3>
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                Heading 1 - Hero
              </h1>
              <div className="text-sm text-gray-500 mt-1">
                text-4xl sm:text-5xl lg:text-6xl font-bold
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Heading 2 - Section</h2>
              <div className="text-sm text-gray-500 mt-1">
                text-2xl font-bold
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Heading 3 - Subsection</h3>
              <div className="text-sm text-gray-500 mt-1">
                text-xl font-semibold
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold">Heading 4 - Card Title</h4>
              <div className="text-sm text-gray-500 mt-1">
                text-lg font-semibold
              </div>
            </div>
            <div>
              <h5 className="text-base font-semibold">
                Heading 5 - Small Title
              </h5>
              <div className="text-sm text-gray-500 mt-1">
                text-base font-semibold
              </div>
            </div>
          </div>
        </div>

        {/* Body Text */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Body Text</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xl sm:text-2xl text-blue-100">
                Large Body Text - Hero Description
              </p>
              <div className="text-sm text-gray-500 mt-1">
                text-xl sm:text-2xl
              </div>
            </div>
            <div>
              <p className="text-base">
                Regular Body Text - Standard paragraph content for most use
                cases.
              </p>
              <div className="text-sm text-gray-500 mt-1">text-base</div>
            </div>
            <div>
              <p className="text-sm">
                Small Body Text - Secondary information and metadata.
              </p>
              <div className="text-sm text-gray-500 mt-1">text-sm</div>
            </div>
            <div>
              <p className="text-xs">
                Extra Small Text - Fine print and labels.
              </p>
              <div className="text-sm text-gray-500 mt-1">text-xs</div>
            </div>
          </div>
        </div>

        {/* Text Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Text Colors</h3>
          <div className="space-y-3">
            <div className="text-gray-900 dark:text-white">
              Primary text color - Main content
            </div>
            <div className="text-gray-700 dark:text-gray-100">
              Secondary text color - Supporting content
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              Muted text color - Less important information
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Subtle text color - Metadata and labels
            </div>
            <div className="text-blue-600 dark:text-blue-400">
              Link color - Interactive elements
            </div>
            <div className="text-green-600 dark:text-green-400">
              Success color - Positive states
            </div>
            <div className="text-red-600 dark:text-red-400">
              Error color - Error states
            </div>
          </div>
        </div>

        {/* Font Weights */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Font Weights</h3>
          <div className="space-y-2">
            <div className="font-normal">Normal (400) - Regular body text</div>
            <div className="font-medium">Medium (500) - Emphasized text</div>
            <div className="font-semibold">
              Semibold (600) - Section headings
            </div>
            <div className="font-bold">Bold (700) - Main headings</div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const TypographyInContext: Story = {
  render: () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Typography in Context</h2>

      {/* Faculty Card Example */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                Dr. Sarah Johnson
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-100 mb-2">
                Professor of Computer Science
              </p>
            </div>
            <Badge variant="outline" className="ml-2 text-xs font-medium">
              CSM
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                Office B204
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-700 dark:text-gray-100">
                3 office hours available
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-700 dark:text-gray-100">
                Spring 2024
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100 mt-3">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Click to view schedule and contact info →
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Example */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Navigation Typography</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <span className="text-sm font-medium">Dashboard</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Profile
                </span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2">
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  Sign Out
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Typography */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Form Typography</h4>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                First Name
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                placeholder="Enter your first name"
              />
              <p className="text-xs text-gray-600 dark:text-gray-300">
                This will appear on your doorcard
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};
