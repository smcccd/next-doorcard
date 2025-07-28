"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TourControl } from "@/components/tour/TourControl";
import { useTour } from "@/components/tour/TourProvider";
import { TourStep } from "@/components/tour/TourProvider";
import { BookOpen, Users, Settings, ChevronRight } from "lucide-react";

export default function TourDemoPage() {
  const { startTour } = useTour();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    college: "",
    message: "",
  });

  // Demo tour steps
  const demoTourSteps: TourStep[] = [
    {
      id: "welcome-demo",
      element: "body",
      popover: {
        title: "🎉 Tour Demo Page",
        description:
          "This page demonstrates the interactive tour system with user input requirements. Each step will guide you through different interactions.",
        nextBtnText: "Start Demo",
        showButtons: ["next"],
      },
    },
    {
      id: "name-input-demo",
      element: '[data-tour="name-input"]',
      popover: {
        title: "Enter Your Name",
        description:
          "Please type your name in this field. The tour will not continue until you provide input.",
        waitForUserInput: true,
        requiredInputType: "input",
        inputSelector: '[data-tour="name-input"]',
        onUserInputComplete: () => {
          console.log("Name input completed!");
        },
      },
    },
    {
      id: "email-input-demo",
      element: '[data-tour="email-input"]',
      popover: {
        title: "Enter Your Email",
        description:
          'Now, please enter your email address. Notice how the "Next" button is disabled until you complete the input.',
        waitForUserInput: true,
        requiredInputType: "input",
        inputSelector: '[data-tour="email-input"]',
      },
    },
    {
      id: "college-select-demo",
      element: '[data-tour="college-select"]',
      popover: {
        title: "Select Your College",
        description:
          "Choose your college from this dropdown. The tour waits for your selection.",
        waitForUserInput: true,
        requiredInputType: "select",
        inputSelector: '[data-tour="college-select"]',
      },
    },
    {
      id: "message-optional",
      element: '[data-tour="message-textarea"]',
      popover: {
        title: "Optional Message",
        description:
          "This field is optional - you can proceed without filling it in. Notice that you can use Next/Previous buttons freely here.",
        nextBtnText: "Continue",
        prevBtnText: "Back",
      },
    },
    {
      id: "submit-button-demo",
      element: '[data-tour="submit-button"]',
      popover: {
        title: "Submit Button",
        description:
          "Click this submit button to complete the demo. This demonstrates waiting for a specific click action.",
        waitForUserInput: true,
        requiredInputType: "click",
        inputSelector: '[data-tour="submit-button"]',
        onUserInputComplete: () => {
          alert("Demo completed! Great job! 🎉");
        },
      },
    },
    {
      id: "completion",
      element: '[data-tour="completion-card"]',
      popover: {
        title: "✅ Tour Complete!",
        description:
          "Congratulations! You've completed the interactive tour demo. You can see how user inputs control the flow while still allowing backward navigation.",
        doneBtnText: "Finish Demo",
        showButtons: ["close"],
      },
    },
  ];

  // Add data-tour attributes after component mounts
  useEffect(() => {
    const elements = [
      { selector: "#name-input", tourId: "name-input" },
      { selector: "#email-input", tourId: "email-input" },
      { selector: "#college-select", tourId: "college-select" },
      { selector: "#message-textarea", tourId: "message-textarea" },
      { selector: "#submit-button", tourId: "submit-button" },
      { selector: "#completion-card", tourId: "completion-card" },
    ];

    elements.forEach(({ selector, tourId }) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute("data-tour", tourId);
      }
    });
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  const startDemoTour = () => {
    // Small delay to ensure all elements are properly mounted
    setTimeout(async () => {
      await startTour(demoTourSteps);
    }, 100);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Interactive Tour Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Experience how tours can guide users through forms with input
          requirements
        </p>
        <Button onClick={startDemoTour} size="lg" className="mb-6">
          <BookOpen className="mr-2 h-5 w-5" />
          Start Interactive Demo Tour
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tour Control Panel */}
        <div className="lg:col-span-1">
          <TourControl className="sticky top-4" />

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tour Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span className="text-sm">User input validation</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span className="text-sm">Step progression control</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span className="text-sm">Backward navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span className="text-sm">Custom event handlers</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span className="text-sm">Visual progress tracking</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Demo Form
              </CardTitle>
              <CardDescription>
                This form demonstrates tour interactions with different input
                types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name-input">Name *</Label>
                  <Input
                    id="name-input"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-input">Email *</Label>
                  <Input
                    id="email-input"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college-select">College *</Label>
                  <Select
                    onValueChange={(value) => {
                      handleInputChange("college", value);
                      // Trigger tour input completion for select
                      const selectElement = document.querySelector('[data-tour="college-select"]');
                      if (selectElement) {
                        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                      }
                    }}
                  >
                    <SelectTrigger id="college-select">
                      <SelectValue placeholder="Select your college" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SKYLINE">Skyline College</SelectItem>
                      <SelectItem value="CSM">College of San Mateo</SelectItem>
                      <SelectItem value="CANADA">Cañada College</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message-textarea">Message (Optional)</Label>
                  <Textarea
                    id="message-textarea"
                    placeholder="Enter any additional message..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      handleInputChange("message", e.target.value)
                    }
                    className="transition-all duration-200"
                  />
                </div>

                <Button
                  id="submit-button"
                  type="submit"
                  className="w-full"
                  size="lg"
                >
                  Submit Demo Form
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Completion Card */}
          <Card
            id="completion-card"
            className="mt-6 border-green-200 dark:border-green-800"
          >
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400">
                🎉 Demo Completed!
              </CardTitle>
              <CardDescription>
                You've successfully experienced the interactive tour system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Name:</strong> {formData.name || "Not provided"}
                </div>
                <div>
                  <strong>Email:</strong> {formData.email || "Not provided"}
                </div>
                <div>
                  <strong>College:</strong> {formData.college || "Not selected"}
                </div>
                <div className="col-span-2">
                  <strong>Message:</strong> {formData.message || "No message"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">User Input Control</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Tours can require user input before proceeding. Steps marked
                with <code>waitForUserInput: true</code>
                will prevent progression until the user completes the required
                action.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Flexible Navigation</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Users can always navigate backward through tour steps, even when
                input is required. Only forward progression is controlled by
                input completion.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Input Types</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Supports multiple input types: <code>click</code>,{" "}
                <code>input</code>, <code>select</code>, and <code>custom</code>{" "}
                with validation functions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Visual Feedback</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Real-time progress tracking and input completion status with
                clear visual indicators and disabled states for improved UX.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
