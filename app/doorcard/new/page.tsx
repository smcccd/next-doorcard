import { requireAuthUser } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";
import NewDoorcardForm from "./NewDoorcardForm";
import { StepIndicator } from "@/components/ui/step-indicator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const NEW_DOORCARD_STEPS = [
  { title: "Campus & Term", description: "Select your campus and term" },
  { title: "Basic Info", description: "Your personal information" },
  { title: "Schedule", description: "Add your time blocks" },
  { title: "Preview", description: "Review and publish" },
];

export default async function NewDoorcardPage() {
  const user = await requireAuthUser();

  // Get user's profile for pre-filling
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      college: true,
    },
  });

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

        {/* Form content */}
        <div className="max-w-2xl mx-auto">
          <NewDoorcardForm userCollege={userProfile?.college} />
        </div>
      </div>
    </div>
  );
}
