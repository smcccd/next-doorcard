import { PublicDoorcard } from "@/types/pages/public";
import { College } from "@/types/doorcard";
import { DayOfWeek } from "@prisma/client";
import { extractDepartmentFromText } from "@/lib/departments";
import { ActiveTermInfo } from "@/lib/active-term";

export interface FilterOptions {
  searchTerm: string;
  selectedCampus: College | "ALL";
  selectedDepartment: string;
  selectedDay: DayOfWeek | "ALL";
  activeLetter: string | null;
  showCurrentTermOnly: boolean;
  activeTerm: ActiveTermInfo | null;
  termLoading: boolean;
}

export function filterProfessors(
  doorcards: PublicDoorcard[],
  options: FilterOptions
): PublicDoorcard[] {
  let filtered = doorcards;

  // Filter by campus
  if (options.selectedCampus !== "ALL") {
    filtered = filtered.filter((dc) => dc.college === options.selectedCampus);
  }

  // Filter by department
  if (options.selectedDepartment !== "ALL") {
    filtered = filtered.filter((dc) => {
      const deptFromName = extractDepartmentFromText(dc.name);
      const deptFromDoorcardName = extractDepartmentFromText(dc.doorcardName);
      const deptFromUserName = extractDepartmentFromText(dc.user?.name || "");

      return (
        deptFromName === options.selectedDepartment ||
        deptFromDoorcardName === options.selectedDepartment ||
        deptFromUserName === options.selectedDepartment
      );
    });
  }

  // Filter by current term only (but only after API has loaded to avoid mismatch)
  if (
    options.showCurrentTermOnly &&
    options.activeTerm &&
    !options.termLoading
  ) {
    filtered = filtered.filter((dc) => {
      const termMatches =
        dc.term.toUpperCase() === options.activeTerm!.season.toUpperCase();
      const yearMatches =
        dc.year ===
        (typeof options.activeTerm!.year === "string"
          ? parseInt(options.activeTerm!.year)
          : options.activeTerm!.year);
      return termMatches && yearMatches;
    });
  }

  // Filter by search term
  if (options.searchTerm) {
    const term = options.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (dc) =>
        dc.name.toLowerCase().includes(term) ||
        dc.doorcardName.toLowerCase().includes(term) ||
        dc.user.name?.toLowerCase().includes(term)
    );
  }

  // Filter by letter (last name first letter)
  if (options.activeLetter) {
    filtered = filtered.filter((dc) => {
      const name = dc.name;
      const lastNameFirst = name.includes(",")
        ? name.split(",")[0].trim()
        : name.split(" ").pop() || "";
      return lastNameFirst.toUpperCase().startsWith(options.activeLetter!);
    });
  }

  // Filter by availability on specific day
  if (options.selectedDay !== "ALL") {
    filtered = filtered.filter((dc) => {
      return (
        dc.availableDays &&
        dc.availableDays.includes(options.selectedDay as DayOfWeek)
      );
    });
  }

  // Sort results
  filtered = filtered.sort((a, b) => {
    // First sort by appointment count (desc)
    if (b.appointmentCount !== a.appointmentCount) {
      return b.appointmentCount - a.appointmentCount;
    }
    // Then sort by name (asc)
    return a.name.localeCompare(b.name);
  });

  return filtered;
}

export function hasActiveFilters(
  options: Omit<FilterOptions, "activeTerm" | "termLoading">
): boolean {
  return !!(
    options.searchTerm ||
    options.selectedCampus !== "ALL" ||
    options.selectedDepartment !== "ALL" ||
    options.activeLetter ||
    options.selectedDay !== "ALL"
  );
}

export function getTopResults(
  filtered: PublicDoorcard[],
  hasFilters: boolean
): PublicDoorcard[] {
  // If no active filters applied, show top 24 results for better performance
  if (!hasFilters) {
    return filtered.slice(0, 24);
  }
  return filtered;
}
