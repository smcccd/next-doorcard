// Import the actual prisma module to test
import { prisma } from "@/lib/prisma";

describe("Prisma Client Configuration", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  describe("Prisma Instance", () => {
    it("should export a prisma instance", () => {
      expect(prisma).toBeDefined();
      expect(typeof prisma).toBe("object");
    });

    it("should have all required database models", () => {
      expect(prisma.user).toBeDefined();
      expect(prisma.doorcard).toBeDefined();
      expect(prisma.appointment).toBeDefined();
      expect(prisma.analytics).toBeDefined();
      expect(prisma.term).toBeDefined();
    });

    it("should have transaction support", () => {
      expect(prisma.$transaction).toBeDefined();
      expect(typeof prisma.$transaction).toBe("function");
    });

    it("should have disconnect functionality", () => {
      expect(prisma.$disconnect).toBeDefined();
      expect(typeof prisma.$disconnect).toBe("function");
    });
  });

  describe("Database Operations", () => {
    it("should support user operations", () => {
      expect(prisma.user.findUnique).toBeDefined();
      expect(prisma.user.findMany).toBeDefined();
      expect(prisma.user.create).toBeDefined();
      expect(prisma.user.update).toBeDefined();
      expect(prisma.user.delete).toBeDefined();
    });

    it("should support doorcard operations", () => {
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
      expect(prisma.term.findFirst).toBeDefined();
      expect(prisma.term.findMany).toBeDefined();
      expect(prisma.term.findUnique).toBeDefined();
      expect(prisma.term.create).toBeDefined();
      expect(prisma.term.update).toBeDefined();
      expect(prisma.term.updateMany).toBeDefined();
      expect(prisma.term.count).toBeDefined();
    });
  });
});
