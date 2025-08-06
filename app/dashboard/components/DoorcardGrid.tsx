import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Printer,
  Edit,
  ExternalLink,
  XCircle,
  Eye,
  Clock,
  Archive,
  AlertTriangle,
} from "lucide-react";
import { type College, COLLEGE_META } from "@/types/doorcard";
import { getDoorcardDisplayStatus } from "@/lib/doorcard-status";
import type { Doorcard, Appointment, User, TermSeason } from "@prisma/client";

interface Props {
  doorcards: (Doorcard & {
    appointments: Appointment[];
    user?: Pick<User, "username" | "name">;
  })[];
  title: string;
  emptyMessage: string;
  variant?: "grid" | "list";
  activeTerm?: { season: TermSeason; year: number } | null;
}

export default function DoorcardGrid({
  doorcards,
  title,
  emptyMessage,
  variant = "grid",
  activeTerm,
}: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {doorcards.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {emptyMessage}
        </p>
      ) : variant === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2">
          {doorcards.map((dc) => (
            <DoorcardCard key={dc.id} doorcard={dc} activeTerm={activeTerm} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {doorcards.map((dc) => (
            <DoorcardRow key={dc.id} doorcard={dc} activeTerm={activeTerm} />
          ))}
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared Helpers                                                             */
/* -------------------------------------------------------------------------- */

function publicSlug(user?: { username?: string | null; name?: string | null }) {
  if (user?.username) return user.username;
  if (user?.name) return user.name.toLowerCase().replace(/\s+/g, "-");
  return "user";
}

/* -------------------------------------------------------------------------- */
/* Card (grid variant)                                                        */
/* -------------------------------------------------------------------------- */

function DoorcardCard({
  doorcard,
  activeTerm,
}: {
  doorcard: Doorcard & { appointments: Appointment[]; user?: any };
  activeTerm?: { season: TermSeason; year: number } | null;
}) {
  const displayStatus = getDoorcardDisplayStatus(doorcard, activeTerm);

  // Determine the correct view URL based on doorcard status
  const getViewUrl = () => {
    const username = publicSlug(doorcard.user);

    // For live doorcards, link to current view
    if (displayStatus.status === "live") {
      return `/view/${username}`;
    }

    // For admin viewing non-public doorcards, use doorcard ID for reliability
    // This avoids slug mismatches and username issues
    return `/doorcard/${doorcard.id}/view?auth=true`;
  };

  // Determine badge appearance based on status
  const getBadgeProps = (status: typeof displayStatus.status) => {
    switch (status) {
      case "live":
        return {
          variant: "default" as const,
          icon: <Eye className="h-3 w-3" aria-hidden="true" />,
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "draft":
        return {
          variant: "secondary" as const,
          icon: <XCircle className="h-3 w-3" aria-hidden="true" />,
          className: "bg-gray-100 text-gray-600",
        };
      case "incomplete":
        return {
          variant: "destructive" as const,
          icon: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
          className: "bg-orange-100 text-orange-800 border-orange-200",
        };
      case "upcoming":
        return {
          variant: "outline" as const,
          icon: <Clock className="h-3 w-3" aria-hidden="true" />,
          className: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "archived":
        return {
          variant: "outline" as const,
          icon: <Archive className="h-3 w-3" aria-hidden="true" />,
          className: "bg-gray-50 text-gray-500 border-gray-200",
        };
    }
  };

  const badgeProps = getBadgeProps(displayStatus.status);

  // Campus-specific card styling
  const getCampusCardStyle = (college?: College) => {
    if (!college) return "hover:shadow-sm";

    switch (college) {
      case "SKYLINE":
        return "hover:shadow-sm border-l-4 border-l-blue-500 hover:border-l-blue-600 bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-950/30";
      case "CSM":
        return "hover:shadow-sm border-l-4 border-l-red-500 hover:border-l-red-600 bg-gradient-to-r from-red-50/30 to-transparent dark:from-red-950/30";
      case "CANADA":
        return "hover:shadow-sm border-l-4 border-l-green-500 hover:border-l-green-600 bg-gradient-to-r from-green-50/30 to-transparent dark:from-green-950/30";
      default:
        return "hover:shadow-sm";
    }
  };

  return (
    <Card className={getCampusCardStyle(doorcard.college)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Badge
              variant={badgeProps.variant}
              className={`flex items-center gap-1 ${badgeProps.className} text-xs`}
              data-testid="status-badge"
              title={displayStatus.description}
            >
              {badgeProps.icon}
              {displayStatus.label}
            </Badge>
          </div>
        </div>
        <CardTitle as="h3" className="text-base">
          {doorcard.doorcardName ||
            `${doorcard.name || "Faculty Member"}'s ${doorcard.term} ${
              doorcard.year
            } Doorcard`}
        </CardTitle>
        <p className="text-xs text-gray-600">
          {doorcard.name || "Faculty Member"} •{" "}
          {doorcard.officeNumber || "Office TBD"}
        </p>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <span className="text-gray-600">Term:</span> {doorcard.term}{" "}
          {doorcard.year}
        </div>
        {doorcard.college && (
          <div>
            <span className="text-gray-600">Campus:</span>{" "}
            {COLLEGE_META[doorcard.college]?.label || doorcard.college}
          </div>
        )}
        <div>
          <span className="text-gray-600">Appointments:</span>{" "}
          {doorcard.appointments.length}
        </div>
        <div className="flex gap-2 pt-2">
          {displayStatus.status === "incomplete" ? (
            // For incomplete doorcards, only show edit action with helpful text
            <Link
              href={`/doorcard/${doorcard.id}/edit?step=1`}
              className="inline-flex items-center text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2 hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
              aria-label={`Complete setup for ${doorcard.doorcardName}`}
            >
              <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> Complete
              Setup
            </Link>
          ) : (
            // For complete doorcards, show all actions
            <>
              <Link
                href={getViewUrl()}
                className="inline-flex items-center text-xs underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded px-2 py-1 min-h-[44px] min-w-[44px] justify-center"
                target="_blank"
                aria-label={`View doorcard for ${doorcard.doorcardName}`}
              >
                <ExternalLink className="h-4 w-4 mr-1" aria-hidden="true" />{" "}
                View
              </Link>
              {displayStatus.status !== "archived" && (
                <Link
                  href={`/doorcard/${doorcard.id}/edit?step=1`}
                  className="inline-flex items-center text-xs underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded px-2 py-1 min-h-[44px] min-w-[44px] justify-center"
                  aria-label={`Edit doorcard ${doorcard.doorcardName}`}
                >
                  <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> Edit
                </Link>
              )}
              <Link
                href={`${getViewUrl()}&print=true`}
                className="inline-flex items-center text-xs underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded px-2 py-1 min-h-[44px] min-w-[44px] justify-center"
                target="_blank"
                aria-label={`Print doorcard ${doorcard.doorcardName}`}
              >
                <Printer className="h-4 w-4 mr-1" aria-hidden="true" /> Print
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Row (list variant)                                                         */
/* -------------------------------------------------------------------------- */

function DoorcardRow({
  doorcard,
  activeTerm,
}: {
  doorcard: Doorcard & { appointments: Appointment[]; user?: any };
  activeTerm?: { season: TermSeason; year: number } | null;
}) {
  const displayStatus = getDoorcardDisplayStatus(doorcard, activeTerm);

  // Determine the correct view URL based on doorcard status
  const getViewUrl = () => {
    const username = publicSlug(doorcard.user);

    // For live doorcards, link to current view
    if (displayStatus.status === "live") {
      return `/view/${username}`;
    }

    // For admin viewing non-public doorcards, use doorcard ID for reliability
    // This avoids slug mismatches and username issues
    return `/doorcard/${doorcard.id}/view?auth=true`;
  };

  // Determine badge appearance based on status
  const getBadgeProps = (status: typeof displayStatus.status) => {
    switch (status) {
      case "live":
        return {
          variant: "default" as const,
          icon: <Eye className="h-3 w-3" aria-hidden="true" />,
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "draft":
        return {
          variant: "secondary" as const,
          icon: <XCircle className="h-3 w-3" aria-hidden="true" />,
          className: "bg-gray-100 text-gray-600",
        };
      case "incomplete":
        return {
          variant: "destructive" as const,
          icon: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
          className: "bg-orange-100 text-orange-800 border-orange-200",
        };
      case "upcoming":
        return {
          variant: "outline" as const,
          icon: <Clock className="h-3 w-3" aria-hidden="true" />,
          className: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "archived":
        return {
          variant: "outline" as const,
          icon: <Archive className="h-3 w-3" aria-hidden="true" />,
          className: "bg-gray-50 text-gray-500 border-gray-200",
        };
    }
  };

  const badgeProps = getBadgeProps(displayStatus.status);

  // Campus-specific card styling for list view
  const getCampusRowStyle = (college?: College) => {
    if (!college) return "";

    switch (college) {
      case "SKYLINE":
        return "border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/20 to-transparent dark:from-blue-950/20";
      case "CSM":
        return "border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/20 to-transparent dark:from-red-950/20";
      case "CANADA":
        return "border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/20 to-transparent dark:from-green-950/20";
      default:
        return "";
    }
  };

  return (
    <Card className={getCampusRowStyle(doorcard.college)}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">
              {doorcard.doorcardName ||
                `${doorcard.name || "Faculty Member"}'s ${doorcard.term} ${
                  doorcard.year
                } Doorcard`}
            </p>
            <Badge
              variant={badgeProps.variant}
              className={`flex items-center gap-1 ${badgeProps.className} text-xs`}
              data-testid="status-badge"
              title={displayStatus.description}
            >
              {badgeProps.icon}
              {displayStatus.label}
            </Badge>
          </div>
          <p className="text-xs text-gray-600">
            {doorcard.name || "Faculty Member"} •{" "}
            {doorcard.officeNumber || "Office TBD"} • {doorcard.term}{" "}
            {doorcard.year}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {displayStatus.status === "incomplete" ? (
            // For incomplete doorcards, only show edit action with helpful text
            <Link
              href={`/doorcard/${doorcard.id}/edit?step=1`}
              className="text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2 hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 flex items-center"
              aria-label={`Complete setup for ${doorcard.doorcardName}`}
            >
              <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> Complete
              Setup
            </Link>
          ) : (
            // For complete doorcards, show all actions
            <>
              <Link
                href={getViewUrl()}
                target="_blank"
                className="underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded flex items-center px-2 py-1 min-h-[44px] min-w-[44px] justify-center"
                aria-label={`View doorcard for ${doorcard.doorcardName}`}
              >
                <ExternalLink className="h-4 w-4 mr-1" aria-hidden="true" />{" "}
                View
              </Link>
              {displayStatus.status !== "archived" && (
                <Link
                  href={`/doorcard/${doorcard.id}/edit?step=1`}
                  className="underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded flex items-center px-2 py-1 min-h-[44px] min-w-[44px] justify-center"
                  aria-label={`Edit doorcard ${doorcard.doorcardName}`}
                >
                  <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> Edit
                </Link>
              )}
              <Link
                href={`${getViewUrl()}&print=true`}
                className="underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded flex items-center px-2 py-1 min-h-[44px] min-w-[44px] justify-center"
                target="_blank"
                aria-label={`Print doorcard ${doorcard.doorcardName}`}
              >
                <Printer className="h-4 w-4 mr-1" aria-hidden="true" /> Print
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
