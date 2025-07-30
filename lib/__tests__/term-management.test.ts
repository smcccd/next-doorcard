import { prisma } from "@/lib/prisma";
import {
  TermManager,
  TERM_SEASONS,
  generateTermName,
  getCurrentAcademicYear,
} from "../term-management";

// Use the global Prisma mock from jest.setup.js
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("TermManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTerm = {
    id: "term-123",
    name: "Fall 2024",
    year: 2024,
    season: "FALL",
    startDate: new Date("2024-08-15"),
    endDate: new Date("2024-12-15"),
    isActive: true,
    isArchived: false,
    isUpcoming: false,
    archiveDate: null,
  };

  describe("getActiveTerm", () => {
    it("should return active term with doorcards", async () => {
      const mockActiveTermWithDoorcards = {
        ...mockTerm,
        doorcards: [{ id: "doorcard-1" }, { id: "doorcard-2" }],
      };
      mockPrisma.term.findFirst.mockResolvedValueOnce(
        mockActiveTermWithDoorcards
      );

      const result = await TermManager.getActiveTerm();

      expect(result).toEqual(mockActiveTermWithDoorcards);
      expect(mockPrisma.term.findFirst).toHaveBeenCalledWith({
        where: { isActive: true },
        include: { doorcards: true },
      });
    });

    it("should return null when no active term", async () => {
      mockPrisma.term.findFirst.mockResolvedValueOnce(null);

      const result = await TermManager.getActiveTerm();

      expect(result).toBeNull();
    });
  });

  describe("getAllTerms", () => {
    it("should return all terms with doorcard counts", async () => {
      const mockTerms = [
        { ...mockTerm, _count: { doorcards: 5 } },
        { ...mockTerm, id: "term-456", _count: { doorcards: 3 } },
      ];
      mockPrisma.term.findMany.mockResolvedValueOnce(mockTerms);

      const result = await TermManager.getAllTerms();

      expect(result).toEqual(mockTerms);
      expect(mockPrisma.term.findMany).toHaveBeenCalledWith({
        orderBy: [{ year: "desc" }, { season: "asc" }],
        include: {
          _count: {
            select: { doorcards: true },
          },
        },
      });
    });
  });

  describe("createTerm", () => {
    const newTermData = {
      name: "Spring 2025",
      year: 2025,
      season: "SPRING",
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-05-15"),
      isActive: true,
    };

    it("should create new term and deactivate others when isActive is true", async () => {
      mockPrisma.term.updateMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.term.create.mockResolvedValueOnce({
        ...newTermData,
        id: "new-term-123",
      });

      const result = await TermManager.createTerm(newTermData);

      expect(mockPrisma.term.updateMany).toHaveBeenCalledWith({
        where: { isActive: true },
        data: { isActive: false },
      });
      expect(mockPrisma.term.create).toHaveBeenCalledWith({
        data: {
          name: newTermData.name,
          year: newTermData.year,
          season: newTermData.season,
          startDate: newTermData.startDate,
          endDate: newTermData.endDate,
          isActive: true,
          isArchived: false,
          isUpcoming: false,
          archiveDate: undefined,
        },
      });
      expect(result).toEqual({ ...newTermData, id: "new-term-123" });
    });

    it("should create term without deactivating others when isActive is false", async () => {
      const inactiveTermData = { ...newTermData, isActive: false };
      mockPrisma.term.create.mockResolvedValueOnce({
        ...inactiveTermData,
        id: "new-term-456",
      });

      await TermManager.createTerm(inactiveTermData);

      expect(mockPrisma.term.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.term.create).toHaveBeenCalled();
    });
  });

  describe("transitionToNewTerm", () => {
    const newTermId = "new-term-123";
    const transactionMock = jest.fn();

    beforeEach(() => {
      // Only set up default mocks, don't pre-configure findUnique
      mockPrisma.$transaction.mockImplementation((callback) =>
        callback(mockPrisma)
      );
    });

    it("should transition with default options", async () => {
      mockPrisma.term.findUnique.mockResolvedValueOnce(mockTerm);
      mockPrisma.term.updateMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.term.update.mockResolvedValueOnce(mockTerm);
      mockPrisma.doorcard.updateMany.mockResolvedValueOnce({ count: 3 });

      const result = await TermManager.transitionToNewTerm(newTermId);

      expect(mockPrisma.term.findUnique).toHaveBeenCalledWith({
        where: { id: newTermId },
      });

      expect(mockPrisma.term.updateMany).toHaveBeenCalledWith({
        where: { isActive: true },
        data: {
          isActive: false,
          isArchived: true,
          archiveDate: expect.any(Date),
        },
      });

      expect(mockPrisma.term.update).toHaveBeenCalledWith({
        where: { id: newTermId },
        data: {
          isActive: true,
          isUpcoming: false,
        },
      });

      expect(result).toEqual(mockTerm);
    });

    it("should throw error if new term not found", async () => {
      // Clear all previous mocks to start fresh
      jest.clearAllMocks();

      // Reset the transaction mock to avoid interference
      mockPrisma.$transaction.mockImplementation((callback) =>
        callback(mockPrisma)
      );

      // Mock findUnique to return null for the new term
      mockPrisma.term.findUnique.mockResolvedValueOnce(null);

      await expect(TermManager.transitionToNewTerm(newTermId)).rejects.toThrow(
        "New term not found"
      );

      // Verify that findUnique was called with the correct parameters
      expect(mockPrisma.term.findUnique).toHaveBeenCalledWith({
        where: { id: newTermId },
      });
    });

    it("should respect custom options", async () => {
      // Clear all mocks to avoid interference from previous tests
      jest.clearAllMocks();

      const options = {
        archiveOldTerm: false,
        activateNewTerm: false,
        archiveOldDoorcards: false,
      };

      // Mock findUnique to return a valid term
      mockPrisma.term.findUnique.mockResolvedValueOnce(mockTerm);

      // Mock the transaction to return the term directly
      mockPrisma.$transaction.mockImplementationOnce(async (callback) => {
        return await callback(mockPrisma);
      });

      const result = await TermManager.transitionToNewTerm(newTermId, options);

      expect(result).toEqual(mockTerm);
      expect(mockPrisma.term.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.term.update).not.toHaveBeenCalled();
      expect(mockPrisma.doorcard.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("archiveTerm", () => {
    const termId = "term-to-archive";

    beforeEach(() => {
      mockPrisma.$transaction.mockImplementation((callback) =>
        callback(mockPrisma)
      );
    });

    it("should archive term and doorcards by default", async () => {
      const archivedTerm = { ...mockTerm, isActive: false, isArchived: true };
      mockPrisma.term.update.mockResolvedValueOnce(archivedTerm);
      mockPrisma.doorcard.updateMany.mockResolvedValueOnce({ count: 5 });

      const result = await TermManager.archiveTerm(termId);

      expect(mockPrisma.term.update).toHaveBeenCalledWith({
        where: { id: termId },
        data: {
          isActive: false,
          isArchived: true,
          archiveDate: expect.any(Date),
        },
      });

      expect(mockPrisma.doorcard.updateMany).toHaveBeenCalledWith({
        where: { termId },
        data: {
          isActive: false,
          isPublic: false,
        },
      });

      expect(result).toEqual(archivedTerm);
    });

    it("should archive term without doorcards when specified", async () => {
      const archivedTerm = { ...mockTerm, isActive: false, isArchived: true };
      mockPrisma.term.update.mockResolvedValueOnce(archivedTerm);

      await TermManager.archiveTerm(termId, false);

      expect(mockPrisma.term.update).toHaveBeenCalled();
      expect(mockPrisma.doorcard.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("getDoorcardsByTermStatus", () => {
    it("should get doorcards by active status", async () => {
      const mockDoorcards = [
        { id: "doorcard-1", name: "Test Doorcard" },
        { id: "doorcard-2", name: "Another Doorcard" },
      ];
      mockPrisma.doorcard.findMany.mockResolvedValueOnce(mockDoorcards);

      const result = await TermManager.getDoorcardsByTermStatus("active");

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith({
        where: {
          termRelation: { isActive: true },
        },
        include: {
          user: {
            select: { name: true, email: true, college: true },
          },
          termRelation: true,
          _count: {
            select: { appointments: true },
          },
        },
        orderBy: [
          { termRelation: { year: "desc" } },
          { termRelation: { season: "asc" } },
          { name: "asc" },
        ],
      });

      expect(result).toEqual(mockDoorcards);
    });

    it("should get doorcards by archived status", async () => {
      await TermManager.getDoorcardsByTermStatus("archived");

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            termRelation: { isArchived: true },
          },
        })
      );
    });

    it("should get doorcards by upcoming status", async () => {
      await TermManager.getDoorcardsByTermStatus("upcoming");

      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            termRelation: { isUpcoming: true },
          },
        })
      );
    });
  });

  describe("getTermsNeedingArchive", () => {
    it("should return terms past their end date", async () => {
      const expiredTerms = [
        { ...mockTerm, endDate: new Date("2023-12-15") },
        { ...mockTerm, id: "term-456", endDate: new Date("2023-05-15") },
      ];
      mockPrisma.term.findMany.mockResolvedValueOnce(expiredTerms);

      const result = await TermManager.getTermsNeedingArchive();

      expect(mockPrisma.term.findMany).toHaveBeenCalledWith({
        where: {
          endDate: { lt: expect.any(Date) },
          isActive: true,
          isArchived: false,
        },
      });

      expect(result).toEqual(expiredTerms);
    });
  });

  describe("autoArchiveExpiredTerms", () => {
    it("should archive all expired terms", async () => {
      const expiredTerms = [
        { ...mockTerm, id: "expired-1" },
        { ...mockTerm, id: "expired-2" },
      ];

      // Mock getTermsNeedingArchive
      jest
        .spyOn(TermManager, "getTermsNeedingArchive")
        .mockResolvedValueOnce(expiredTerms);

      // Mock archiveTerm
      const archiveTermSpy = jest
        .spyOn(TermManager, "archiveTerm")
        .mockResolvedValue(mockTerm);

      const result = await TermManager.autoArchiveExpiredTerms();

      expect(archiveTermSpy).toHaveBeenCalledTimes(2);
      expect(archiveTermSpy).toHaveBeenCalledWith("expired-1", true);
      expect(archiveTermSpy).toHaveBeenCalledWith("expired-2", true);
      expect(result).toBe(2);
    });

    it("should return 0 when no expired terms", async () => {
      jest
        .spyOn(TermManager, "getTermsNeedingArchive")
        .mockResolvedValueOnce([]);

      const result = await TermManager.autoArchiveExpiredTerms();

      expect(result).toBe(0);
    });
  });

  describe("prepareUpcomingTerms", () => {
    it("should mark terms as upcoming with default days ahead", async () => {
      mockPrisma.term.updateMany.mockResolvedValueOnce({ count: 2 });

      const result = await TermManager.prepareUpcomingTerms();

      expect(mockPrisma.term.updateMany).toHaveBeenCalledWith({
        where: {
          startDate: { lte: expect.any(Date) },
          isUpcoming: false,
          isActive: false,
          isArchived: false,
        },
        data: { isUpcoming: true },
      });

      expect(result).toEqual({ count: 2 });
    });

    it("should use custom days ahead", async () => {
      await TermManager.prepareUpcomingTerms(60);

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 60);

      expect(mockPrisma.term.updateMany).toHaveBeenCalledWith({
        where: {
          startDate: { lte: expect.any(Date) },
          isUpcoming: false,
          isActive: false,
          isArchived: false,
        },
        data: { isUpcoming: true },
      });
    });
  });

  describe("getTermStatistics", () => {
    it("should return comprehensive term statistics", async () => {
      const activeTerm = { ...mockTerm };
      const archivedCount = 5;
      const upcomingCount = 2;
      const totalCount = 10;

      jest
        .spyOn(TermManager, "getActiveTerm")
        .mockResolvedValueOnce(activeTerm);
      mockPrisma.term.count
        .mockResolvedValueOnce(archivedCount)
        .mockResolvedValueOnce(upcomingCount)
        .mockResolvedValueOnce(totalCount);

      const result = await TermManager.getTermStatistics();

      expect(result).toEqual({
        activeTerm,
        archivedTermsCount: archivedCount,
        upcomingTermsCount: upcomingCount,
        totalTerms: totalCount,
      });
    });
  });
});

describe("TERM_SEASONS", () => {
  it("should have correct season constants", () => {
    expect(TERM_SEASONS.FALL).toBe("Fall");
    expect(TERM_SEASONS.SPRING).toBe("Spring");
    expect(TERM_SEASONS.SUMMER).toBe("Summer");
  });
});

describe("generateTermName", () => {
  it("should generate correct term name", () => {
    expect(generateTermName("Fall", "2024")).toBe("Fall 2024");
    expect(generateTermName("Spring", "2025")).toBe("Spring 2025");
    expect(generateTermName("Summer", "2024")).toBe("Summer 2024");
  });

  it("should handle different input formats", () => {
    expect(generateTermName("FALL", "2024")).toBe("FALL 2024");
    expect(generateTermName("spring", "25")).toBe("spring 25");
  });
});

describe("getCurrentAcademicYear", () => {
  beforeEach(() => {
    // Reset Date mock
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return current year for fall semester (August-December)", () => {
    // Set date to October 15, 2024
    jest.setSystemTime(new Date("2024-10-15"));

    const result = getCurrentAcademicYear();

    expect(result).toBe("2024");
  });

  it("should return previous year for spring semester (January-July)", () => {
    // Set date to March 15, 2024
    jest.setSystemTime(new Date("2024-03-15"));

    const result = getCurrentAcademicYear();

    expect(result).toBe("2023");
  });

  it("should handle January edge case", () => {
    jest.setSystemTime(new Date("2024-01-01"));
    expect(getCurrentAcademicYear()).toBe("2023");
  });

  it("should handle July edge case", () => {
    jest.setSystemTime(new Date("2024-07-31"));
    expect(getCurrentAcademicYear()).toBe("2023");
  });

  it("should handle August edge case", () => {
    jest.setSystemTime(new Date("2024-08-01T12:00:00Z"));
    expect(getCurrentAcademicYear()).toBe("2024");
  });

  it("should handle December edge case", () => {
    jest.setSystemTime(new Date("2024-12-31"));
    expect(getCurrentAcademicYear()).toBe("2024");
  });
});
