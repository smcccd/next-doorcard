import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { UnifiedDoorcard } from "@/components/UnifiedDoorcard";
import { DoorcardActions } from "@/components/UnifiedDoorcardActions";
import { DoorcardViewTracker } from "@/components/doorcard/DoorcardViewTracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, MapPin, Calendar, Building, ArrowLeft } from "lucide-react";

/* ----------------------------------------------------------------------------
   Helpers
---------------------------------------------------------------------------- */

async function fetchDoorcard(
  username: string,
  termSlug: string | undefined,
  useAuth: boolean
) {
  // If ?auth=true is passed, we allow viewing non-public doorcards (must be signed in)
  const session = await getServerSession(authOptions);
  if (useAuth && !session?.user?.email) {
    return { error: "Authentication required" } as const;
  }

  // Find the user first
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, name: true, college: true, email: true },
  });
  if (!user) return { error: "Doorcard not found" } as const;

  // If termSlug is provided we treat it as an explicit slug
  let doorcard;
  if (termSlug) {
    doorcard = await prisma.doorcard.findUnique({
      where: { slug: termSlug },
      include: {
        appointments: true,
        user: { select: { name: true, college: true } },
      },
    });
    // Make sure this doorcard belongs to that username
    if (!doorcard || doorcard.userId !== user.id)
      return { error: "Doorcard not found" } as const;
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
        user: { select: { name: true, college: true } },
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
  params: { slug: string[] };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const slugArray = params.slug;
  if (!Array.isArray(slugArray) || slugArray.length === 0) notFound();

  const username = slugArray[0];
  const termSlug = slugArray[1]; // optional
  const useAuth = searchParams.auth === "true";

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

  return (
    <div className="min-h-screen bg-white">
      {/* Analytics tracker (client) */}
      <DoorcardViewTracker
        doorcardId={doorcard.id}
        slug={slugArray.join("/")}
        source={useAuth ? "admin_view" : "public_url"}
        isSpecificTerm={isSpecificTerm}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 print:border-b-0">
        <div className="max-w-4xl mx-auto px-4 py-6 print:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 print:text-xl">
                  {doorcard.doorcardName || "Faculty Doorcard"}
                </h1>
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
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
                {doorcard.isPublic ? (
                  <Badge variant="default" className="text-xs">
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Private
                  </Badge>
                )}
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
              <DoorcardActions doorcard={doorcard} />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="w-full">
        {doorcard.appointments.length > 0 ? (
          <div className="w-full">
            <UnifiedDoorcard doorcard={doorcard} />
          </div>
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
