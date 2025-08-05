import { withAuth } from "../api-utils";
import { getServerSession } from "next-auth/next";
import { prisma } from "../prisma";

import type { Session } from "next-auth";

// Mock dependencies
jest.mock("next-auth/next");
jest.mock("../prisma", () => ({
  prisma: {
    doorcardDraft: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as MockedFunction<
  typeof getServerSession
>;
const mockPrisma = prisma as MockedObject<typeof prisma>;

describe("API Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("withAuth", () => {
    it("should execute handler with valid session", async () => {
      const mockSession: Session = {
        user: { id: "user-123", email: "test@example.com" },
        expires: "2025-01-01",
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockHandler = jest.fn().mockResolvedValue({ success: true });
      const result = await withAuth(mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(mockSession);
      expect(result).toBeDefined();
    });

    it("should return 401 for missing session", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const mockHandler = jest.fn();
      const result = await withAuth(mockHandler);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(401);
    });

    it("should return 401 for session without user ID", async () => {
      const invalidSession = {
        user: { email: "test@example.com" }, // missing id
        expires: "2025-01-01",
      } as Session;

      mockGetServerSession.mockResolvedValue(invalidSession);

      const mockHandler = jest.fn();
      const result = await withAuth(mockHandler);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result.status).toBe(401);
    });

    it("should handle handler errors", async () => {
      const mockSession: Session = {
        user: { id: "user-123", email: "test@example.com" },
        expires: "2025-01-01",
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const error = new Error("Handler failed");
      const mockHandler = jest.fn().mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await withAuth(mockHandler);

      expect(consoleErrorSpy).toHaveBeenCalledWith("API Error:", error);
      expect(result.status).toBe(500);

      consoleErrorSpy.mockRestore();
    });

    it("should handle non-Error exceptions", async () => {
      const mockSession: Session = {
        user: { id: "user-123", email: "test@example.com" },
        expires: "2025-01-01",
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const mockHandler = jest.fn().mockRejectedValue("String error");

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await withAuth(mockHandler);

      expect(result.status).toBe(500);

      consoleErrorSpy.mockRestore();
    });
  });

  // TODO: Implement draftService when DoorcardDraft table is added to schema
  describe.skip("draftService", () => {
    const userId = "user-123";
    const draftId = "draft-456";

    describe("getAll", () => {
      it("should retrieve all drafts for a user", async () => {
        const mockDrafts = [
          { id: "draft-1", userId, data: {} },
          { id: "draft-2", userId, data: {} },
        ];

        mockPrisma.doorcardDraft.findMany.mockResolvedValue(mockDrafts as any);

        const result = await draftService.getAll(userId);

        expect(mockPrisma.doorcardDraft.findMany).toHaveBeenCalledWith({
          where: { userId },
          orderBy: { lastUpdated: "desc" },
        });
        expect(result).toEqual(mockDrafts);
      });
    });

    describe("getOne", () => {
      it("should retrieve a specific draft", async () => {
        const mockDraft = { id: draftId, userId, data: {} };

        mockPrisma.doorcardDraft.findUnique.mockResolvedValue(mockDraft as any);

        const result = await draftService.getOne(userId, draftId);

        expect(mockPrisma.doorcardDraft.findUnique).toHaveBeenCalledWith({
          where: {
            userId_id: { userId, id: draftId },
          },
        });
        expect(result).toEqual(mockDraft);
      });

      it("should throw error if draft not found", async () => {
        mockPrisma.doorcardDraft.findUnique.mockResolvedValue(null);

        await expect(draftService.getOne(userId, draftId)).rejects.toThrow(
          "Draft not found"
        );
      });
    });

    describe("upsert", () => {
      it("should create new draft", async () => {
        const draftData = {
          name: "Test Professor",
          doorcardName: "Test Doorcard",
          currentStep: 1,
        };

        const mockDraft = { id: "new-draft", userId, data: draftData };
        mockPrisma.doorcardDraft.upsert.mockResolvedValue(mockDraft as any);

        const result = await draftService.upsert(userId, draftData);

        expect(mockPrisma.doorcardDraft.upsert).toHaveBeenCalledWith({
          where: {
            userId_id: { userId, id: "new-draft" },
          },
          update: {
            data: JSON.parse(JSON.stringify(draftData)),
            originalDoorcardId: undefined,
          },
          create: {
            userId,
            data: JSON.parse(JSON.stringify(draftData)),
            originalDoorcardId: undefined,
          },
        });
        expect(result).toEqual(mockDraft);
      });

      it("should update existing draft", async () => {
        const draftData = {
          name: "Updated Professor",
          doorcardName: "Updated Doorcard",
          currentStep: 2,
          originalDoorcardId: "original-123",
        };

        const mockDraft = { id: draftId, userId, data: draftData };
        mockPrisma.doorcardDraft.upsert.mockResolvedValue(mockDraft as any);

        const result = await draftService.upsert(userId, draftData, draftId);

        expect(mockPrisma.doorcardDraft.upsert).toHaveBeenCalledWith({
          where: {
            userId_id: { userId, id: draftId },
          },
          update: {
            data: expect.objectContaining({
              name: "Updated Professor",
              doorcardName: "Updated Doorcard",
              currentStep: 2,
            }),
            originalDoorcardId: "original-123",
          },
          create: {
            userId,
            data: expect.objectContaining({
              name: "Updated Professor",
              doorcardName: "Updated Doorcard",
              currentStep: 2,
            }),
            originalDoorcardId: "original-123",
          },
        });
        expect(result).toEqual(mockDraft);
      });
    });

    describe("delete", () => {
      it("should delete a specific draft", async () => {
        const mockDraft = { id: draftId, userId, data: {} };
        mockPrisma.doorcardDraft.delete.mockResolvedValue(mockDraft as any);

        const result = await draftService.delete(userId, draftId);

        expect(mockPrisma.doorcardDraft.delete).toHaveBeenCalledWith({
          where: {
            userId_id: { userId, id: draftId },
          },
        });
        expect(result).toEqual(mockDraft);
      });
    });

    describe("deleteAll", () => {
      it("should delete all drafts for a user", async () => {
        const mockResult = { count: 3 };
        mockPrisma.doorcardDraft.deleteMany.mockResolvedValue(mockResult);

        const result = await draftService.deleteAll(userId);

        expect(mockPrisma.doorcardDraft.deleteMany).toHaveBeenCalledWith({
          where: { userId },
        });
        expect(result).toEqual(mockResult);
      });
    });

    describe("getByOriginalDoorcard", () => {
      it("should retrieve drafts for a specific original doorcard", async () => {
        const originalDoorcardId = "original-123";
        const mockDrafts = [
          { id: "draft-1", userId, originalDoorcardId, data: {} },
          { id: "draft-2", userId, originalDoorcardId, data: {} },
        ];

        mockPrisma.doorcardDraft.findMany.mockResolvedValue(mockDrafts as any);

        const result = await draftService.getByOriginalDoorcard(
          userId,
          originalDoorcardId
        );

        expect(mockPrisma.doorcardDraft.findMany).toHaveBeenCalledWith({
          where: { userId, originalDoorcardId },
          orderBy: { lastUpdated: "desc" },
        });
        expect(result).toEqual(mockDrafts);
      });
    });

    describe("deleteByOriginalDoorcard", () => {
      it("should delete drafts for a specific original doorcard", async () => {
        const originalDoorcardId = "original-123";
        const mockResult = { count: 2 };

        mockPrisma.doorcardDraft.deleteMany.mockResolvedValue(mockResult);

        const result = await draftService.deleteByOriginalDoorcard(
          userId,
          originalDoorcardId
        );

        expect(mockPrisma.doorcardDraft.deleteMany).toHaveBeenCalledWith({
          where: { userId, originalDoorcardId },
        });
        expect(result).toEqual(mockResult);
      });
    });
  });
});
