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
import {
  User,
  MapPin,
  Calendar,
  Building,
  ArrowLeft,
  Globe,
} from "lucide-react";
import { formatDisplayName } from "@/lib/display-name";

/* ----------------------------------------------------------------------------
   Helpers
---------------------------------------------------------------------------- */

async function fetchDoorcard(
  username: string,
  termSlug: string | undefined,
  useAuth: boolean,
) {
  // If ?auth=true is passed, we allow viewing non-public doorcards (must be signed in)
  const session = await getServerSession(authOptions);
  if (useAuth && !session?.user?.email) {
    return { error: "Authentication required" } as const;
  }

  // Find the user first - try username, then name-based search
  let user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, name: true, college: true, email: true },
  });

  // If not found by username, try finding by name slug
  if (!user) {
    // Convert slug back to potential name patterns
    const namePatterns = [
      username.replace(/-/g, " "), // "john-ortiz" -> "john ortiz"
      username
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "), // "john-ortiz" -> "John Ortiz"
    ];

    user = await prisma.user.findFirst({
      where: {
        OR: namePatterns.map((name) => ({
          name: { equals: name, mode: "insensitive" as const },
        })),
      },
      select: { id: true, name: true, college: true, email: true },
    });
  }

  if (!user) return { error: "Doorcard not found" } as const;

  // If termSlug is provided we need to find the matching doorcard
  let doorcard;
  if (termSlug) {
    // The termSlug might be partial (e.g., "fall-2021") or full slug
    doorcard = await prisma.doorcard.findFirst({
      where: {
        userId: user.id,
        OR: [
          { slug: termSlug }, // Exact match
          { slug: { endsWith: `-${termSlug}` } }, // Ends with term slug
          { slug: { contains: termSlug } }, // Contains term slug
        ],
      },
      include: {
        appointments: true,
        user: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            title: true,
            pronouns: true,
            displayFormat: true,
            college: true,
            website: true,
          },
        },
      },
    });
    if (!doorcard) return { error: "Doorcard not found" } as const;
  } else {
    // Current active doorcard for this user (implementation may vary)
    doorcard = await prisma.doorcard.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        appointments: true,
        user: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            title: true,
            pronouns: true,
            displayFormat: true,
            college: true,
            website: true,
          },
        },
      },
    });
    if (!doorcard) return { error: "Doorcard not found" } as const;
  }

  // Enforce public visibility unless ?auth=true with valid session
  if (!doorcard.isPublic && !useAuth) {
    return { error: "This doorcard is not publicly accessible" } as const;
  }

  return { doorcard } as const;
}

/* ----------------------------------------------------------------------------
   Page
---------------------------------------------------------------------------- */

export default async function PublicDoorcardView({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slugArray = resolvedParams.slug;
  if (!Array.isArray(slugArray) || slugArray.length === 0) notFound();

  const username = slugArray[0];
  const termSlug = slugArray[1]; // optional
  const useAuth = resolvedSearchParams.auth === "true";
  const autoPrint = resolvedSearchParams.print === "true";

  const result = await fetchDoorcard(username, termSlug, useAuth);

  if ("error" in result) {
    // Render a simple error page (could also call notFound())
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Doorcard Not Available</h1>
          <p className="text-gray-600 mb-6">{result.error}</p>
          <Button asChild>
            <Link href="/">Browse Doorcards</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { doorcard } = result;
  const isSpecificTerm = Boolean(termSlug);

  // Convert doorcard to match DoorcardLite interface
  const doorcardLite = {
    ...doorcard,
    year: String(doorcard.year), // Convert number to string
    term: doorcard.term || undefined,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Auto-print handler */}
      <AutoPrintHandler autoPrint={autoPrint} />

      {/* Analytics tracker (client) */}
      <DoorcardViewTracker
        doorcardId={doorcard.id}
        slug={slugArray.join("/")}
        source={useAuth ? "admin_view" : "public_url"}
        isSpecificTerm={isSpecificTerm}
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
                  {isSpecificTerm && (
                    <Badge variant="outline" className="text-xs">
                      {doorcard.term} {doorcard.year}
                    </Badge>
                  )}
                  {doorcard.isActive ? (
                    <Badge
                      variant="default"
                      className="text-xs bg-green-100 text-green-800"
                    >
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Draft
                    </Badge>
                  )}
                  {!doorcard.isPublic && (
                    <Badge
                      variant="outline"
                      className="text-xs border-amber-200 text-amber-700"
                    >
                      Private
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 print:text-xs">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {doorcard.user
                      ? formatDisplayName(doorcard.user)
                      : doorcard.name}
                  </span>
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
                {doorcard.user?.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <a
                      href={
                        doorcard.user.website.startsWith("http")
                          ? doorcard.user.website
                          : `https://${doorcard.user.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Faculty Website
                    </a>
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
                doorcard={doorcardLite}
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
              <UnifiedDoorcard doorcard={doorcardLite} />
            </div>

            {/* Print version - optimized for single page */}
            <div className="hidden print:block">
              <PrintOptimizedDoorcard doorcard={doorcardLite} />
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
