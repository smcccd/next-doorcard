// app/dashboard/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/require-auth-user";
import DoorcardGrid from "./components/DoorcardGrid";
import DraftList from "./components/DraftList";
import NewDoorcardButton from "./components/NewDoorcardButton";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, FileText, CheckCircle } from "lucide-react";
import type {
  Doorcard,
  Appointment,
  User,
  DoorcardDraft,
} from "@prisma/client";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type DashboardDoorcard = Doorcard & {
  appointments: Appointment[];
  user: Pick<User, "username" | "name">;
};

interface StatsCardsProps {
  doorcards: DashboardDoorcard[];
  drafts: DoorcardDraft[];
  metrics: {
    totalViews: number | null;
    totalPrints: number | null;
    totalShares: number | null;
  } | null;
}

/* Simple server StatsCards (remove if you have a richer version) */
function StatsCards({ doorcards, drafts, metrics }: StatsCardsProps) {
  const activeCount = doorcards.filter((d) => d.isActive).length;
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Doorcards</p>
            <p className="text-3xl font-bold">{activeCount}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-blue-600" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Views</p>
            <p className="text-3xl font-bold">{metrics?.totalViews ?? 0}</p>
          </div>
          <Eye className="h-8 w-8 text-green-600" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Drafts</p>
            <p className="text-3xl font-bold">{drafts.length}</p>
          </div>
          <FileText className="h-8 w-8 text-orange-600" />
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default async function DashboardPage() {
  const user = await requireAuthUser();

  const [doorcards, drafts, metrics] = await Promise.all([
    prisma.doorcard.findMany({
      where: { userId: user.id },
      include: {
        appointments: true,
        user: { select: { username: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }) as Promise<DashboardDoorcard[]>,
    prisma.doorcardDraft.findMany({
      where: { userId: user.id },
      orderBy: { lastUpdated: "desc" },
    }),
    prisma.doorcardMetrics.aggregate({
      _sum: { totalViews: true, totalPrints: true, totalShares: true },
    }),
  ]);

  return (
    <div className="px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Doorcards</h1>
        <NewDoorcardButton />
      </div>

      <StatsCards
        doorcards={doorcards}
        drafts={drafts}
        metrics={metrics._sum}
      />

      <DoorcardGrid
        doorcards={doorcards.filter((d) => d.isActive)}
        title="Current Term"
        emptyMessage="No active doorcards yet."
      />

      <DoorcardGrid
        variant="list"
        doorcards={doorcards.filter((d) => !d.isActive)}
        title="Archives"
        emptyMessage="No archived doorcards."
      />

      <DraftList drafts={drafts} />
    </div>
  );
}
