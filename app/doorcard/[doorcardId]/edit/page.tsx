import { notFound } from "next/navigation";
import { requireAuthUser } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";

import CampusTermForm from "./_components/CampusTermForm";
import BasicInfoForm from "./_components/BasicInfoForm";
import TimeBlockForm from "./_components/TimeBlockForm";
import UnifiedDoorcard from "@/components/UnifiedDoorcard";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Dynamic edit page for an *actual* doorcard (no draftId).
 * URL: /doorcard/[doorcardId]/edit?step=0..3
 */
export default async function EditDoorcardPage({
  params,
  searchParams,
}: {
  params: Promise<{ doorcardId: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const user = await requireAuthUser();

  const { doorcardId } = await params;
  const { step: stepParam = "0" } = await searchParams;
  const step = Number.parseInt(stepParam, 10) || 0;

  const doorcard = await prisma.doorcard.findFirst({
    where: { id: doorcardId, userId: user.id },
    include: {
      appointments: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
    },
  });
  if (!doorcard) notFound();

  // Adapt appointments into old “timeBlocks” shape for the forms
  const timeBlocks = doorcard.appointments.map((a) => ({
    id: a.id,
    day: a.dayOfWeek,
    startTime: a.startTime,
    endTime: a.endTime,
    activity: a.name,
    location: a.location || undefined,
    category: a.category,
  }));

  const doorcardForForms = {
    id: doorcard.id,
    name: doorcard.name || "",
    doorcardName: doorcard.doorcardName || "",
    officeNumber: doorcard.officeNumber || "",
    term: doorcard.term || "",
    year: doorcard.year || "",
    college: doorcard.college || "",
    timeBlocks,
  };

  const previewAppointments = doorcard.appointments.map((a) => ({
    id: a.id,
    name: a.name,
    startTime: a.startTime,
    endTime: a.endTime,
    dayOfWeek: a.dayOfWeek,
    category: a.category,
    location: a.location || undefined,
  }));

  const stepInfo = (s: number) =>
    [
      { title: "Campus & Term", desc: "Select your campus and term" },
      { title: "Basic Info", desc: "Your personal information" },
      { title: "Schedule", desc: "Add your time blocks" },
      { title: "Preview", desc: "Review and publish" },
    ][s] || { title: "Unknown", desc: "" };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header / Breadcrumb */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            {doorcard.name
              ? `Edit ${doorcard.name}'s Doorcard`
              : "Edit Doorcard"}
          </h1>

          {/* Step indicator */}
          <div className="mt-4 flex items-center space-x-4">
            {[0, 1, 2, 3].map((n) => (
              <div
                key={n}
                className={`flex items-center ${n < 3 ? "flex-1" : ""}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                    step >= n
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {n}
                </div>
                <div className="ml-3 text-sm">
                  <div className="font-medium text-gray-900">
                    {stepInfo(n).title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stepInfo(n).desc}
                  </div>
                </div>
                {n < 3 && (
                  <div
                    className={`ml-4 h-1 flex-1 ${
                      step > n ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle>{stepInfo(step).title}</CardTitle>
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

                <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                  <h3 className="mb-2 text-lg font-semibold text-green-800">
                    Ready to Publish
                  </h3>
                  <p className="mb-4 text-green-700">
                    Once published, this doorcard becomes visible to students.
                  </p>
                  <div className="flex gap-4">
                    <Button variant="outline" asChild>
                      <Link href={`/doorcard/${doorcardId}/edit?step=2`}>
                        Back to Schedule
                      </Link>
                    </Button>
                    <form action={`/doorcard/${doorcardId}/publish`} />
                    {/* Replace with your publishDoorcard server action form if needed */}
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
