import { prisma } from "./prisma";
import type { TermData, TermTransitionOptions } from "@/types/terms/management";
import crypto from "crypto";

// Re-export types for backward compatibility
export type { TermData, TermTransitionOptions } from "@/types/terms/management";

export class TermManager {
  /**
   * Get the currently active term
   */
  static async getActiveTerm() {
    // First try to get from database
    const dbTerm = await prisma.term.findFirst({
      where: { isActive: true },
      include: { Doorcard: true },
    });

    if (dbTerm) {
      return dbTerm;
    }

    // Fallback to environment variables if no active term in database
    const fallbackSeason = process.env.FALLBACK_ACTIVE_TERM_SEASON;
    const fallbackYear = process.env.FALLBACK_ACTIVE_TERM_YEAR;

    if (fallbackSeason && fallbackYear) {
      // Return a mock term object that matches the expected structure
      return {
        id: "fallback-term",
        name: `${fallbackSeason.charAt(0).toUpperCase() + fallbackSeason.slice(1).toLowerCase()} ${fallbackYear}`,
        season: fallbackSeason as any,
        year: fallbackYear,
        startDate: new Date(`${fallbackYear}-01-01`),
        endDate: new Date(`${fallbackYear}-12-31`),
        isActive: true,
        isArchived: false,
        isUpcoming: false,
        archiveDate: null,
        updatedAt: new Date(),
        Doorcard: [], // Empty array since we're just using this for term matching
      };
    }

    return null;
  }

  /**
   * Get all terms with their status
   */
  static async getAllTerms() {
    return await prisma.term.findMany({
      orderBy: [{ year: "desc" }, { season: "asc" }],
      include: {
        _count: {
          select: { Doorcard: true },
        },
      },
    });
  }

  /**
   * Create a new term
   */
  static async createTerm(termData: TermData) {
    // Use transaction to ensure atomic term creation and activation
    return await prisma.$transaction(async (tx) => {
      // Ensure only one term is active at a time
      if (termData.isActive) {
        await tx.term.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      return await tx.term.create({
        data: {
          id: crypto.randomUUID(),
          name: termData.name,
          year: termData.year,
          season: termData.season,
          startDate: termData.startDate,
          endDate: termData.endDate,
          isActive: termData.isActive || false,
          isArchived: termData.isArchived || false,
          isUpcoming: termData.isUpcoming || false,
          archiveDate: termData.archiveDate,
          updatedAt: new Date(),
        },
      });
    });
  }

  /**
   * Transition to a new term (activate new, archive old)
   */
  static async transitionToNewTerm(
    newTermId: string,
    options: TermTransitionOptions = {}
  ) {
    const {
      archiveOldTerm = true,
      activateNewTerm = true,
      archiveOldDoorcards = true,
    } = options;

    // Get the new term
    const newTerm = await prisma.term.findUnique({
      where: { id: newTermId },
    });

    if (!newTerm) {
      throw new Error("New term not found");
    }

    // Start transaction
    return await prisma.$transaction(async (tx) => {
      // Deactivate current active term
      if (archiveOldTerm) {
        await tx.term.updateMany({
          where: { isActive: true },
          data: {
            isActive: false,
            isArchived: true,
            archiveDate: new Date(),
          },
        });
      }

      // Activate new term
      if (activateNewTerm) {
        await tx.term.update({
          where: { id: newTermId },
          data: {
            isActive: true,
            isUpcoming: false,
          },
        });
      }

      // Archive doorcards from old terms
      if (archiveOldDoorcards) {
        await tx.doorcard.updateMany({
          where: {
            Term: {
              isArchived: true,
            },
          },
          data: {
            isActive: false,
            isPublic: false,
          },
        });
      }

      return newTerm;
    });
  }

  /**
   * Archive a specific term and its doorcards
   */
  static async archiveTerm(termId: string, archiveDoorcards: boolean = true) {
    return await prisma.$transaction(async (tx) => {
      // Archive the term
      const archivedTerm = await tx.term.update({
        where: { id: termId },
        data: {
          isActive: false,
          isArchived: true,
          archiveDate: new Date(),
        },
      });

      // Archive associated doorcards
      if (archiveDoorcards) {
        await tx.doorcard.updateMany({
          where: { termId },
          data: {
            isActive: false,
            isPublic: false,
          },
        });
      }

      return archivedTerm;
    });
  }

  /**
   * Get doorcards by term status
   */
  static async getDoorcardsByTermStatus(
    status: "active" | "archived" | "upcoming"
  ) {
    const whereClause = {
      active: { isActive: true },
      archived: { isArchived: true },
      upcoming: { isUpcoming: true },
    };

    return await prisma.doorcard.findMany({
      where: {
        Term: whereClause[status],
      },
      include: {
        User: {
          select: { name: true, email: true, college: true },
        },
        Term: true,
        _count: {
          select: { Appointment: true },
        },
      },
      orderBy: [
        { Term: { year: "desc" } },
        { Term: { season: "asc" } },
        { name: "asc" },
      ],
    });
  }

  /**
   * Get terms that need archiving (past end date)
   */
  static async getTermsNeedingArchive() {
    return await prisma.term.findMany({
      where: {
        endDate: { lt: new Date() },
        isActive: true,
        isArchived: false,
      },
    });
  }

  /**
   * Auto-archive terms that have passed their end date
   */
  static async autoArchiveExpiredTerms() {
    const expiredTerms = await this.getTermsNeedingArchive();

    for (const term of expiredTerms) {
      await this.archiveTerm(term.id, true);
    }

    return expiredTerms.length;
  }

  /**
   * Get upcoming terms
   */
  static async getUpcomingTerms() {
    return await prisma.term.findMany({
      where: {
        isUpcoming: true,
        isArchived: false,
      },
      orderBy: [{ startDate: "asc" }],
    });
  }

  /**
   * Prepare upcoming terms (set isUpcoming = true for terms starting soon)
   */
  static async prepareUpcomingTerms(daysAhead: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await prisma.term.updateMany({
      where: {
        startDate: { lte: futureDate },
        isUpcoming: false,
        isActive: false,
        isArchived: false,
      },
      data: { isUpcoming: true },
    });
  }

  /**
   * Get term statistics
   */
  static async getTermStatistics() {
    const [activeTerm, archivedTerms, upcomingTerms] = await Promise.all([
      this.getActiveTerm(),
      prisma.term.count({ where: { isArchived: true } }),
      prisma.term.count({ where: { isUpcoming: true } }),
    ]);

    return {
      activeTerm,
      archivedTermsCount: archivedTerms,
      upcomingTermsCount: upcomingTerms,
      totalTerms: await prisma.term.count(),
    };
  }
}

// Predefined term seasons for consistency
export const TERM_SEASONS = {
  FALL: "Fall",
  SPRING: "Spring",
  SUMMER: "Summer",
} as const;

// Helper function to generate term name
export function generateTermName(season: string, year: string): string {
  return `${season} ${year}`;
}

// Helper function to get current academic year
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0-indexed

  // Academic year typically runs from Fall to Summer
  // If we're in January-July, use previous year as academic year start
  if (month >= 1 && month <= 7) {
    return (year - 1).toString();
  }

  return year.toString();
}
