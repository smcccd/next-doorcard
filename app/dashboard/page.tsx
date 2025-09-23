// app/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/require-auth-user";
import { categorizeDoorcards } from "@/lib/doorcard-status";
import NewDoorcardButton from "./components/NewDoorcardButton";
import DoorcardGrid from "./components/DoorcardGrid";
import { ProfileBanner } from "@/components/ProfileBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Calendar, Clock } from "lucide-react";
import { getCurrentAcademicTerm } from "@/lib/active-term";

import type { Doorcard, Appointment, User, TermSeason } from "@prisma/client";

type DashboardDoorcard = Doorcard & {
  appointments: Appointment[];
  user: Pick<User, "username" | "name">;
};

export default async function DashboardPage() {
  const user = await requireAuthUser();

  const [rawDoorcards, metrics, activeTerm] = await Promise.all([
    prisma.doorcard.findMany({
      where: { userId: user.id },
      include: {
        Appointment: true,
        User: { select: { username: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.doorcardMetrics.aggregate({
      _sum: { totalViews: true, totalPrints: true, totalShares: true },
    }),
    // Try to get active term from database, fallback to computed
    prisma.term
      .findFirst({
        where: { isActive: true },
      })
      .then((term) => term || null),
  ]);

  // Transform Prisma data to match component expectations
  const doorcards: DashboardDoorcard[] = rawDoorcards.map((dc) => ({
    ...dc,
    appointments: dc.Appointment,
    user: dc.User,
  }));

  // Get current term info (database or computed)
  const currentTermInfo = activeTerm
    ? { displayName: activeTerm.name, isFromDatabase: true }
    : { ...getCurrentAcademicTerm(), isFromDatabase: false };

  // Prepare active term for categorization (convert from database format)
  const validSeasons: TermSeason[] = ["FALL", "SPRING", "SUMMER"];
  const activeTermForCategorization = activeTerm
    ? {
        season: validSeasons.includes(activeTerm.season as TermSeason)
          ? (activeTerm.season as TermSeason)
          : "FALL", // Default to FALL if invalid
        year: parseInt(activeTerm.year) || new Date().getFullYear(), // Default to current year if invalid
      }
    : null;

  // Categorize doorcards by temporal status
  const { current, archived, upcoming } = categorizeDoorcards(
    doorcards,
    activeTermForCategorization
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-8">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <ProfileBanner />

        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">My Doorcards</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>Current Term: {currentTermInfo.displayName}</span>
                {currentTermInfo.isFromDatabase && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    (Active)
                  </span>
                )}
              </div>
            </div>
            <NewDoorcardButton />
          </div>
        </header>

        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Dashboard Statistics
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current Term
                  </p>
                  <p className="text-3xl font-bold">{current.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Active doorcards
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Live Doorcards
                  </p>
                  <p className="text-3xl font-bold">
                    {doorcards.filter((d) => d.isActive && d.isPublic).length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Public & active</p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            {upcoming.length > 0 && (
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Upcoming
                    </p>
                    <p className="text-3xl font-bold">{upcoming.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Future terms
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </CardContent>
              </Card>
            )}
            {metrics._sum.totalViews !== null && (
              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total Views
                    </p>
                    <p className="text-3xl font-bold">
                      {metrics._sum.totalViews}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      All time
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-purple-600" />
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <DoorcardGrid
          variant="list"
          doorcards={current}
          title={`Current Term (${currentTermInfo.displayName})`}
          emptyMessage={`No doorcards for ${currentTermInfo.displayName} yet.`}
          activeTerm={activeTermForCategorization}
        />

        {upcoming.length > 0 && (
          <DoorcardGrid
            variant="list"
            doorcards={upcoming}
            title="Upcoming Terms"
            emptyMessage="No upcoming doorcards."
            activeTerm={activeTermForCategorization}
          />
        )}

        {archived.length > 0 && (
          <DoorcardGrid
            variant="list"
            doorcards={archived}
            title="Past Terms (Archived)"
            emptyMessage="No archived doorcards."
            activeTerm={activeTermForCategorization}
          />
        )}
      </div>
    </div>
  );
}
