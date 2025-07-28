import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { UnifiedDoorcard } from "@/components/UnifiedDoorcard";
import { PrintOptimizedDoorcard } from "@/components/PrintOptimizedDoorcard";
import { DoorcardActions } from "@/components/UnifiedDoorcardActions";
import { DoorcardViewTracker } from "@/components/doorcard/DoorcardViewTracker";
import { AutoPrintHandler } from "@/components/AutoPrintHandler";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, MapPin, Calendar, Building, ArrowLeft } from "lucide-react";
import { getDoorcardDisplayStatus } from "@/lib/doorcard-status";

/* ----------------------------------------------------------------------------
   Doorcard View by ID (for admin access)
---------------------------------------------------------------------------- */

export default async function DoorcardViewById({
  params,
  searchParams,
}: {
  params: Promise<{ doorcardId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const doorcardId = resolvedParams.doorcardId;
  const useAuth = resolvedSearchParams.auth === "true";
  const autoPrint = resolvedSearchParams.print === "true";

  // For auth=true views, require authentication
  const session = await getServerSession(authOptions);
  if (useAuth && !session?.user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to view this doorcard.</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Fetch doorcard by ID
  const doorcard = await prisma.doorcard.findUnique({
    where: { id: doorcardId },
    include: {
      appointments: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      user: { 
        select: { 
          name: true, 
          firstName: true,
          lastName: true,
          title: true,
          pronouns: true,
          displayFormat: true,
          username: true,
          college: true,
          website: true 
        } 
      },
    },
  });

  if (!doorcard) {
    notFound();
  }

  // Enforce visibility rules unless authenticated
  if (!doorcard.isPublic && !useAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Doorcard Not Available</h1>
          <p className="text-gray-600 mb-6">This doorcard is not publicly accessible.</p>
          <Button asChild>
            <Link href="/">Browse Doorcards</Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayStatus = getDoorcardDisplayStatus(doorcard);

  return (
    <div className="min-h-screen bg-white">
      {/* Auto-print handler */}
      <AutoPrintHandler autoPrint={autoPrint} />
      
      {/* Analytics tracker (client) */}
      <DoorcardViewTracker
        doorcardId={doorcard.id}
        slug={`doorcard/${doorcard.id}`}
        source={useAuth ? "admin_view" : "direct_link"}
        isSpecificTerm={true}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-6 print:py-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="mb-3">
                <h1 className="text-2xl font-bold text-gray-900 print:text-xl mb-2">
                  {doorcard.doorcardName || "Faculty Doorcard"}
                </h1>
                {/* Badge row with better spacing */}
                <div className="flex flex-wrap items-center gap-2">
                  {useAuth && (
                    <Badge variant="outline" className="text-xs">
                      Admin View
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {doorcard.term} {doorcard.year}
                  </Badge>
                  <Badge 
                    variant={displayStatus.status === "live" ? "default" : "secondary"} 
                    className={`text-xs ${
                      displayStatus.status === "live" 
                        ? "bg-green-100 text-green-800" 
                        : displayStatus.status === "archived"
                        ? "bg-gray-100 text-gray-600"
                        : displayStatus.status === "upcoming"
                        ? "bg-blue-100 text-blue-800"
                        : ""
                    }`}
                  >
                    {displayStatus.label}
                  </Badge>
                  {!doorcard.isPublic && (
                    <Badge variant="outline" className="text-xs border-amber-200 text-amber-700">
                      Private
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 print:text-xs">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{doorcard.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Office {doorcard.officeNumber}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {doorcard.term} {doorcard.year}
                  </span>
                </div>
                {doorcard.college && (
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>{doorcard.college}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons (client) */}
            <div className="print:hidden flex gap-2">
              {useAuth && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Dashboard
                  </Link>
                </Button>
              )}
              <DoorcardActions 
                doorcard={{
                  ...doorcard,
                  year: doorcard.year.toString()
                }} 
                doorcardId={doorcard.id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule - Screen and Print versions */}
      <div className="w-full">
        {doorcard.appointments.length > 0 ? (
          <>
            {/* Screen version - full schedule with all features */}
            <div className="w-full print:hidden">
              <UnifiedDoorcard doorcard={{
                ...doorcard,
                year: doorcard.year.toString()
              }} />
            </div>
            
            {/* Print version - optimized for single page */}
            <div className="hidden print:block">
              <PrintOptimizedDoorcard doorcard={{
                ...doorcard,
                year: doorcard.year.toString()
              }} />
            </div>
          </>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-12 text-center">
            <p className="text-gray-600">
              No scheduled appointments or office hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}