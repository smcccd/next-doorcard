import { prisma } from "@/lib/prisma";
import { getCurrentAcademicTerm } from "@/lib/active-term";
import { HomeSearchClient } from "@/components/HomeSearchClient";
import { Calendar } from "lucide-react";
import { unstable_cache } from "next/cache";

import type { PublicDoorcard } from "@/types/pages/public";
import type { ActiveTermInfo } from "@/lib/active-term";
import { TermSeason } from "@prisma/client";

// Configure page-level caching
export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = "force-static"; // Force static generation

// Cache the expensive doorcard query for 5 minutes
const getCachedDoorcards = unstable_cache(
  async (season: TermSeason, year: number) => {
    const doorcards = await prisma.doorcard.findMany({
      where: {
        isPublic: true,
        isActive: true,
        term: season,
        year: year,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        Appointment: {
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            category: true,
          },
        },
        _count: {
          select: {
            Appointment: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Convert dates to strings for caching
    return doorcards.map((dc) => ({
      ...dc,
      createdAt: dc.createdAt.toISOString(),
      updatedAt: dc.updatedAt.toISOString(),
    }));
  },
  ["homepage-doorcards"],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ["doorcards"],
  }
);

export default async function Home() {
  // Get current term info first to filter data properly
  const currentTerm = getCurrentAcademicTerm();

  const [rawDoorcards, activeTerm] = await Promise.all([
    // Use cached version
    getCachedDoorcards(currentTerm.season, currentTerm.year),
    // Try to get active term from database, fallback to computed
    prisma.term
      .findFirst({
        where: { isActive: true },
      })
      .then((term) => term || null),
  ]);

  // Transform Prisma data to match component expectations
  const doorcards: PublicDoorcard[] = rawDoorcards.map((dc) => ({
    id: dc.id,
    name: dc.name,
    doorcardName: dc.doorcardName,
    officeNumber: dc.officeNumber,
    term: dc.term.toString(),
    year: dc.year,
    college: dc.college.toString(),
    slug: dc.slug || undefined,
    user: {
      name: dc.User.name || dc.User.username || "Faculty Member",
      username: dc.User.username || undefined,
    },
    appointmentCount: dc._count.Appointment,
    availableDays: [...new Set(dc.Appointment.map((apt) => apt.dayOfWeek))],
    createdAt:
      typeof dc.createdAt === "string"
        ? dc.createdAt
        : (dc.createdAt as Date).toISOString(),
    updatedAt:
      typeof dc.updatedAt === "string"
        ? dc.updatedAt
        : (dc.updatedAt as Date).toISOString(),
  }));

  // Get current term info (database or computed)
  const currentTermInfo: ActiveTermInfo | null = activeTerm
    ? {
        displayName: activeTerm.name,
        isFromDatabase: true,
        season: activeTerm.season as TermSeason,
        year: parseInt(activeTerm.year),
      }
    : { ...getCurrentAcademicTerm(), isFromDatabase: false };

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-smccd-blue-700 via-smccd-blue-800 to-smccd-blue-900 dark:from-smccd-blue-800 dark:via-smccd-blue-900 dark:to-smccd-blue-950">
          {/* Background Pattern - Light mode uses blue dots, dark mode uses white */}
          <div
            className="absolute inset-0 opacity-10 dark:opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          ></div>

          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-smccd-blue-950/30 to-transparent dark:from-black/20"></div>

          {/* Hero Content */}
          <div className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="text-center max-w-5xl mx-auto">
              <p className="text-xs sm:text-sm font-semibold text-smccd-blue-100 mb-3 uppercase tracking-widest">
                San Mateo County Community College District
              </p>
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-[1.1] tracking-tight">
                Find Office Hours
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-smccd-blue-100 font-normal max-w-2xl mx-auto mb-8">
                Connect with your favorite faculty at Skyline, College of San
                Mateo, and Cañada College
              </p>

              <HomeSearchClient
                initialDoorcards={doorcards}
                activeTerm={currentTermInfo}
                termLoading={false}
              />
              {currentTermInfo && (
                <div className="mt-8">
                  <div className="inline-flex items-center gap-2 bg-smccd-blue-900/30 backdrop-blur-sm border border-smccd-blue-400/30 rounded-full px-5 py-2.5">
                    <Calendar className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">
                      {currentTermInfo.displayName}
                    </span>
                    {currentTermInfo.isFromDatabase && (
                      <span className="text-xs text-smccd-blue-200 font-medium">
                        (Active)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
