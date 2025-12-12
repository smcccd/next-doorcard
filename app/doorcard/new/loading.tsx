import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/ui/step-indicator";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const NEW_DOORCARD_STEPS = [
  { title: "Campus & Term", description: "Select your campus and term" },
  { title: "Basic Info", description: "Subtitle and office location" },
  { title: "Schedule", description: "Add your time blocks" },
  { title: "Preview", description: "Review and publish" },
];

export default function NewDoorcardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4 -ml-3">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Doorcard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Follow these steps to create and publish your doorcard. You can
              save your progress at any time.
            </p>
          </div>

          {/* Step indicator */}
          <div className="mt-8">
            <StepIndicator
              steps={NEW_DOORCARD_STEPS}
              currentStep={0}
              className="mb-8"
            />
          </div>
        </div>

        {/* Loading content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Loading skeleton */}
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>

              <div className="space-y-4">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-100 rounded border"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-100 rounded border"></div>
                </div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-10 bg-gray-100 rounded border"></div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <div className="h-10 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
