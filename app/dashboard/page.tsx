// app/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/require-auth-user";
import { categorizeDoorcards } from "@/lib/doorcard-status";
import NewDoorcardButton from "./components/NewDoorcardButton";
import DoorcardGrid from "./components/DoorcardGrid";
import { ProfileBanner } from "@/components/ProfileBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types (optional)                                                           */
/* -------------------------------------------------------------------------- */
import type { Doorcard, Appointment, User } from "@prisma/client";

type DashboardDoorcard = Doorcard & {
  appointments: Appointment[];
  user: Pick<User, "username" | "name">;
};

/* -------------------------------------------------------------------------- */
/* Stats Cards                                                                */
/* -------------------------------------------------------------------------- */
function StatsCards({
  doorcards,
  metrics,
}: {
  doorcards: DashboardDoorcard[];
  metrics: {
    totalViews: number | null;
    totalPrints: number | null;
    totalShares: number | null;
  } | null;
}) {
  const liveCount = doorcards.filter((d) => d.isActive && d.isPublic).length;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Live Doorcards
            </p>
            <p className="text-3xl font-bold">{liveCount}</p>
          </div>
          <Eye className="h-8 w-8 text-green-600" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Views
            </p>
            <p className="text-3xl font-bold">{metrics?.totalViews ?? 0}</p>
          </div>
          <Eye className="h-8 w-8 text-green-600" />
        </CardContent>
      </Card>
      {/* Add more cards here if you later expose prints/shares */}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */
export default async function DashboardPage() {
  const user = await requireAuthUser();

  const [doorcards, metrics] = await Promise.all([
    prisma.doorcard.findMany({
      where: { userId: user.id },
      include: {
        appointments: true,
        user: { select: { username: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }) as Promise<DashboardDoorcard[]>,
    prisma.doorcardMetrics.aggregate({
      _sum: { totalViews: true, totalPrints: true, totalShares: true },
    }),
  ]);

  // Categorize doorcards by temporal status
  const { current, archived, upcoming } = categorizeDoorcards(doorcards);

  return (
    <div className="px-6 py-8 space-y-8">
      <ProfileBanner />

      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Doorcards</h1>
        <NewDoorcardButton />
      </header>

      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Dashboard Statistics
        </h2>
        <StatsCards doorcards={doorcards} metrics={metrics._sum} />
      </section>

      <DoorcardGrid
        doorcards={current}
        title="Current Term"
        emptyMessage="No doorcards for the current term yet."
      />

      {upcoming.length > 0 && (
        <DoorcardGrid
          variant="list"
          doorcards={upcoming}
          title="Upcoming Terms"
          emptyMessage="No upcoming doorcards."
        />
      )}

      {archived.length > 0 && (
        <DoorcardGrid
          variant="list"
          doorcards={archived}
          title="Past Terms (Archived)"
          emptyMessage="No archived doorcards."
        />
      )}
    </div>
  );
}
