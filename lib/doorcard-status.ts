import type { Doorcard } from "@prisma/client";

type TermSeason = "SPRING" | "SUMMER" | "FALL";

interface TermPeriod {
  season: TermSeason;
  year: number;
  startMonth: number; // 1-based
  endMonth: number; // 1-based
}

/**
 * Define academic term periods
 */
const TERM_PERIODS: Record<TermSeason, { startMonth: number; endMonth: number }> = {
  SPRING: { startMonth: 1, endMonth: 5 },    // January - May
  SUMMER: { startMonth: 6, endMonth: 8 },    // June - August  
  FALL: { startMonth: 9, endMonth: 12 },     // September - December
};

/**
 * Get the current academic term based on today's date
 */
export function getCurrentAcademicTerm(): { season: TermSeason; year: number } {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-based
  const currentYear = now.getFullYear();

  if (currentMonth >= 1 && currentMonth <= 5) {
    return { season: "SPRING", year: currentYear };
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    return { season: "SUMMER", year: currentYear };
  } else {
    return { season: "FALL", year: currentYear };
  }
}

/**
 * Compare two terms to determine their temporal relationship
 * Returns: -1 (term1 < term2), 0 (equal), 1 (term1 > term2)
 */
export function compareTerms(
  term1: { season: TermSeason; year: number },
  term2: { season: TermSeason; year: number }
): number {
  if (term1.year !== term2.year) {
    return term1.year - term2.year;
  }
  
  const season1Start = TERM_PERIODS[term1.season].startMonth;
  const season2Start = TERM_PERIODS[term2.season].startMonth;
  
  return season1Start - season2Start;
}

/**
 * Determine if a term is in the past, current, or future
 */
export function getTermStatus(doorcard: Pick<Doorcard, "term" | "year">): "past" | "current" | "future" {
  const currentTerm = getCurrentAcademicTerm();
  const comparison = compareTerms(
    { season: doorcard.term as TermSeason, year: doorcard.year },
    currentTerm
  );
  
  if (comparison < 0) return "past";
  if (comparison > 0) return "future";
  return "current";
}

/**
 * Categorize doorcards by their temporal status and visibility
 */
export function categorizeDoorcards<T extends Doorcard>(doorcards: T[]) {
  const current: T[] = [];
  const archived: T[] = [];
  const upcoming: T[] = [];
  
  for (const doorcard of doorcards) {
    const termStatus = getTermStatus(doorcard);
    
    switch (termStatus) {
      case "current":
        current.push(doorcard);
        break;
      case "past":
        archived.push(doorcard);
        break;
      case "future":
        upcoming.push(doorcard);
        break;
    }
  }
  
  return { current, archived, upcoming };
}

/**
 * Check if a doorcard is complete (has necessary information)
 */
function isDoorcardComplete(doorcard: Doorcard & { appointments?: any[] }): boolean {
  // Basic info should be present
  if (!doorcard.doorcardName || !doorcard.officeNumber) {
    return false;
  }
  
  // Should have at least one appointment/time block
  if (!doorcard.appointments || doorcard.appointments.length === 0) {
    return false;
  }
  
  return true;
}

/**
 * Determine the display status for a doorcard
 * "Live" means this is the publicly visible doorcard (isActive && isPublic)
 * "Draft" means it exists but is not publicly visible
 * "Incomplete" means it's missing essential information
 * "Archived" means it's from a past term
 * "Upcoming" means it's from a future term
 */
export function getDoorcardDisplayStatus(doorcard: Doorcard & { appointments?: any[] }): {
  status: "live" | "draft" | "incomplete" | "archived" | "upcoming";
  label: string;
  description: string;
} {
  const termStatus = getTermStatus(doorcard);
  
  // Check if doorcard is complete first (applies to all terms)
  const isComplete = isDoorcardComplete(doorcard);
  
  // Past terms are always archived regardless of flags
  if (termStatus === "past") {
    return {
      status: "archived",
      label: "Archived",
      description: `From ${doorcard.term} ${doorcard.year}`,
    };
  }
  
  // If doorcard is incomplete, show that regardless of term
  if (!isComplete) {
    return {
      status: "incomplete",
      label: "Incomplete",
      description: "Missing office hours or basic information",
    };
  }
  
  // Future terms that are complete are upcoming
  if (termStatus === "future") {
    return {
      status: "upcoming", 
      label: "Upcoming",
      description: `Ready for ${doorcard.term} ${doorcard.year}`,
    };
  }
  
  // Current term: check visibility flags
  if (doorcard.isActive && doorcard.isPublic) {
    return {
      status: "live",
      label: "Live",
      description: "Publicly visible on your doorcard page",
    };
  }
  
  return {
    status: "draft",
    label: "Draft", 
    description: "Complete but not yet published",
  };
}