import { jest } from "@jest/globals";

// Mock PrismaClient before importing
const mockPrismaClient = {
  $disconnect: jest.fn(),
  user: {},
  doorcard: {},
  appointment: {},
  analytics: {},
  term: {},
  $transaction: jest.fn(),
};

// Store original environment
const originalEnv = process.env;
const originalNodeEnv = process.env.NODE_ENV;

describe("Prisma Client Configuration", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Clear any global prisma instances
    delete (globalThis as any).prisma;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Prisma Instance", () => {
    it("should export a prisma instance", async () => {
      const { prisma } = await import("@/lib/prisma");
      expect(prisma).toBeDefined();
      expect(typeof prisma).toBe("object");
    });

    it("should have all required database models", async () => {
      const { prisma } = await import("@/lib/prisma");
      expect(prisma.user).toBeDefined();
      expect(prisma.doorcard).toBeDefined();
      expect(prisma.appointment).toBeDefined();
      expect(prisma.analytics).toBeDefined();
      expect(prisma.term).toBeDefined();
    });

    it("should have transaction support", async () => {
      const { prisma } = await import("@/lib/prisma");
      expect(prisma.$transaction).toBeDefined();
      expect(typeof prisma.$transaction).toBe("function");
    });

    it("should have disconnect functionality", async () => {
      const { prisma } = await import("@/lib/prisma");
      expect(prisma.$disconnect).toBeDefined();
      expect(typeof prisma.$disconnect).toBe("function");
    });

    it("should reuse existing global prisma in non-production", async () => {
      process.env.NODE_ENV = "development";
      const mockExistingPrisma = { existing: true };
      (globalThis as any).prisma = mockExistingPrisma;

      const { prisma } = await import("@/lib/prisma");
      expect(prisma).toBe(mockExistingPrisma);
    });

    it("should create new prisma client when no global exists", async () => {
      process.env.NODE_ENV = "development";
      delete (globalThis as any).prisma;

      const { prisma } = await import("@/lib/prisma");
      expect(prisma).toBeDefined();
      // Should set global in non-production
      expect((globalThis as any).prisma).toBe(prisma);
    });

    it("should not set global prisma in production", async () => {
      process.env.NODE_ENV = "production";
      delete (globalThis as any).prisma;

      const { prisma } = await import("@/lib/prisma");
      expect(prisma).toBeDefined();
      // Should not set global in production
      expect((globalThis as any).prisma).toBeUndefined();
    });
  });

  describe("Database Operations", () => {
    it("should support user operations", async () => {
      const { prisma } = await import("@/lib/prisma");
      expect(prisma.user.findUnique).toBeDefined();
      expect(prisma.user.findMany).toBeDefined();
      expect(prisma.user.create).toBeDefined();
      expect(prisma.user.update).toBeDefined();
      expect(prisma.user.delete).toBeDefined();
    });

    it("should support doorcard operations", async () => {
      const { prisma } = await import("@/lib/prisma");
      expect(prisma.doorcard.findUnique).toBeDefined();
      expect(prisma.doorcard.findFirst).toBeDefined();
      expect(prisma.doorcard.findMany).toBeDefined();
      expect(prisma.doorcard.create).toBeDefined();
      expect(prisma.doorcard.update).toBeDefined();
      expect(prisma.doorcard.updateMany).toBeDefined();
      expect(prisma.doorcard.delete).toBeDefined();
      expect(prisma.doorcard.deleteMany).toBeDefined();
    });

    it("should support term operations", async () => {
      const { prisma } = await import("@/lib/prisma");
      expect(prisma.term.findFirst).toBeDefined();
      expect(prisma.term.findMany).toBeDefined();
      expect(prisma.term.findUnique).toBeDefined();
      expect(prisma.term.create).toBeDefined();
      expect(prisma.term.update).toBeDefined();
      expect(prisma.term.updateMany).toBeDefined();
      expect(prisma.term.count).toBeDefined();
    });
  });

  describe("Environment Configuration", () => {
    it("should handle production environment gracefully", async () => {
      process.env.NODE_ENV = "production";
      delete (globalThis as any).prisma;

      // Mock process.on to capture beforeExit handler
      const originalOn = process.on;
      const mockOn = jest.fn();
      process.on = mockOn;

      try {
        const { prisma } = await import("@/lib/prisma");
        expect(prisma).toBeDefined();

        // Should set up beforeExit handler in production
        expect(mockOn).toHaveBeenCalledWith("beforeExit", expect.any(Function));
      } finally {
        process.on = originalOn;
      }
    });

    it("should not set up beforeExit handler in development", async () => {
      process.env.NODE_ENV = "development";
      delete (globalThis as any).prisma;

      // Mock process.on to capture beforeExit handler
      const originalOn = process.on;
      const mockOn = jest.fn();
      process.on = mockOn;

      try {
        const { prisma } = await import("@/lib/prisma");
        expect(prisma).toBeDefined();

        // Should not set up beforeExit handler in development
        expect(mockOn).not.toHaveBeenCalledWith(
          "beforeExit",
          expect.any(Function)
        );
      } finally {
        process.on = originalOn;
      }
    });
  });
});
