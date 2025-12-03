"use client";

import type { Meta, StoryObj } from "@storybook/nextjs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const meta: Meta = {
  title: "Design System/Keyboard Navigation",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `Comprehensive keyboard navigation patterns and testing guidelines for ADA compliance.
        
## Purpose
This documentation ensures all interactive elements are keyboard accessible according to WCAG 2.1 AA standards.

## Testing Guidelines
1. Disconnect your mouse/trackpad
2. Navigate using only keyboard keys
3. Ensure all interactive elements are reachable
4. Verify focus indicators are clearly visible
5. Test with screen readers enabled`,
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const NavigationPatterns: Story = {
  name: "Standard Navigation Patterns",
  render: () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Keyboard Navigation Patterns</h2>
      
      {/* Common Keys */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Standard Keyboard Controls</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm uppercase text-gray-600 dark:text-gray-400">Navigation</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600">Tab</kbd>
                  <span className="text-sm">Move forward through elements</span>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600">Shift + Tab</kbd>
                  <span className="text-sm">Move backward through elements</span>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600">Arrow Keys</kbd>
                  <span className="text-sm">Navigate within components</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm uppercase text-gray-600 dark:text-gray-400">Activation</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600">Enter</kbd>
                  <span className="text-sm">Activate links, submit forms</span>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600">Space</kbd>
                  <span className="text-sm">Activate buttons, toggle checkboxes</span>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600">Escape</kbd>
                  <span className="text-sm">Close modals, cancel operations</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Demo */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Interactive Demo</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Try navigating through these elements using only your keyboard
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p className="text-sm font-medium mb-2">Instructions:</p>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Press Tab to move through the form elements below</li>
              <li>Use Space or Enter to activate buttons</li>
              <li>Use Arrow keys in the select dropdown</li>
              <li>Notice the focus indicators on each element</li>
            </ol>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="demo-input" className="block text-sm font-medium mb-1">
                Text Input (Tab to focus)
              </label>
              <Input id="demo-input" placeholder="Type here..." className="max-w-sm" />
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="default">Primary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="demo-checkbox" />
              <label htmlFor="demo-checkbox" className="text-sm font-medium">
                Checkbox (Space to toggle)
              </label>
            </div>
            
            <div>
              <label htmlFor="demo-select" className="block text-sm font-medium mb-1">
                Dropdown (Arrow keys to navigate)
              </label>
              <Select>
                <SelectTrigger className="w-[200px]" id="demo-select">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component-Specific Patterns */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Component-Specific Patterns</h3>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="navigation" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="modals">Modals</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
            </TabsList>
            
            <TabsContent value="navigation" className="space-y-3 mt-4">
              <h4 className="font-medium">Navigation Menu</h4>
              <div className="space-y-2 text-sm">
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Tab</kbd> - Move between menu items</p>
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Enter</kbd> - Follow links</p>
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Arrow Down</kbd> - Open dropdown menu</p>
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Escape</kbd> - Close dropdown menu</p>
              </div>
            </TabsContent>
            
            <TabsContent value="forms" className="space-y-3 mt-4">
              <h4 className="font-medium">Form Controls</h4>
              <div className="space-y-2 text-sm">
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Tab</kbd> - Move between form fields</p>
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Space</kbd> - Toggle checkboxes/radios</p>
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Arrow Keys</kbd> - Navigate radio groups</p>
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Enter</kbd> - Submit form (when in text field)</p>
              </div>
            </TabsContent>
            
            <TabsContent value="modals" className="space-y-3 mt-4">
              <h4 className="font-medium">Modal Dialogs</h4>
              <div className="space-y-2 text-sm">
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Escape</kbd> - Close modal</p>
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Tab</kbd> - Cycle through modal elements</p>
                <p>• Focus is trapped within modal when open</p>
                <p>• Focus returns to trigger element on close</p>
              </div>
            </TabsContent>
            
            <TabsContent value="tables" className="space-y-3 mt-4">
              <h4 className="font-medium">Data Tables</h4>
              <div className="space-y-2 text-sm">
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Tab</kbd> - Move to next interactive element</p>
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Arrow Keys</kbd> - Navigate cells (when supported)</p>
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Enter</kbd> - Activate row action</p>
                <p>• <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Space</kbd> - Select row (when selectable)</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  ),
};

export const FocusIndicators: Story = {
  name: "Focus Indicators",
  render: () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Focus Indicator Standards</h2>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">WCAG 2.1 Requirements</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
            <h4 className="font-medium mb-2">✅ Good Focus Indicators</h4>
            <div className="space-y-3">
              <Button className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Clear ring with offset
              </Button>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                2px solid ring with 2px offset, high contrast color
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded">
            <h4 className="font-medium mb-2">❌ Poor Focus Indicators</h4>
            <div className="space-y-3">
              <Button className="focus:outline-none focus:shadow-sm">
                Subtle shadow only
              </Button>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shadow alone is not sufficient for WCAG compliance
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Focus Indicator Requirements:</h4>
            <ul className="text-sm space-y-1">
              <li>• Minimum 3:1 contrast ratio against adjacent colors</li>
              <li>• At least 2px thick outline</li>
              <li>• Visible in both light and dark modes</li>
              <li>• Not rely on color alone</li>
              <li>• Consistent across all interactive elements</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const SkipLinks: Story = {
  name: "Skip Navigation",
  render: () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Skip Navigation Implementation</h2>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Skip Links Pattern</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Skip links allow keyboard users to bypass repetitive content
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-sm font-mono mb-2">Implementation example:</p>
              <pre className="text-xs overflow-x-auto">
{`<a href="#main-content" 
   className="sr-only focus:not-sr-only focus:absolute 
              focus:top-4 focus:left-4 focus:z-50">
  Skip to main content
</a>`}
              </pre>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Best Practices:</h4>
              <ul className="text-sm space-y-1">
                <li>• Hidden by default, visible on focus</li>
                <li>• First focusable element on the page</li>
                <li>• Links to main content area</li>
                <li>• Clear, descriptive text</li>
                <li>• High contrast when visible</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-sm">
                <strong>Try it:</strong> Press Tab on this page to reveal the skip link
                (if implemented in the main layout)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const TestingChecklist: Story = {
  name: "Testing Checklist",
  render: () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Keyboard Accessibility Testing</h2>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Manual Testing Checklist</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { task: "Navigate entire page using only Tab key", status: "required" },
              { task: "All interactive elements are reachable", status: "required" },
              { task: "Focus indicators are clearly visible", status: "required" },
              { task: "Tab order follows logical flow", status: "required" },
              { task: "No keyboard traps exist", status: "required" },
              { task: "Skip links work correctly", status: "recommended" },
              { task: "Modals trap focus appropriately", status: "required" },
              { task: "Escape key closes overlays", status: "required" },
              { task: "Custom widgets follow ARIA patterns", status: "required" },
              { task: "Focus returns to trigger after modal close", status: "required" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center gap-3">
                  <Checkbox id={`check-${index}`} />
                  <label htmlFor={`check-${index}`} className="text-sm">
                    {item.task}
                  </label>
                </div>
                <Badge variant={item.status === "required" ? "destructive" : "secondary"}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Automated Testing Tools</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded">
              <h4 className="font-medium text-sm mb-1">axe DevTools</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Browser extension for accessibility testing
              </p>
            </div>
            <div className="p-3 border rounded">
              <h4 className="font-medium text-sm mb-1">Lighthouse</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Chrome DevTools built-in audit
              </p>
            </div>
            <div className="p-3 border rounded">
              <h4 className="font-medium text-sm mb-1">WAVE</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                WebAIM's evaluation tool
              </p>
            </div>
            <div className="p-3 border rounded">
              <h4 className="font-medium text-sm mb-1">Screen Readers</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                NVDA, JAWS, VoiceOver
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};