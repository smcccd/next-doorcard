"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Square,
  SkipForward,
  SkipBack,
  HelpCircle,
  ChevronDown,
  Route,
  BookOpen,
  Edit3,
  Home,
} from "lucide-react";
import { useTour } from "./TourProvider";
import { useTourSteps } from "./useTourSteps";

interface TourControlProps {
  className?: string;
  showInHeader?: boolean;
}

export const TourControl: React.FC<TourControlProps> = ({
  className = "",
  showInHeader = false,
}) => {
  const {
    isActive,
    currentStep,
    steps,
    startTour,
    stopTour,
    nextStep,
    previousStep,
    checkUserInputComplete,
  } = useTour();

  const {
    DASHBOARD_TOUR_STEPS,
    NEW_DOORCARD_TOUR_STEPS,
    EDIT_DOORCARD_TOUR_STEPS,
    prepareDashboardForTour,
    prepareNewDoorcardForTour,
    prepareEditDoorcardForTour,
  } = useTourSteps();

  const tourOptions = [
    {
      id: "dashboard",
      name: "Dashboard Tour",
      description: "Learn the basics of navigating your dashboard",
      icon: Home,
      steps: DASHBOARD_TOUR_STEPS,
      prepare: prepareDashboardForTour,
    },
    {
      id: "new-doorcard",
      name: "Create Doorcard Tour",
      description: "Step-by-step doorcard creation guide",
      icon: BookOpen,
      steps: NEW_DOORCARD_TOUR_STEPS,
      prepare: prepareNewDoorcardForTour,
    },
    {
      id: "edit-doorcard",
      name: "Edit Doorcard Tour",
      description: "Learn how to edit and customize your doorcard",
      icon: Edit3,
      steps: EDIT_DOORCARD_TOUR_STEPS,
      prepare: prepareEditDoorcardForTour,
    },
  ];

  const handleStartTour = async (tourId: string) => {
    const tour = tourOptions.find((t) => t.id === tourId);
    if (!tour) return;

    // Prepare the page for the tour
    tour.prepare();

    // Start the tour
    await startTour(tour.steps, {
      showProgress: true,
      allowClose: true,
    });
  };

  const getCurrentStepInfo = () => {
    if (!isActive || !steps[currentStep]) return null;

    const step = steps[currentStep];
    const isInputComplete = step.popover.waitForUserInput
      ? checkUserInputComplete(step.id)
      : true;

    return {
      title: step.popover.title,
      inputRequired: step.popover.waitForUserInput,
      inputComplete: isInputComplete,
      inputType: step.popover.requiredInputType,
    };
  };

  const stepInfo = getCurrentStepInfo();

  // Compact header version
  if (showInHeader) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isActive ? (
          <>
            <Badge variant="secondary" className="text-xs">
              Step {currentStep + 1}/{steps.length}
            </Badge>
            {stepInfo?.inputRequired && !stepInfo.inputComplete && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                Input Required
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={stopTour}
              className="h-8 px-2"
            >
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <HelpCircle className="h-3 w-3 mr-1" />
                Help
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Interactive Tours</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tourOptions.map((tour) => {
                const Icon = tour.icon;
                return (
                  <DropdownMenuItem
                    key={tour.id}
                    onClick={() => handleStartTour(tour.id)}
                    className="flex flex-col items-start p-3"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{tour.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tour.description}
                    </p>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // Full control panel version
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Interactive Tours
          </h3>
        </div>
        {isActive && (
          <Badge variant="outline">
            Step {currentStep + 1} of {steps.length}
          </Badge>
        )}
      </div>

      {!isActive ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Take an interactive tour to learn how to use the app effectively.
          </p>

          <div className="grid gap-2">
            {tourOptions.map((tour) => {
              const Icon = tour.icon;
              return (
                <Button
                  key={tour.id}
                  variant="outline"
                  className="justify-start h-auto p-3"
                  onClick={() => handleStartTour(tour.id)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">{tour.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tour.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {stepInfo && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  {stepInfo.title}
                </h4>
                {stepInfo.inputRequired && (
                  <Badge
                    variant={stepInfo.inputComplete ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {stepInfo.inputComplete ? "✓ Complete" : "Input Required"}
                  </Badge>
                )}
              </div>

              {stepInfo.inputRequired && !stepInfo.inputComplete && (
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {stepInfo.inputType === "click" &&
                    "Click the highlighted element to continue"}
                  {stepInfo.inputType === "input" &&
                    "Fill in the highlighted input field"}
                  {stepInfo.inputType === "select" &&
                    "Make a selection from the highlighted dropdown"}
                  {stepInfo.inputType === "custom" &&
                    "Complete the required action"}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousStep}
                disabled={currentStep === 0}
              >
                <SkipBack className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={nextStep}
                disabled={
                  currentStep === steps.length - 1 ||
                  (stepInfo?.inputRequired && !stepInfo?.inputComplete)
                }
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Next
              </Button>
            </div>

            <Button variant="secondary" size="sm" onClick={stopTour}>
              <Square className="h-4 w-4 mr-1" />
              Stop Tour
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TourControl;
