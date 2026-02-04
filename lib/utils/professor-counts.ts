import { PublicDoorcard } from "@/types/pages/public";
import { College } from "@/types/doorcard";
import { DayOfWeek } from "@prisma/client";
import { extractDepartmentFromText } from "@/lib/departments";
import { ActiveTermInfo } from "@/lib/term/active-term";

export interface CountOptions {
  selectedCampus: College | "ALL";
  selectedDepartment: string;
  selectedDay: DayOfWeek | "ALL";
  searchTerm: string;
  showCurrentTermOnly: boolean;
  activeTerm: ActiveTermInfo | null;
  termLoading: boolean;
}

export function calculateProfessorCounts(
  doorcards: PublicDoorcard[],
  options: CountOptions
): Record<string, number> {
  const counts: Record<string, number> = {};

  // Get the base filtered doorcards (without letter filter)
  let baseFiltered = doorcards;

  if (options.selectedCampus !== "ALL") {
    baseFiltered = baseFiltered.filter(
      (dc) => dc.college === options.selectedCampus
    );
  }

  if (options.selectedDepartment !== "ALL") {
    baseFiltered = baseFiltered.filter((dc) => {
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

  if (
    options.showCurrentTermOnly &&
    options.activeTerm &&
    !options.termLoading
  ) {
    baseFiltered = baseFiltered.filter((dc) => {
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

  if (options.searchTerm) {
    const term = options.searchTerm.toLowerCase();
    baseFiltered = baseFiltered.filter(
      (dc) =>
        dc.name.toLowerCase().includes(term) ||
        dc.doorcardName.toLowerCase().includes(term) ||
        dc.user?.name?.toLowerCase().includes(term)
    );
  }

  if (options.selectedDay !== "ALL") {
    baseFiltered = baseFiltered.filter((dc) => {
      return (
        dc.availableDays &&
        dc.availableDays.includes(options.selectedDay as DayOfWeek)
      );
    });
  }

  baseFiltered.forEach((dc) => {
    const name = dc.name;
    const lastNameFirst = name.includes(",")
      ? name.split(",")[0].trim()
      : name.split(" ").pop() || "";
    const firstLetter = lastNameFirst.toUpperCase().charAt(0);
    if (firstLetter >= "A" && firstLetter <= "Z") {
      counts[firstLetter] = (counts[firstLetter] || 0) + 1;
    }
  });

  return counts;
}
