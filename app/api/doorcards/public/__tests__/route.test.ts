import { GET } from "../route";
import { prisma } from "@/lib/prisma";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    doorcard: {
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as MockedObject<typeof prisma>;

describe("Public Doorcards API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Suppress console.error in tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/doorcards/public", () => {
    const mockDoorcards = [
      {
        id: "doorcard-1",
        name: "Dr. John Smith",
        doorcardName: "Fall Office Hours",
        officeNumber: "Room 101",
        term: "FALL",
        year: 2024,
        college: "SKYLINE",
        slug: "dr-john-smith-fall",
        createdAt: new Date("2024-09-01T10:00:00Z"),
        updatedAt: new Date("2024-09-15T12:00:00Z"),
        User: {
          id: "user-1",
          name: "Dr. John Smith",
          username: "jsmith",
        },
        Appointment: [
          {
            id: "appt-1",
            dayOfWeek: "MONDAY",
            category: "OFFICE_HOURS",
          },
          {
            id: "appt-2",
            dayOfWeek: "WEDNESDAY",
            category: "OFFICE_HOURS",
          },
          {
            id: "appt-3",
            dayOfWeek: "MONDAY",
            category: "LECTURE",
          },
        ],
      },
      {
        id: "doorcard-2",
        name: "Prof. Jane Doe",
        doorcardName: "Spring Classes",
        officeNumber: "Room 205",
        term: "SPRING",
        year: 2024,
        college: "CSM",
        slug: "prof-jane-doe-spring",
        createdAt: new Date("2024-01-15T14:30:00Z"),
        updatedAt: new Date("2024-02-01T16:45:00Z"),
        User: {
          id: "user-2",
          name: null, // Test null name handling
          username: "jdoe",
        },
        Appointment: [], // No appointments
      },
      {
        id: "doorcard-3",
        name: "Dr. Alice Johnson",
        doorcardName: "Lab Sessions",
        officeNumber: "Lab 301",
        term: "FALL",
        year: 2024,
        college: "CANADA",
        slug: "dr-alice-johnson-lab",
        createdAt: new Date("2024-08-20T09:15:00Z"),
        updatedAt: new Date("2024-08-25T10:30:00Z"),
        User: {
          id: "user-3",
          name: "Dr. Alice Johnson",
          username: "ajohnson",
        },
        Appointment: [
          {
            id: "appt-4",
            dayOfWeek: "TUESDAY",
            category: "LAB",
          },
          {
            id: "appt-5",
            dayOfWeek: "THURSDAY",
            category: "LAB",
          },
        ],
      },
    ];

    it("should return all public active doorcards", async () => {
      mockPrisma.doorcard.findMany.mockResolvedValue(mockDoorcards);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(3);
      expect(data.doorcards).toHaveLength(3);

      // Verify database query
      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          isPublic: true,
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          Appointment: {
            select: {
              id: true,
              dayOfWeek: true,
              category: true,
            },
          },
        },
        orderBy: [{ college: "asc" }, { User: { name: "asc" } }],
      });
    });

    it("should transform doorcard data correctly", async () => {
      mockPrisma.doorcard.findMany.mockResolvedValue([mockDoorcards[0]]);

      const response = await GET();
      const data = await response.json();

      expect(data.doorcards[0]).toEqual({
        id: "doorcard-1",
        name: "Dr. John Smith",
        doorcardName: "Fall Office Hours",
        officeNumber: "Room 101",
        term: "FALL",
        year: 2024,
        college: "SKYLINE",
        slug: "dr-john-smith-fall",
        user: {
          name: "Dr. John Smith",
          username: "jsmith",
          college: "SKYLINE",
        },
        appointmentCount: 3,
        availableDays: ["MONDAY", "WEDNESDAY"], // Unique days
        createdAt: "2024-09-01T10:00:00.000Z",
        updatedAt: "2024-09-15T12:00:00.000Z",
      });
    });

    it("should handle null user name gracefully", async () => {
      mockPrisma.doorcard.findMany.mockResolvedValue([mockDoorcards[1]]);

      const response = await GET();
      const data = await response.json();

      expect(data.doorcards[0].user.name).toBe("");
      expect(data.doorcards[0].user.username).toBe("jdoe");
    });

    it("should handle doorcards with no appointments", async () => {
      mockPrisma.doorcard.findMany.mockResolvedValue([mockDoorcards[1]]);

      const response = await GET();
      const data = await response.json();

      expect(data.doorcards[0].appointmentCount).toBe(0);
      expect(data.doorcards[0].availableDays).toEqual([]);
    });

    it("should calculate unique available days correctly", async () => {
      // Create a doorcard with duplicate days
      const doorcardWithDuplicateDays = {
        ...mockDoorcards[0],
        Appointment: [
          { id: "1", dayOfWeek: "MONDAY", category: "OFFICE_HOURS" },
          { id: "2", dayOfWeek: "MONDAY", category: "LECTURE" },
          { id: "3", dayOfWeek: "TUESDAY", category: "LAB" },
          { id: "4", dayOfWeek: "MONDAY", category: "MEETING" },
          { id: "5", dayOfWeek: "FRIDAY", category: "OFFICE_HOURS" },
        ],
      };

      mockPrisma.doorcard.findMany.mockResolvedValue([
        doorcardWithDuplicateDays,
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.doorcards[0].appointmentCount).toBe(5);
      expect(data.doorcards[0].availableDays).toEqual([
        "MONDAY",
        "TUESDAY",
        "FRIDAY",
      ]);
    });

    it("should handle empty result set", async () => {
      mockPrisma.doorcard.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(0);
      expect(data.doorcards).toEqual([]);
    });

    it("should maintain college ordering", async () => {
      // Test ordering by college (asc) then by user name (asc)
      const orderedDoorcards = [
        { ...mockDoorcards[2], college: "CANADA" }, // CANADA first
        { ...mockDoorcards[1], college: "CSM" }, // CSM second
        { ...mockDoorcards[0], college: "SKYLINE" }, // SKYLINE third
      ];

      mockPrisma.doorcard.findMany.mockResolvedValue(orderedDoorcards);

      const response = await GET();
      const data = await response.json();

      expect(data.doorcards[0].college).toBe("CANADA");
      expect(data.doorcards[1].college).toBe("CSM");
      expect(data.doorcards[2].college).toBe("SKYLINE");

      // Verify the ordering was requested correctly
      expect(mockPrisma.doorcard.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ college: "asc" }, { User: { name: "asc" } }],
        })
      );
    });

    it("should include all required fields in response", async () => {
      mockPrisma.doorcard.findMany.mockResolvedValue([mockDoorcards[0]]);

      const response = await GET();
      const data = await response.json();

      const doorcard = data.doorcards[0];

      // Test all transformed fields are present
      expect(doorcard).toHaveProperty("id");
      expect(doorcard).toHaveProperty("name");
      expect(doorcard).toHaveProperty("doorcardName");
      expect(doorcard).toHaveProperty("officeNumber");
      expect(doorcard).toHaveProperty("term");
      expect(doorcard).toHaveProperty("year");
      expect(doorcard).toHaveProperty("college");
      expect(doorcard).toHaveProperty("slug");
      expect(doorcard).toHaveProperty("user");
      expect(doorcard).toHaveProperty("appointmentCount");
      expect(doorcard).toHaveProperty("availableDays");
      expect(doorcard).toHaveProperty("createdAt");
      expect(doorcard).toHaveProperty("updatedAt");

      // Test user object structure
      expect(doorcard.user).toHaveProperty("name");
      expect(doorcard.user).toHaveProperty("username");
      expect(doorcard.user).toHaveProperty("college");
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.doorcard.findMany.mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.doorcards).toEqual([]);
      expect(data.error).toBe("Failed to fetch doorcards");
    });

    it("should handle different appointment categories", async () => {
      const doorcardWithVariousCategories = {
        ...mockDoorcards[0],
        Appointment: [
          { id: "1", dayOfWeek: "MONDAY", category: "OFFICE_HOURS" },
          { id: "2", dayOfWeek: "TUESDAY", category: "LECTURE" },
          { id: "3", dayOfWeek: "WEDNESDAY", category: "LAB" },
          { id: "4", dayOfWeek: "THURSDAY", category: "MEETING" },
          { id: "5", dayOfWeek: "FRIDAY", category: "SEMINAR" },
        ],
      };

      mockPrisma.doorcard.findMany.mockResolvedValue([
        doorcardWithVariousCategories,
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.doorcards[0].appointmentCount).toBe(5);
      expect(data.doorcards[0].availableDays).toEqual([
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
      ]);
    });

    it("should handle mixed data scenarios", async () => {
      const mixedDoorcards = [
        {
          ...mockDoorcards[0],
          User: { id: "1", name: "Dr. Alpha", username: "alpha" },
        },
        {
          ...mockDoorcards[1],
          User: { id: "2", name: null, username: "beta" },
          Appointment: undefined, // Test undefined appointments
        },
        {
          ...mockDoorcards[2],
          User: { id: "3", name: "Prof. Gamma", username: "gamma" },
          Appointment: null, // Test null appointments
        },
      ];

      mockPrisma.doorcard.findMany.mockResolvedValue(mixedDoorcards);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.doorcards).toHaveLength(3);

      // Check null/undefined appointment handling
      expect(data.doorcards[1].appointmentCount).toBe(0);
      expect(data.doorcards[1].availableDays).toEqual([]);
      expect(data.doorcards[2].appointmentCount).toBe(0);
      expect(data.doorcards[2].availableDays).toEqual([]);

      // Check null name handling
      expect(data.doorcards[1].user.name).toBe("");
    });

    it("should preserve college in user object", async () => {
      const testDoorcards = [
        { ...mockDoorcards[0], college: "SKYLINE" },
        { ...mockDoorcards[1], college: "CSM" },
        { ...mockDoorcards[2], college: "CANADA" },
      ];

      mockPrisma.doorcard.findMany.mockResolvedValue(testDoorcards);

      const response = await GET();
      const data = await response.json();

      expect(data.doorcards[0].user.college).toBe("SKYLINE");
      expect(data.doorcards[1].user.college).toBe("CSM");
      expect(data.doorcards[2].user.college).toBe("CANADA");
    });

    it("should format dates as ISO strings", async () => {
      mockPrisma.doorcard.findMany.mockResolvedValue([mockDoorcards[0]]);

      const response = await GET();
      const data = await response.json();

      const doorcard = data.doorcards[0];

      expect(doorcard.createdAt).toBe("2024-09-01T10:00:00.000Z");
      expect(doorcard.updatedAt).toBe("2024-09-15T12:00:00.000Z");

      // Verify they are valid ISO date strings
      expect(new Date(doorcard.createdAt).toISOString()).toBe(
        doorcard.createdAt
      );
      expect(new Date(doorcard.updatedAt).toISOString()).toBe(
        doorcard.updatedAt
      );
    });

    it("should handle multiple doorcards with proper transformation", async () => {
      mockPrisma.doorcard.findMany.mockResolvedValue(mockDoorcards);

      const response = await GET();
      const data = await response.json();

      expect(data.doorcards).toHaveLength(3);
      expect(data.count).toBe(3);

      // Verify each doorcard is transformed correctly
      data.doorcards.forEach((doorcard: any) => {
        expect(doorcard).toHaveProperty("id");
        expect(doorcard).toHaveProperty("user");
        expect(doorcard).toHaveProperty("appointmentCount");
        expect(doorcard).toHaveProperty("availableDays");
        expect(Array.isArray(doorcard.availableDays)).toBe(true);
        expect(typeof doorcard.appointmentCount).toBe("number");
      });
    });

    describe("Edge cases", () => {
      it("should handle extremely large appointment arrays", async () => {
        const doorcardWithManyAppointments = {
          ...mockDoorcards[0],
          Appointment: Array.from({ length: 100 }, (_, i) => ({
            id: `appt-${i}`,
            dayOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"][
              i % 5
            ],
            category: "OFFICE_HOURS",
          })),
        };

        mockPrisma.doorcard.findMany.mockResolvedValue([
          doorcardWithManyAppointments,
        ]);

        const response = await GET();
        const data = await response.json();

        expect(data.doorcards[0].appointmentCount).toBe(100);
        expect(data.doorcards[0].availableDays).toEqual([
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
        ]);
      });

      it("should handle special characters in names and usernames", async () => {
        const specialCharDoorcard = {
          ...mockDoorcards[0],
          name: "Dr. José María García-López",
          User: {
            id: "user-special",
            name: "Dr. José María García-López",
            username: "jgarcia_lopez.123",
          },
        };

        mockPrisma.doorcard.findMany.mockResolvedValue([specialCharDoorcard]);

        const response = await GET();
        const data = await response.json();

        expect(data.doorcards[0].name).toBe("Dr. José María García-López");
        expect(data.doorcards[0].user.name).toBe("Dr. José María García-López");
        expect(data.doorcards[0].user.username).toBe("jgarcia_lopez.123");
      });
    });
  });
});
