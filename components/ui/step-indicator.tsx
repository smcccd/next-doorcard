"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface Step {
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  onStepClick?: (stepIndex: number) => void;
  allowNavigation?: boolean;
}

export function StepIndicator({
  steps,
  currentStep,
  className,
  onStepClick,
  allowNavigation = false,
}: StepIndicatorProps) {
  const handleStepClick = (stepIndex: number) => {
    if (allowNavigation && onStepClick && stepIndex <= currentStep) {
      onStepClick(stepIndex);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <nav aria-label="Progress" className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isComplete = currentStep > idx;
          const isCurrent = currentStep === idx;
          const isClickable =
            allowNavigation && idx <= currentStep && onStepClick;

          return (
            <div key={step.title} className="flex items-center">
              {/* Step circle */}
              <div className="relative flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => handleStepClick(idx)}
                  disabled={!isClickable}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    isComplete
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isCurrent
                        ? "border-blue-600 bg-white text-blue-600"
                        : "border-gray-300 bg-white text-gray-500",
                    isClickable
                      ? "cursor-pointer hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      : "cursor-default"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${step.title}${isComplete ? " (completed)" : isCurrent ? " (current)" : ""}`}
                >
                  {isComplete ? <span className="text-white">✓</span> : idx + 1}
                </button>

                {/* Step labels */}
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isCurrent || isComplete
                        ? "text-gray-900"
                        : "text-gray-500"
                    )}
                  >
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-700">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Connecting line */}
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-4 mt-[-20px]">
                  <div
                    className={cn(
                      "h-0.5 transition-colors",
                      currentStep > idx ? "bg-blue-600" : "bg-gray-200"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
      </div>
    </div>
  );
}
