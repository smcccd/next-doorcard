"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Archive,
  CheckCircle,
  Plus,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Term {
  id: string;
  name: string;
  year: string;
  season: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isArchived: boolean;
  isUpcoming: boolean;
  archiveDate?: string;
  _count: {
    doorcards: number;
  };
}

interface TermManagementProps {
  terms: Term[];
  onCreateTerm: () => void;
  onArchiveTerm: (termId: string, termName: string) => void;
  onTransitionTerm: (termId: string, termName: string) => void;
  archiving: string | null;
}

export default function TermManagement({
  terms,
  onCreateTerm,
  onArchiveTerm,
  onTransitionTerm,
  archiving,
}: TermManagementProps) {
  const activeTerms = terms.filter((t) => t.isActive);
  const upcomingTerms = terms.filter((t) => t.isUpcoming);
  const archivedTerms = terms.filter((t) => t.isArchived);
  const otherTerms = terms.filter(
    (t) => !t.isActive && !t.isUpcoming && !t.isArchived
  );

  const getTermStatusBadge = (term: Term) => {
    if (term.isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (term.isUpcoming) {
      return (
        <Badge variant="outline" className="border-blue-200 text-blue-700">
          <Clock className="h-3 w-3 mr-1" />
          Upcoming
        </Badge>
      );
    }
    if (term.isArchived) {
      return (
        <Badge variant="secondary">
          <Archive className="h-3 w-3 mr-1" />
          Archived
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <AlertCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const TermCard = ({ term }: { term: Term }) => (
    <Card key={term.id} className="relative">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{term.name}</h3>
            <p className="text-sm text-gray-600">
              {new Date(term.startDate).toLocaleDateString()} -{" "}
              {new Date(term.endDate).toLocaleDateString()}
            </p>
          </div>
          {getTermStatusBadge(term)}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Doorcards</span>
            <span className="font-medium">{term._count.doorcards}</span>
          </div>
          {term.archiveDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Archived</span>
              <span className="text-xs text-gray-500">
                {new Date(term.archiveDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!term.isActive && !term.isArchived && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTransitionTerm(term.id, term.name)}
              className="flex-1"
            >
              Activate
            </Button>
          )}
          {!term.isArchived && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onArchiveTerm(term.id, term.name)}
              disabled={archiving === term.id}
              className="flex-1"
            >
              {archiving === term.id ? "Archiving..." : "Archive"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div>
            <h2 className="text-lg font-semibold">Term Management</h2>
            <p className="text-sm text-gray-600">
              Manage academic terms and their lifecycle
            </p>
          </div>
        </div>
        <Button onClick={onCreateTerm} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Term
        </Button>
      </div>

      {/* Active Terms */}
      {activeTerms.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Active Terms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTerms.map((term) => (
              <TermCard key={term.id} term={term} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Terms */}
      {upcomingTerms.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            Upcoming Terms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTerms.map((term) => (
              <TermCard key={term.id} term={term} />
            ))}
          </div>
        </div>
      )}

      {/* Other Terms */}
      {otherTerms.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-gray-600" />
            Inactive Terms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherTerms.map((term) => (
              <TermCard key={term.id} term={term} />
            ))}
          </div>
        </div>
      )}

      {/* Archived Terms */}
      {archivedTerms.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <Archive className="h-4 w-4 text-gray-600" />
            Archived Terms ({archivedTerms.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedTerms.slice(0, 6).map((term) => (
              <TermCard key={term.id} term={term} />
            ))}
          </div>
          {archivedTerms.length > 6 && (
            <div className="text-center">
              <Button variant="outline" size="sm">
                Show {archivedTerms.length - 6} more archived terms
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {terms.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No terms found
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first academic term to get started
            </p>
            <Button onClick={onCreateTerm}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Term
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
