import { jest } from "@jest/globals";

// Store original environment
const originalEnv = process.env;

// Mock PrismaClient before importing
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    doorcard: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    analytics: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    term: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

describe("Prisma Client Configuration", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Clear any global prisma instances
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).prisma;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Prisma Instance", () => {
    it("should export a prisma instance", () => {
      // Use dynamic import to actually exercise the module
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require("@/lib/prisma");
      expect(prisma).toBeDefined();
      expect(typeof prisma).toBe("object");
    });

    it("should have all required database models", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require("@/lib/prisma");
      expect(prisma.user).toBeDefined();
      expect(prisma.doorcard).toBeDefined();
      expect(prisma.appointment).toBeDefined();
      expect(prisma.analytics).toBeDefined();
      expect(prisma.term).toBeDefined();
    });

    it("should have transaction support", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require("@/lib/prisma");
      expect(prisma.$transaction).toBeDefined();
      expect(typeof prisma.$transaction).toBe("function");
    });

    it("should have disconnect functionality", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require("@/lib/prisma");
      expect(prisma.$disconnect).toBeDefined();
      expect(typeof prisma.$disconnect).toBe("function");
    });

    it("should handle global prisma instance reuse", () => {
      // Test the basic functionality without complex mocking
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require("@/lib/prisma");
      expect(prisma).toBeDefined();

      // Import again and verify it's consistent
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma: prisma2 } = require("@/lib/prisma");
      expect(prisma2).toBeDefined();
    });
  });

  describe("Database Operations", () => {
    it("should support user operations", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require("@/lib/prisma");
      expect(prisma.user.findUnique).toBeDefined();
      expect(prisma.user.findMany).toBeDefined();
      expect(prisma.user.create).toBeDefined();
      expect(prisma.user.update).toBeDefined();
      expect(prisma.user.delete).toBeDefined();
    });

    it("should support doorcard operations", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require("@/lib/prisma");
      expect(prisma.doorcard.findUnique).toBeDefined();
      expect(prisma.doorcard.findFirst).toBeDefined();
      expect(prisma.doorcard.findMany).toBeDefined();
      expect(prisma.doorcard.create).toBeDefined();
      expect(prisma.doorcard.update).toBeDefined();
      expect(prisma.doorcard.updateMany).toBeDefined();
      expect(prisma.doorcard.delete).toBeDefined();
      expect(prisma.doorcard.deleteMany).toBeDefined();
    });

    it("should support term operations", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require("@/lib/prisma");
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
    it("should configure logging based on NODE_ENV", () => {
      const { PrismaClient } = require("@prisma/client");

      // Test development environment
      process.env.NODE_ENV = "development";
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/lib/prisma");

      expect(PrismaClient).toHaveBeenCalledWith({
        log: ["query", "error", "warn"],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
    });

    it("should configure minimal logging for production", () => {
      const { PrismaClient } = require("@prisma/client");

      // Test production environment
      process.env.NODE_ENV = "production";
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/lib/prisma");

      expect(PrismaClient).toHaveBeenCalledWith({
        log: ["error"],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });
    });

    it("should set global prisma in non-production environments", () => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require("@/lib/prisma");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((globalThis as any).prisma).toBe(prisma);
    });

    it("should reuse global prisma instance when available", () => {
      const mockPrisma = { mock: "prisma instance" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).prisma = mockPrisma;

      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma } = require("@/lib/prisma");

      expect(prisma).toBe(mockPrisma);
    });
  });
});
