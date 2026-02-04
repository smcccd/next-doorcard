import { notFound, redirect } from "next/navigation";
import { requireAuthUser } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";
import { publishDoorcard } from "@/app/doorcard/actions";
import { getTermStatus } from "@/lib/doorcard/doorcard-status";

import CampusTermForm from "./_components/CampusTermForm";
import BasicInfoForm from "./_components/BasicInfoForm";
import TimeBlockForm from "./_components/TimeBlockForm";
import UnifiedDoorcard from "@/components/doorcard/UnifiedDoorcard";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { TermSeason } from "@prisma/client";

function seasonToDisplay(season?: TermSeason | null): string {
  if (!season) return "";
  return season.charAt(0) + season.slice(1).toLowerCase(); // FALL -> Fall
}

const STEPS = [
  { title: "Campus & Term", desc: "Select your campus and term" },
  { title: "Basic Info", desc: "Subtitle and office location" },
  { title: "Schedule", desc: "Add your time blocks" },
  { title: "Preview", desc: "Review and publish" },
];

export default async function EditDoorcardPage({
  params,
  searchParams,
}: {
  params: Promise<{ doorcardId: string }>;
  searchParams?: Promise<{ step?: string }>;
}) {
  const user = await requireAuthUser();

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { doorcardId } = resolvedParams;
  const step = Number.parseInt(resolvedSearchParams?.step ?? "0", 10) || 0;

  const [doorcard, userProfile] = await Promise.all([
    prisma.doorcard.findFirst({
      where: { id: doorcardId, userId: user.id },
      include: {
        Appointment: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        firstName: true,
        lastName: true,
        title: true,
        name: true,
      },
    }),
  ]);
  if (!doorcard) notFound();

  // Redirect archived doorcards to view-only mode
  const termStatus = getTermStatus(doorcard);
  if (termStatus === "past") {
    redirect(`/doorcard/${doorcardId}?archived=true`);
  }

  // Adapt appointments into “timeBlocks” shape for legacy forms
  const timeBlocks = doorcard.Appointment.map((a) => ({
    id: a.id,
    day: a.dayOfWeek,
    startTime: a.startTime,
    endTime: a.endTime,
    activity: a.name,
    location: a.location || undefined,
    category: a.category,
  }));

  // Create smart defaults for form data using user profile
  const getDefaultName = () => {
    if (doorcard.name) return doorcard.name;
    if (userProfile?.firstName && userProfile?.lastName) {
      if (userProfile.title && userProfile.title !== "none") {
        return `${userProfile.title} ${userProfile.firstName} ${userProfile.lastName}`;
      }
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    if (userProfile?.name) return userProfile.name;
    return "";
  };

  const getDefaultDoorcardName = () => {
    if (doorcard.doorcardName) return doorcard.doorcardName;
    // Default to "TERM YEAR Doorcard" format
    const term = seasonToDisplay(doorcard.term) || "Term";
    const year = doorcard.year || "Year";
    return `${term} ${year} Doorcard`;
  };

  const doorcardForForms = {
    id: doorcard.id,
    name: getDefaultName(),
    doorcardName: getDefaultDoorcardName(),
    officeNumber: doorcard.officeNumber,
    term: seasonToDisplay(doorcard.term),
    year: doorcard.year != null ? String(doorcard.year) : "",
    college: doorcard.college || "",
    timeBlocks,
  };

  const previewAppointments = doorcard.Appointment.map((a) => ({
    id: a.id,
    name: a.name,
    startTime: a.startTime,
    endTime: a.endTime,
    dayOfWeek: a.dayOfWeek,
    category: a.category,
    location: a.location || undefined,
  }));

  const publishDisabled =
    !doorcard.name ||
    !doorcard.doorcardName ||
    !doorcard.officeNumber ||
    !doorcard.term ||
    !doorcard.year ||
    !doorcard.college ||
    doorcard.Appointment.length === 0;

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
            <h1 className="text-3xl font-bold text-gray-900">Edit Doorcard</h1>
          </div>

          {/* Step indicator - Clean shadcn pattern */}
          <div className="relative mt-8">
            <nav
              aria-label="Progress"
              className="flex items-center justify-between"
            >
              {STEPS.map((s, idx) => {
                const isComplete = step > idx;
                const isCurrent = step === idx;

                return (
                  <div key={s.title} className="flex items-center">
                    {/* Step circle */}
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
                          isComplete
                            ? "border-blue-600 bg-blue-600 text-white"
                            : isCurrent
                              ? "border-blue-600 bg-white text-blue-600"
                              : "border-gray-300 bg-white text-gray-500"
                        }`}
                        aria-current={isCurrent ? "step" : undefined}
                      >
                        {isComplete ? (
                          <span className="text-white">✓</span>
                        ) : (
                          idx + 1
                        )}
                      </div>

                      {/* Step labels */}
                      <div className="mt-2 text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {s.title}
                        </div>
                        <div className="text-xs text-gray-700">{s.desc}</div>
                      </div>
                    </div>

                    {/* Connecting line */}
                    {idx < STEPS.length - 1 && (
                      <div className="flex-1 mx-4 mt-[-20px]">
                        <div
                          className={`h-0.5 transition-colors ${
                            step > idx ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Screen reader announcements */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              Step {step + 1} of {STEPS.length}: {STEPS[step]?.title}
            </div>
          </div>
        </div>

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle as="h2">{STEPS[step]?.title ?? "Step"}</CardTitle>
          </CardHeader>
          <CardContent>
            {step === 0 && <CampusTermForm doorcard={doorcardForForms} />}
            {step === 1 && <BasicInfoForm doorcard={doorcardForForms} />}
            {step === 2 && <TimeBlockForm doorcard={doorcardForForms} />}
            {step === 3 && (
              <div className="space-y-8">
                <div className="overflow-hidden rounded-lg border bg-white">
                  <UnifiedDoorcard
                    doorcard={{
                      name: doorcardForForms.name,
                      doorcardName: doorcardForForms.doorcardName,
                      officeNumber: doorcardForForms.officeNumber,
                      term: doorcardForForms.term,
                      year: doorcardForForms.year,
                      college: doorcardForForms.college,
                      appointments: previewAppointments,
                    }}
                  />
                </div>

                <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-6">
                  <h3 className="text-lg font-semibold text-green-800">
                    Ready to Publish
                  </h3>
                  {publishDisabled ? (
                    <p className="text-sm text-green-700">
                      Complete all previous steps before publishing.
                    </p>
                  ) : (
                    <p className="text-sm text-green-700">
                      Click publish to make this doorcard visible to students.
                    </p>
                  )}
                  <div className="flex gap-4">
                    <Button variant="outline" asChild>
                      <Link href={`/doorcard/${doorcardId}/edit?step=2`}>
                        Back to Schedule
                      </Link>
                    </Button>
                    <form
                      action={async () => {
                        "use server";
                        await publishDoorcard(doorcardId);
                      }}
                    >
                      <Button type="submit" disabled={publishDisabled}>
                        Publish Doorcard
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
