// lib/active-term.ts
import { TermSeason } from "@prisma/client";

export interface ActiveTermInfo {
  season: TermSeason;
  year: number;
  displayName: string;
  isFromDatabase?: boolean;
}

export function getCurrentAcademicTerm(): ActiveTermInfo {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

  let season: TermSeason;
  let year: number;

  // Academic year logic:
  // January-May = Spring of current year
  // June-August = Summer of current year  
  // September-December = Fall of current year
  if (currentMonth >= 1 && currentMonth <= 5) {
    season = TermSeason.SPRING;
    year = currentYear;
  } else if (currentMonth >= 6 && currentMonth <= 8) {
    season = TermSeason.SUMMER;
    year = currentYear;
  } else {
    season = TermSeason.FALL;
    year = currentYear;
  }

  const displayName = `${season.charAt(0).toUpperCase() + season.slice(1).toLowerCase()} ${year}`;

  return {
    season,
    year,
    displayName,
    isFromDatabase: false
  };
}

export function formatTermDisplay(season: TermSeason, year: number): string {
  return `${season.charAt(0).toUpperCase() + season.slice(1).toLowerCase()} ${year}`;
}

export function isCurrentTerm(season: TermSeason, year: number): boolean {
  const current = getCurrentAcademicTerm();
  return current.season === season && current.year === year;
}

export function isUpcomingTerm(season: TermSeason, year: number): boolean {
  const current = getCurrentAcademicTerm();
  
  if (year > current.year) return true;
  if (year < current.year) return false;
  
  // Same year, check season order
  const seasonOrder = { SPRING: 1, SUMMER: 2, FALL: 3 };
  const currentOrder = seasonOrder[current.season];
  const termOrder = seasonOrder[season];
  
  return termOrder > currentOrder;
}

export function isPastTerm(season: TermSeason, year: number): boolean {
  return !isCurrentTerm(season, year) && !isUpcomingTerm(season, year);
}