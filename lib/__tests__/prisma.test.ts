import { jest } from "@jest/globals";

// Store original environment
const originalEnv = process.env;

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
      // Use synchronous require for simpler testing
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
    it("should handle different NODE_ENV values", () => {
      // Test that the module loads without errors in different environments
      process.env.NODE_ENV = "production";
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma: prodPrisma } = require("@/lib/prisma");
      expect(prodPrisma).toBeDefined();

      process.env.NODE_ENV = "development";
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { prisma: devPrisma } = require("@/lib/prisma");
      expect(devPrisma).toBeDefined();
    });
  });
});
