"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Edit,
  ExternalLink,
  XCircle,
  Eye,
  Clock,
  Archive,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { deleteDoorcard } from "@/app/dashboard/server-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type College, COLLEGE_META } from "@/types/doorcard";
import { getDoorcardDisplayStatus } from "@/lib/doorcard-status";
import { generateDoorcardTitle } from "@/lib/doorcard-title-generator";
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

// Helper function to generate doorcard title info
function getDoorcardTitleInfo(doorcard: Doorcard) {
  const doorcardTitle = generateDoorcardTitle({
    facultyName: doorcard.name || "Faculty Member",
    term: doorcard.term,
    year: doorcard.year,
  });
  
  const subtitle = doorcard.doorcardName || "";
  
  const displayName = subtitle 
    ? `${doorcardTitle} - ${subtitle}`
    : doorcardTitle;
    
  return { doorcardTitle, subtitle, displayName };
}

export default function DoorcardGrid({
  doorcards,
  title,
  emptyMessage,
  variant = "grid",
  activeTerm,
}: Props) {
  const headingId = `doorcard-grid-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section className="space-y-4" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-lg font-semibold">
        {title}
      </h2>
      {doorcards.length === 0 ? (
        <p
          className="text-sm text-gray-600 dark:text-gray-400"
          role="status"
          aria-live="polite"
        >
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

function DeleteButton({
  doorcard,
  displayStatus,
}: {
  doorcard: Doorcard;
  displayStatus: {
    status: "live" | "draft" | "incomplete" | "archived" | "upcoming";
    label: string;
    description: string;
  };
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteDoorcard(doorcard.id);
      if (!result.success) {
        alert(result.message || "Failed to delete doorcard");
      } else {
        setDialogOpen(false);
      }
    } catch (error) {
      alert("Failed to delete doorcard");
    }
    setIsDeleting(false);
  };

  const isLive = displayStatus.status === "live";
  const { doorcardTitle, subtitle, displayName } = getDoorcardTitleInfo(doorcard);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center text-xs text-red-600 hover:text-red-800 underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 rounded px-2 py-1 min-h-[44px] min-w-[44px] justify-center"
          aria-label={`Delete doorcard ${displayName}`}
        >
          <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" /> Delete
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Doorcard
          </DialogTitle>
          <DialogDescription className="text-left">
            {isLive ? (
              <>
                <strong className="text-red-600">Warning:</strong> This doorcard
                is currently <strong>live and public</strong>. Deleting it will
                immediately remove it from public view and break any existing
                links.
                <br />
                <br />
                Are you sure you want to permanently delete{" "}
                <strong>"{displayName}"</strong>?
              </>
            ) : (
              <>
                Are you sure you want to permanently delete{" "}
                <strong>"{displayName}"</strong>?
                <br />
                <br />
                This action cannot be undone.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setDialogOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete Doorcard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  const { doorcardTitle, subtitle, displayName } = getDoorcardTitleInfo(doorcard);

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

  // Campus-specific card styling (removed gradients)
  const getCampusCardStyle = (college?: College) => {
    if (!college) return "hover:shadow-sm";

    switch (college) {
      case "SKYLINE":
        return "hover:shadow-sm border-l-4 border-l-campus-skyline";
      case "CSM":
        return "hover:shadow-sm border-l-4 border-l-campus-csm";
      case "CANADA":
        return "hover:shadow-sm border-l-4 border-l-campus-canada";
      default:
        return "hover:shadow-sm";
    }
  };

  return (
    <Card className={getCampusCardStyle(doorcard.college)}>
      <CardHeader className="pb-2 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <CardTitle as="h3" className="text-base">
            <div>
              {doorcardTitle}
              {subtitle && (
                <div className="text-sm font-normal text-gray-600 mt-1">
                  {subtitle}
                </div>
              )}
            </div>
          </CardTitle>
          <Badge
            variant={badgeProps.variant}
            className={`flex items-center gap-1 ${badgeProps.className} text-xs w-fit`}
            data-testid="status-badge"
            title={displayStatus.description}
            aria-label={`Status: ${displayStatus.label}. ${displayStatus.description}`}
          >
            {badgeProps.icon}
            {displayStatus.label}
          </Badge>
        </div>
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
            <>
              <Link
                href={`/doorcard/${doorcard.id}/edit?step=1`}
                className="inline-flex items-center text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2 hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                aria-label={`Complete setup for ${displayName}`}
              >
                <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> Complete
                Setup
              </Link>
              <DeleteButton doorcard={doorcard} displayStatus={displayStatus} />
            </>
          ) : (
            // For complete doorcards, show all actions
            <>
              <Link
                href={getViewUrl()}
                className="inline-flex items-center text-xs underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded px-2 py-1 min-h-[44px] min-w-[44px] justify-center"
                target="_blank"
                aria-label={`View doorcard for ${displayName}`}
              >
                <ExternalLink className="h-4 w-4 mr-1" aria-hidden="true" />{" "}
                View
              </Link>
              {displayStatus.status !== "archived" && (
                <Link
                  href={`/doorcard/${doorcard.id}/edit?step=1`}
                  className="inline-flex items-center text-xs underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded px-2 py-1 min-h-[44px] min-w-[44px] justify-center"
                  aria-label={`Edit doorcard ${displayName}`}
                >
                  <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> Edit
                </Link>
              )}
              <DeleteButton doorcard={doorcard} displayStatus={displayStatus} />
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
  const { doorcardTitle, subtitle, displayName } = getDoorcardTitleInfo(doorcard);

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

  // Campus-specific card styling for list view (removed gradients)
  const getCampusRowStyle = (college?: College) => {
    if (!college) return "";

    switch (college) {
      case "SKYLINE":
        return "border-l-4 border-l-campus-skyline";
      case "CSM":
        return "border-l-4 border-l-campus-csm";
      case "CANADA":
        return "border-l-4 border-l-campus-canada";
      default:
        return "";
    }
  };

  return (
    <Card className={getCampusRowStyle(doorcard.college)}>
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <p className="font-medium">
              {doorcardTitle}
              {subtitle && (
                <span className="block text-sm font-normal text-gray-600 mt-1">
                  {subtitle}
                </span>
              )}
            </p>
            <Badge
              variant={badgeProps.variant}
              className={`flex items-center gap-1 ${badgeProps.className} text-xs w-fit`}
              data-testid="status-badge"
              title={displayStatus.description}
              aria-label={`Status: ${displayStatus.label}. ${displayStatus.description}`}
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
        <div className="flex flex-wrap gap-2 text-xs">
          {displayStatus.status === "incomplete" ? (
            // For incomplete doorcards, only show edit action with helpful text
            <>
              <Link
                href={`/doorcard/${doorcard.id}/edit?step=1`}
                className="text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2 hover:bg-orange-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 flex items-center"
                aria-label={`Complete setup for ${displayName}`}
              >
                <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> Complete
                Setup
              </Link>
              <DeleteButton doorcard={doorcard} displayStatus={displayStatus} />
            </>
          ) : (
            // For complete doorcards, show all actions
            <>
              <Link
                href={getViewUrl()}
                target="_blank"
                className="underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded flex items-center px-2 py-1 min-h-[44px] min-w-[44px] justify-center"
                aria-label={`View doorcard for ${displayName}`}
              >
                <ExternalLink className="h-4 w-4 mr-1" aria-hidden="true" />{" "}
                View
              </Link>
              {displayStatus.status !== "archived" && (
                <Link
                  href={`/doorcard/${doorcard.id}/edit?step=1`}
                  className="underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded flex items-center px-2 py-1 min-h-[44px] min-w-[44px] justify-center"
                  aria-label={`Edit doorcard ${displayName}`}
                >
                  <Edit className="h-4 w-4 mr-1" aria-hidden="true" /> Edit
                </Link>
              )}
              <DeleteButton doorcard={doorcard} displayStatus={displayStatus} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
