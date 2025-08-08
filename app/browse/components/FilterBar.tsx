"use client";

import { College } from "@/types/doorcard";
import { DayOfWeek } from "@prisma/client";
import { ActiveTermInfo } from "@/lib/active-term";
import { DAY_OPTIONS } from "@/lib/doorcard-constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface FilterBarProps {
  selectedCampus: College | "ALL";
  onCampusChange: (campus: College | "ALL") => void;
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  departments: string[];
  selectedDay: DayOfWeek | "ALL";
  onDayChange: (day: DayOfWeek | "ALL") => void;
  activeLetter: string | null;
  onLetterChange: (letter: string | null) => void;
  showCurrentTermOnly: boolean;
  onCurrentTermChange: (show: boolean) => void;
  activeTerm: ActiveTermInfo | null;
  termLoading: boolean;
}

const CAMPUS_OPTIONS: { value: College | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Campuses" },
  { value: "CSM", label: "College of San Mateo" },
  { value: "CANADA", label: "Cañada College" },
  { value: "SKYLINE", label: "Skyline College" },
  { value: "DISTRICT_OFFICE", label: "District Office" },
];

// Day options are now imported from shared constants

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function FilterBar({
  selectedCampus,
  onCampusChange,
  selectedDepartment,
  onDepartmentChange,
  departments,
  selectedDay,
  onDayChange,
  activeLetter,
  onLetterChange,
  showCurrentTermOnly,
  onCurrentTermChange,
  activeTerm,
  termLoading,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Main Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Campus Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campus
          </label>
          <Select value={selectedCampus} onValueChange={onCampusChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAMPUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Day Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available On
          </label>
          <Select value={selectedDay} onValueChange={onDayChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Term Filter */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="current-term"
            checked={showCurrentTermOnly}
            onCheckedChange={onCurrentTermChange}
            disabled={termLoading || !activeTerm}
          />
          <label
            htmlFor="current-term"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Current term only
            {activeTerm && (
              <span className="text-gray-500 ml-1">
                ({activeTerm.season} {activeTerm.year})
              </span>
            )}
          </label>
        </div>
      </div>

      {/* Alphabet Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Last Name
        </label>
        <div className="flex flex-wrap gap-1">
          <Button
            variant={activeLetter === null ? "default" : "outline"}
            size="sm"
            onClick={() => onLetterChange(null)}
          >
            All
          </Button>
          {ALPHABET.map((letter) => (
            <Button
              key={letter}
              variant={activeLetter === letter ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onLetterChange(activeLetter === letter ? null : letter)
              }
            >
              {letter}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
