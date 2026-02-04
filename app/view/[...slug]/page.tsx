import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { UnifiedDoorcard } from "@/components/doorcard/UnifiedDoorcard";
import { PrintOptimizedDoorcard } from "@/components/doorcard/PrintOptimizedDoorcard";
import { DoorcardViewTracker } from "@/components/doorcard/DoorcardViewTracker";
import { AutoPrintHandler } from "@/components/doorcard/AutoPrintHandler";
import { LazyDoorcardPDF } from "@/components/pdf/LazyDoorcardPDF";
import { analytics } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CollegeLogo from "@/components/logos/CollegeLogo";
import { College } from "@/types/doorcard";
import { User, MapPin, Calendar, ArrowLeft, Globe } from "lucide-react";
import { formatDisplayName } from "@/lib/display-name";
import { DoorcardSelectionPage } from "@/components/doorcard/DoorcardSelectionPage";
import { TermManager } from "@/lib/term/term-management";

/* ----------------------------------------------------------------------------
   Helpers
---------------------------------------------------------------------------- */

/**
 * Multi-Doorcard URL Strategy
 *
 * This application supports multiple doorcards per campus per term for each user.
 * The URL patterns are designed to be human-readable while handling ambiguity:
 *
 * URL Patterns:
 * - /view/username/current - Find the current active doorcard
 * - /view/username/fall-2025 - Find doorcards matching the term
 * - /view/username/csm-fall-2025 - Find doorcard for specific campus/term
 *
 * When Multiple Doorcards Match:
 * - If a URL pattern matches multiple doorcards (e.g., a user has 2 doorcards
 *   for CSM Fall 2025), the system shows a selection page (DoorcardSelectionPage)
 *   allowing the user to choose which doorcard to view.
 * - This maintains human-readable URLs while gracefully handling edge cases.
 *
 * Design Decision:
 * - We keep term-based URLs (not ID-based) for better UX and shareability
 * - Selection UI provides fallback when uniqueness cannot be guaranteed
 * - Public vs authenticated views are handled via ?auth=true query parameter
 */
async function fetchDoorcard(
  username: string,
  termSlug: string | undefined,
  useAuth: boolean
) {
  // If ?auth=true is passed, we allow viewing non-public doorcards (must be signed in)
  const session = await auth();
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
          name: { equals: name },
        })),
      },
      select: { id: true, name: true, college: true, email: true },
    });
  }

  if (!user) return { error: "Doorcard not found" } as const;

  // If termSlug is provided we need to find the matching doorcard
  let doorcard;
  if (termSlug) {
    // Handle "current" as a special case to find active doorcard in current term
    if (termSlug === "current") {
      // Get current active term
      const activeTerm = await TermManager.getActiveTerm();

      doorcard = await prisma.doorcard.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          // If there's an active term, prefer doorcards from that term, otherwise get any active doorcard
          ...(activeTerm
            ? {
                term: activeTerm.season as any,
                year: parseInt(activeTerm.year),
              }
            : {}),
          // If not using auth, only look for public doorcards
          ...(useAuth ? {} : { isPublic: true }),
        },
        orderBy: [
          // Prioritize public doorcards, then most recent
          { isPublic: "desc" },
          { updatedAt: "desc" },
        ],
        include: {
          Appointment: true,
          User: {
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
    } else {
      // The termSlug might be partial (e.g., "fall-2021") or term-year format
      doorcard = await prisma.doorcard.findFirst({
        where: {
          userId: user.id,
          OR: [
            { slug: termSlug }, // Exact match
            { slug: { endsWith: `-${termSlug}` } }, // Ends with term slug
            { slug: { contains: termSlug } }, // Contains term slug
            // Also match college-term-year pattern (e.g., "csm-fall-2025") or term-year pattern (e.g., "fall-2025")
            ...(termSlug.match(
              /^(skyline|csm|canada)-(fall|spring|summer)-(\d{4})$/i
            )
              ? [
                  {
                    AND: [
                      { college: termSlug.split("-")[0].toUpperCase() as any },
                      { term: termSlug.split("-")[1].toUpperCase() as any },
                      { year: parseInt(termSlug.split("-")[2]) },
                    ],
                  },
                ]
              : termSlug.match(/^(fall|spring|summer)-(\d{4})$/i)
                ? [
                    {
                      AND: [
                        { term: termSlug.split("-")[0].toUpperCase() as any },
                        { year: parseInt(termSlug.split("-")[1]) },
                      ],
                    },
                  ]
                : []),
          ],
        },
        include: {
          Appointment: true,
          User: {
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
    }
    if (!doorcard) return { error: "Doorcard not found" } as const;
  } else {
    // Check for ALL active doorcards - don't filter by term to ensure all published doorcards remain viewable
    const availableDoorcards = await prisma.doorcard.findMany({
      where: {
        userId: user.id,
        isActive: true,
        // If not using auth, only look for public doorcards
        ...(useAuth ? {} : { isPublic: true }),
      },
      orderBy: [
        // Prioritize public doorcards, then most recent
        { isPublic: "desc" },
        { year: "desc" },
        { term: "asc" },
        { updatedAt: "desc" },
      ],
      include: {
        Appointment: true,
        User: {
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

    if (availableDoorcards.length === 0) {
      return { error: "Doorcard not found" } as const;
    }

    // MULTI-DOORCARD HANDLING:
    // When a user has multiple active doorcards (e.g., teaching at multiple campuses
    // in the same term), and no specific term slug is provided in the URL, we show
    // a selection page rather than arbitrarily choosing one. This gives users control
    // while keeping URLs simple and readable.
    if (availableDoorcards.length > 1) {
      // Return multiple doorcards for selection UI
      return { multipleDoorcards: availableDoorcards, user } as const;
    }

    // Single doorcard - use it directly
    doorcard = availableDoorcards[0];
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
      <div className="flex items-center justify-center bg-gray-50 py-12">
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

  // Handle multiple doorcards - show selection UI
  if ("multipleDoorcards" in result) {
    return (
      <DoorcardSelectionPage
        username={username}
        doorcards={result.multipleDoorcards || []}
        user={result.user}
        useAuth={useAuth}
      />
    );
  }

  const { doorcard } = result as { doorcard: any };
  const isSpecificTerm = Boolean(termSlug);

  // Transform Prisma data and convert to match DoorcardLite interface
  const transformedDoorcard = {
    ...doorcard,
    appointments: doorcard.Appointment,
    user: doorcard.User,
  };

  const doorcardLite = {
    ...transformedDoorcard,
    year: String(doorcard.year), // Convert number to string
    term: transformedDoorcard.term || undefined,
  };

  return (
    <div className="bg-white">
      {/* Auto-print handler */}
      <AutoPrintHandler autoPrint={autoPrint} />

      {/* Analytics tracker (client) */}
      <DoorcardViewTracker
        doorcardId={transformedDoorcard.id}
        slug={slugArray.join("/")}
        source={useAuth ? "admin_view" : "public_url"}
        isSpecificTerm={isSpecificTerm}
      />

      {/* Simplified Header */}
      <div className="bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              {transformedDoorcard.doorcardName || "Faculty Doorcard"}
            </h1>

            {/* Only Download PDF Button */}
            <div className="flex gap-2">
              {useAuth && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Dashboard
                  </Link>
                </Button>
              )}
              <LazyDoorcardPDF
                doorcard={doorcardLite}
                doorcardId={transformedDoorcard.id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule - Screen and Print versions */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {transformedDoorcard.appointments &&
        transformedDoorcard.appointments.length > 0 ? (
          <>
            {/* Screen version - full schedule with all features */}
            <div className="print:hidden">
              <UnifiedDoorcard
                doorcard={doorcardLite}
                showWeekendDays={false}
              />
            </div>

            {/* Print version - optimized for single page */}
            <div className="hidden print:block">
              <PrintOptimizedDoorcard doorcard={doorcardLite} />
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-600">
              No scheduled appointments or office hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
