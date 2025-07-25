import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Printer, Edit, ExternalLink } from "lucide-react";
import { COLLEGE_META, type College } from "@/types/doorcard";
import type { Doorcard, Appointment, User } from "@prisma/client";

interface Props {
  doorcards: (Doorcard & {
    appointments: Appointment[];
    user?: Pick<User, "username" | "name">;
  })[];
  title: string;
  emptyMessage: string;
  variant?: "grid" | "list";
}

export default function DoorcardGrid({
  doorcards,
  title,
  emptyMessage,
  variant = "grid",
}: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {doorcards.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : variant === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2">
          {doorcards.map((dc) => (
            <DoorcardCard key={dc.id} doorcard={dc} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {doorcards.map((dc) => (
            <DoorcardRow key={dc.id} doorcard={dc} />
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

function campusLabel(college?: string | null) {
  if (!college) return null;
  return COLLEGE_META[college as College]?.label || college;
}

/* -------------------------------------------------------------------------- */
/* Card (grid variant)                                                        */
/* -------------------------------------------------------------------------- */

function DoorcardCard({
  doorcard,
}: {
  doorcard: Doorcard & { appointments: Appointment[]; user?: any };
}) {
  return (
    <Card className="hover:shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <Badge variant={doorcard.isActive ? "default" : "secondary"}>
            {doorcard.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <CardTitle className="text-base">{doorcard.doorcardName}</CardTitle>
        <p className="text-xs text-gray-500">
          {doorcard.name} • {doorcard.officeNumber}
        </p>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        {doorcard.college && (
          <div>
            <span className="text-gray-500">Campus:</span>{" "}
            {campusLabel(doorcard.college)}
          </div>
        )}
        <div>
          <span className="text-gray-500">Term:</span> {doorcard.term}{" "}
          {doorcard.year}
        </div>
        <div>
          <span className="text-gray-500">Appointments:</span>{" "}
          {doorcard.appointments.length}
        </div>
        <div className="flex gap-2 pt-2">
          <Link
            href={`/view/${publicSlug(doorcard.user)}`}
            className="inline-flex items-center text-xs underline"
            target="_blank"
          >
            <ExternalLink className="h-3 w-3 mr-1" /> View
          </Link>
          <Link
            href={`/doorcard/${doorcard.id}/edit?step=1`}
            className="inline-flex items-center text-xs underline"
          >
            <Edit className="h-3 w-3 mr-1" /> Edit
          </Link>
          <Link
            href={`/doorcard/${doorcard.id}/edit?step=3`}
            className="inline-flex items-center text-xs underline"
          >
            <Printer className="h-3 w-3 mr-1" /> Print
          </Link>
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
}: {
  doorcard: Doorcard & { appointments: Appointment[]; user?: any };
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{doorcard.doorcardName}</p>
            <Badge variant={doorcard.isActive ? "default" : "secondary"}>
              {doorcard.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            {doorcard.name} • {doorcard.officeNumber} • {doorcard.term}{" "}
            {doorcard.year}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link
            href={`/view/${publicSlug(doorcard.user)}`}
            target="_blank"
            className="underline flex items-center"
          >
            <ExternalLink className="h-3 w-3 mr-1" /> View
          </Link>
          <Link
            href={`/doorcard/${doorcard.id}/edit?step=1`}
            className="underline flex items-center"
          >
            <Edit className="h-3 w-3 mr-1" /> Edit
          </Link>
          <Link
            href={`/doorcard/${doorcard.id}/edit?step=3`}
            className="underline flex items-center"
          >
            <Printer className="h-3 w-3 mr-1" /> Print
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
