import {
  collegeSchema,
  userRoleSchema,
  dayOfWeekSchema,
  appointmentCategorySchema,
  timeSchema,
  appointmentSchema,
  basicInfoSchema,
  doorcardSchema,
  updateDoorcardSchema,
  userSchema,
  timeBlockSchema,
  validateTimeSlot,
  validateAppointmentOverlap,
  validateTimeBlockOverlap,
} from "../doorcard";

describe("Doorcard Validation Schemas", () => {
  describe("collegeSchema", () => {
    it("accepts valid college codes", () => {
      expect(collegeSchema.parse("SKYLINE")).toBe("SKYLINE");
      expect(collegeSchema.parse("CSM")).toBe("CSM");
      expect(collegeSchema.parse("CANADA")).toBe("CANADA");
    });

    it("rejects invalid college codes", () => {
      expect(() => collegeSchema.parse("INVALID")).toThrow();
      expect(() => collegeSchema.parse("skyline")).toThrow();
      expect(() => collegeSchema.parse("")).toThrow();
      expect(() => collegeSchema.parse(null)).toThrow();
    });
  });

  describe("userRoleSchema", () => {
    it("accepts valid user roles", () => {
      expect(userRoleSchema.parse("FACULTY")).toBe("FACULTY");
      expect(userRoleSchema.parse("ADMIN")).toBe("ADMIN");
      expect(userRoleSchema.parse("STAFF")).toBe("STAFF");
    });

    it("rejects invalid user roles", () => {
      expect(() => userRoleSchema.parse("STUDENT")).toThrow();
      expect(() => userRoleSchema.parse("faculty")).toThrow();
      expect(() => userRoleSchema.parse("")).toThrow();
    });
  });

  describe("dayOfWeekSchema", () => {
    it("accepts valid days of week", () => {
      const validDays = [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ];
      validDays.forEach((day) => {
        expect(dayOfWeekSchema.parse(day)).toBe(day);
      });
    });

    it("rejects invalid days of week", () => {
      expect(() => dayOfWeekSchema.parse("FUNDAY")).toThrow();
      expect(() => dayOfWeekSchema.parse("monday")).toThrow();
      expect(() => dayOfWeekSchema.parse("MON")).toThrow();
    });
  });

  describe("appointmentCategorySchema", () => {
    it("accepts valid appointment categories", () => {
      const validCategories = [
        "OFFICE_HOURS",
        "IN_CLASS",
        "LECTURE",
        "LAB",
        "HOURS_BY_ARRANGEMENT",
        "REFERENCE",
      ];
      validCategories.forEach((category) => {
        expect(appointmentCategorySchema.parse(category)).toBe(category);
      });
    });

    it("rejects invalid appointment categories", () => {
      expect(() =>
        appointmentCategorySchema.parse("INVALID_CATEGORY")
      ).toThrow();
      expect(() => appointmentCategorySchema.parse("office_hours")).toThrow();
      expect(() => appointmentCategorySchema.parse("")).toThrow();
    });
  });

  describe("timeSchema", () => {
    it("accepts valid 24-hour time formats", () => {
      const validTimes = ["00:00", "09:30", "12:00", "23:59", "13:45"];
      validTimes.forEach((time) => {
        expect(timeSchema.parse(time)).toBe(time);
      });
    });

    it("rejects invalid time formats", () => {
      const invalidTimes = [
        "24:00", // Invalid hour
        "12:60", // Invalid minute
        "9:30", // Missing leading zero
        "12:5", // Missing leading zero in minutes
        "12:00 PM", // 12-hour format
        "noon", // Text
        "25:30", // Hour > 23
        "-1:30", // Negative hour
        "12:-5", // Negative minute
        "12", // Missing minutes
        "", // Empty string
      ];
      invalidTimes.forEach((time) => {
        expect(() => timeSchema.parse(time)).toThrow();
      });
    });
  });

  describe("appointmentSchema", () => {
    const validAppointment = {
      name: "Office Hours",
      startTime: "10:00",
      endTime: "12:00",
      dayOfWeek: "MONDAY",
      category: "OFFICE_HOURS",
      location: "Room 123",
    };

    it("accepts valid appointment data", () => {
      const result = appointmentSchema.parse(validAppointment);
      expect(result).toEqual(validAppointment);
    });

    it("accepts appointment without location", () => {
      const { location, ...appointmentWithoutLocation } = validAppointment;
      const result = appointmentSchema.parse(appointmentWithoutLocation);
      expect(result.location).toBeUndefined();
    });

    it("uses default category when not provided", () => {
      const { category, ...appointmentWithoutCategory } = validAppointment;
      const result = appointmentSchema.parse(appointmentWithoutCategory);
      expect(result.category).toBe("OFFICE_HOURS");
    });

    it("validates that end time is after start time", () => {
      const invalidAppointment = {
        ...validAppointment,
        startTime: "14:00",
        endTime: "12:00", // Before start time
      };
      expect(() => appointmentSchema.parse(invalidAppointment)).toThrow(
        "End time must be after start time"
      );
    });

    it("validates that end time is not equal to start time", () => {
      const invalidAppointment = {
        ...validAppointment,
        startTime: "12:00",
        endTime: "12:00", // Same as start time
      };
      expect(() => appointmentSchema.parse(invalidAppointment)).toThrow(
        "End time must be after start time"
      );
    });

    it("validates required fields", () => {
      expect(() =>
        appointmentSchema.parse({ ...validAppointment, name: "" })
      ).toThrow("Appointment name is required");
      expect(() =>
        appointmentSchema.parse({ ...validAppointment, startTime: "" })
      ).toThrow();
      expect(() =>
        appointmentSchema.parse({ ...validAppointment, endTime: "" })
      ).toThrow();
      expect(() =>
        appointmentSchema.parse({ ...validAppointment, dayOfWeek: "" })
      ).toThrow();
    });

    it("validates field lengths", () => {
      expect(() =>
        appointmentSchema.parse({
          ...validAppointment,
          name: "A".repeat(101),
        })
      ).toThrow();

      expect(() =>
        appointmentSchema.parse({
          ...validAppointment,
          location: "A".repeat(51),
        })
      ).toThrow();
    });
  });

  describe("basicInfoSchema", () => {
    const validBasicInfo = {
      name: "Dr. John Doe",
      doorcardName: "Fall Office Hours",
      officeNumber: "Room 123",
      term: "FALL",
      year: 2024,
      college: "SKYLINE",
    };

    it("accepts valid basic info", () => {
      const result = basicInfoSchema.parse(validBasicInfo);
      expect(result).toEqual(validBasicInfo);
    });

    it("validates required fields", () => {
      expect(() =>
        basicInfoSchema.parse({ ...validBasicInfo, name: "" })
      ).toThrow("Name is required");
      expect(() =>
        basicInfoSchema.parse({ ...validBasicInfo, doorcardName: "" })
      ).toThrow("Doorcard name is required");
      expect(() =>
        basicInfoSchema.parse({ ...validBasicInfo, officeNumber: "" })
      ).toThrow("Office number is required");
      expect(() =>
        basicInfoSchema.parse({ ...validBasicInfo, term: "" })
      ).toThrow("Invalid enum value");
      expect(() =>
        basicInfoSchema.parse({ ...validBasicInfo, year: 1999 })
      ).toThrow("Number must be greater than or equal to 2020");
    });

    it("validates field lengths", () => {
      expect(() =>
        basicInfoSchema.parse({
          ...validBasicInfo,
          name: "A".repeat(101),
        })
      ).toThrow();

      expect(() =>
        basicInfoSchema.parse({
          ...validBasicInfo,
          doorcardName: "A".repeat(101),
        })
      ).toThrow();

      expect(() =>
        basicInfoSchema.parse({
          ...validBasicInfo,
          officeNumber: "A".repeat(21),
        })
      ).toThrow();

      expect(() =>
        basicInfoSchema.parse({
          ...validBasicInfo,
          term: "A".repeat(51),
        })
      ).toThrow();
    });

    it("validates year format", () => {
      expect(() =>
        basicInfoSchema.parse({ ...validBasicInfo, year: 2019 })
      ).toThrow("Number must be greater than or equal to 2020");
      expect(() =>
        basicInfoSchema.parse({ ...validBasicInfo, year: 2031 })
      ).toThrow("Number must be less than or equal to 2030");
    });

    it("validates date range when both dates provided", () => {
      const startDate = new Date("2024-01-15");
      const endDate = new Date("2024-05-15");

      const validWithDates = {
        ...validBasicInfo,
        startDate,
        endDate,
      };

      expect(basicInfoSchema.parse(validWithDates)).toEqual(validWithDates);
    });

    it("rejects invalid date range", () => {
      const startDate = new Date("2024-05-15");
      const endDate = new Date("2024-01-15"); // Before start date

      const invalidWithDates = {
        ...validBasicInfo,
        startDate,
        endDate,
      };

      expect(() => basicInfoSchema.parse(invalidWithDates)).toThrow(
        "End date must be after start date"
      );
    });
  });

  describe("doorcardSchema", () => {
    const validDoorcard = {
      name: "Dr. Jane Smith",
      doorcardName: "Spring Schedule",
      officeNumber: "Building A, Room 205",
      term: "SPRING",
      year: 2024,
      college: "CSM",
      appointments: [
        {
          name: "Office Hours",
          startTime: "10:00",
          endTime: "12:00",
          dayOfWeek: "MONDAY",
          category: "OFFICE_HOURS",
          location: "Office",
        },
      ],
    };

    it("accepts valid doorcard data", () => {
      const result = doorcardSchema.parse(validDoorcard);
      expect(result).toEqual({
        ...validDoorcard,
        isActive: false, // New default value
        isPublic: false, // New default value
      });
    });

    it("accepts doorcard without appointments", () => {
      const { appointments, ...doorcardWithoutAppointments } = validDoorcard;
      const result = doorcardSchema.parse(doorcardWithoutAppointments);
      expect(result.appointments).toEqual([]); // Default value
    });

    it("sets default values correctly", () => {
      const result = doorcardSchema.parse(validDoorcard);
      expect(result.isActive).toBe(false); // New default: start as draft
      expect(result.isPublic).toBe(false); // New default: start as private
      expect(result.appointments).toEqual(validDoorcard.appointments);
    });

    it("validates nested appointment data", () => {
      const invalidDoorcard = {
        ...validDoorcard,
        appointments: [
          {
            name: "", // Invalid: empty name
            startTime: "10:00",
            endTime: "12:00",
            dayOfWeek: "MONDAY",
            category: "OFFICE_HOURS",
          },
        ],
      };

      expect(() => doorcardSchema.parse(invalidDoorcard)).toThrow(
        "Appointment name is required"
      );
    });
  });

  describe("updateDoorcardSchema", () => {
    it("accepts partial updates", () => {
      const partialUpdate = {
        name: "Updated Name",
        doorcardName: "Updated Doorcard",
      };

      const result = updateDoorcardSchema.parse(partialUpdate);
      expect(result).toEqual(partialUpdate);
    });

    it("accepts empty update object", () => {
      const result = updateDoorcardSchema.parse({});
      expect(result).toEqual({});
    });

    it("validates provided fields", () => {
      expect(() => updateDoorcardSchema.parse({ name: "" })).toThrow(
        "Name is required"
      );
      expect(() => updateDoorcardSchema.parse({ year: 1999 })).toThrow(
        "Number must be greater than or equal to 2020"
      );
    });

    it("accepts CUID for id field", () => {
      const updateWithId = {
        id: "clv2example123456789", // Example CUID
        name: "Updated Name",
      };

      const result = updateDoorcardSchema.parse(updateWithId);
      expect(result).toEqual(updateWithId);
    });
  });

  describe("userSchema", () => {
    it("accepts valid user data", () => {
      const validUser = {
        name: "John Doe",
        email: "john.doe@smccd.edu",
        username: "johndoe",
        role: "FACULTY",
        college: "SKYLINE",
      };

      const result = userSchema.parse(validUser);
      expect(result).toEqual(validUser);
    });

    it("uses default role when not provided", () => {
      const userWithoutRole = {
        email: "test@smccd.edu",
      };

      const result = userSchema.parse(userWithoutRole);
      expect(result.role).toBe("FACULTY");
    });

    it("validates email format", () => {
      expect(() => userSchema.parse({ email: "invalid-email" })).toThrow(
        "Invalid email address"
      );
      expect(() => userSchema.parse({ email: "test@" })).toThrow(
        "Invalid email address"
      );
      expect(() => userSchema.parse({ email: "@domain.com" })).toThrow(
        "Invalid email address"
      );
    });

    it("validates field lengths", () => {
      expect(() =>
        userSchema.parse({
          email: "test@smccd.edu",
          name: "A".repeat(101),
        })
      ).toThrow();

      expect(() =>
        userSchema.parse({
          email: "test@smccd.edu",
          username: "A".repeat(51),
        })
      ).toThrow();
    });
  });

  describe("timeBlockSchema", () => {
    const validTimeBlock = {
      id: "block-123",
      day: "MONDAY",
      startTime: "10:00",
      endTime: "12:00",
      activity: "Office Hours",
      location: "Room 123",
      category: "OFFICE_HOURS",
    };

    it("accepts valid time block data", () => {
      const result = timeBlockSchema.parse(validTimeBlock);
      expect(result).toEqual(validTimeBlock);
    });

    it("validates required fields", () => {
      expect(() =>
        timeBlockSchema.parse({ ...validTimeBlock, activity: "" })
      ).toThrow("Activity is required");
    });

    it("accepts optional fields", () => {
      const { location, category, ...requiredFields } = validTimeBlock;
      const result = timeBlockSchema.parse(requiredFields);
      expect(result.location).toBeUndefined();
      expect(result.category).toBeUndefined();
    });
  });
});

describe("Validation Helper Functions", () => {
  describe("validateTimeSlot", () => {
    it("returns true for valid time slots", () => {
      expect(validateTimeSlot("09:00", "10:00")).toBe(true);
      expect(validateTimeSlot("09:30", "10:30")).toBe(true);
      expect(validateTimeSlot("00:00", "23:59")).toBe(true);
    });

    it("returns false when end time is before start time", () => {
      expect(validateTimeSlot("10:00", "09:00")).toBe(false);
      expect(validateTimeSlot("14:30", "14:00")).toBe(false);
    });

    it("returns false when end time equals start time", () => {
      expect(validateTimeSlot("10:00", "10:00")).toBe(false);
      expect(validateTimeSlot("12:30", "12:30")).toBe(false);
    });

    it("handles edge cases", () => {
      expect(validateTimeSlot("23:59", "00:00")).toBe(false); // Crossing midnight
      expect(validateTimeSlot("09:59", "10:00")).toBe(true); // 1 minute difference
    });
  });

  describe("validateAppointmentOverlap", () => {
    const appointments = [
      { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00" },
      { dayOfWeek: "MONDAY", startTime: "11:00", endTime: "12:00" },
      { dayOfWeek: "TUESDAY", startTime: "09:00", endTime: "10:00" },
    ];

    it("returns true when no overlaps exist", () => {
      expect(validateAppointmentOverlap(appointments)).toBe(true);
    });

    it("returns false when appointments overlap", () => {
      const overlappingAppointments = [
        ...appointments,
        { dayOfWeek: "MONDAY", startTime: "09:30", endTime: "10:30" }, // Overlaps with first Monday appointment
      ];
      expect(validateAppointmentOverlap(overlappingAppointments)).toBe(false);
    });

    it("returns true for adjacent appointments", () => {
      const adjacentAppointments = [
        { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00" },
        { dayOfWeek: "MONDAY", startTime: "10:00", endTime: "11:00" }, // Adjacent, no overlap
      ];
      expect(validateAppointmentOverlap(adjacentAppointments)).toBe(true);
    });

    it("handles appointments on different days", () => {
      const differentDayAppointments = [
        { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:00" },
        { dayOfWeek: "TUESDAY", startTime: "09:00", endTime: "10:00" }, // Same time, different day
      ];
      expect(validateAppointmentOverlap(differentDayAppointments)).toBe(true);
    });

    it("returns true for empty appointments array", () => {
      expect(validateAppointmentOverlap([])).toBe(true);
    });

    it("returns true for single appointment", () => {
      expect(validateAppointmentOverlap([appointments[0]])).toBe(true);
    });
  });

  describe("validateTimeBlockOverlap", () => {
    const existingBlocks = [
      {
        id: "1",
        day: "MONDAY",
        startTime: "09:00",
        endTime: "10:00",
        activity: "Office Hours",
      },
      {
        id: "2",
        day: "MONDAY",
        startTime: "11:00",
        endTime: "12:00",
        activity: "Class",
      },
      {
        id: "3",
        day: "TUESDAY",
        startTime: "09:00",
        endTime: "10:00",
        activity: "Meeting",
      },
    ];

    it("returns null when no overlap exists", () => {
      const newBlock = { day: "MONDAY", startTime: "13:00", endTime: "14:00" };
      expect(validateTimeBlockOverlap(newBlock, existingBlocks)).toBeNull();
    });

    it("returns error message when overlap exists", () => {
      const newBlock = { day: "MONDAY", startTime: "09:30", endTime: "10:30" };
      const result = validateTimeBlockOverlap(newBlock, existingBlocks);
      expect(result).toContain(
        "Time block overlaps with existing MONDAY block"
      );
      expect(result).toContain("09:00 - 10:00");
    });

    it("returns error for invalid time slot", () => {
      const newBlock = { day: "MONDAY", startTime: "14:00", endTime: "13:00" }; // End before start
      const result = validateTimeBlockOverlap(newBlock, existingBlocks);
      expect(result).toBe("End time must be after start time");
    });

    it("ignores block being edited", () => {
      const newBlock = { day: "MONDAY", startTime: "09:00", endTime: "10:00" };
      const result = validateTimeBlockOverlap(newBlock, existingBlocks, "1"); // Editing block 1
      expect(result).toBeNull(); // Should not conflict with itself
    });

    it("handles adjacent time blocks", () => {
      const newBlock = { day: "MONDAY", startTime: "10:00", endTime: "11:00" };
      expect(validateTimeBlockOverlap(newBlock, existingBlocks)).toBeNull();
    });

    it("handles blocks on different days", () => {
      const newBlock = {
        day: "WEDNESDAY",
        startTime: "09:00",
        endTime: "10:00",
      };
      expect(validateTimeBlockOverlap(newBlock, existingBlocks)).toBeNull();
    });

    it("handles empty existing blocks", () => {
      const newBlock = { day: "MONDAY", startTime: "09:00", endTime: "10:00" };
      expect(validateTimeBlockOverlap(newBlock, [])).toBeNull();
    });

    it("detects partial overlaps", () => {
      const testCases = [
        { day: "MONDAY", startTime: "08:30", endTime: "09:30" }, // Overlaps start
        { day: "MONDAY", startTime: "09:30", endTime: "10:30" }, // Overlaps end
        { day: "MONDAY", startTime: "08:30", endTime: "10:30" }, // Encompasses existing
        { day: "MONDAY", startTime: "09:15", endTime: "09:45" }, // Within existing
      ];

      testCases.forEach((newBlock) => {
        const result = validateTimeBlockOverlap(newBlock, existingBlocks);
        expect(result).not.toBeNull();
        expect(result).toContain("Time block overlaps");
      });
    });
  });
});

describe("Edge Cases and Error Handling", () => {
  describe("Schema parsing with null/undefined values", () => {
    it("handles null values gracefully", () => {
      expect(() => collegeSchema.parse(null)).toThrow();
      expect(() => timeSchema.parse(null)).toThrow();
      expect(() => dayOfWeekSchema.parse(null)).toThrow();
    });

    it("handles undefined values gracefully", () => {
      expect(() => collegeSchema.parse(undefined)).toThrow();
      expect(() => timeSchema.parse(undefined)).toThrow();
    });
  });

  describe("Complex validation scenarios", () => {
    it("validates doorcard with many appointments", () => {
      const manyAppointments = Array(20)
        .fill(null)
        .map((_, i) => {
          const startHour = 9 + Math.floor(i / 2);
          const startMinute = (i % 2) * 30;
          const endHour = startMinute + 30 >= 60 ? startHour + 1 : startHour;
          const endMinute = (startMinute + 30) % 60;

          return {
            name: `Appointment ${i}`,
            startTime: `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`,
            endTime: `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`,
            dayOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"][
              i % 5
            ],
            category: "OFFICE_HOURS",
            location: `Location ${i}`,
          };
        });

      const largeDoorcard = {
        name: "Dr. Busy Professor",
        doorcardName: "Very Busy Schedule",
        officeNumber: "Room 999",
        term: "FALL",
        year: 2024,
        college: "SKYLINE",
        appointments: manyAppointments,
      };

      expect(() => doorcardSchema.parse(largeDoorcard)).not.toThrow();
    });

    it("validates time blocks with edge time values", () => {
      const edgeCases = [
        { startTime: "00:00", endTime: "00:01" }, // Minimum duration
        { startTime: "23:58", endTime: "23:59" }, // Late night
        { startTime: "12:00", endTime: "12:01" }, // Noon
      ];

      edgeCases.forEach(({ startTime, endTime }) => {
        const appointment = {
          name: "Edge Case Appointment",
          startTime,
          endTime,
          dayOfWeek: "MONDAY",
          category: "OFFICE_HOURS",
        };

        expect(() => appointmentSchema.parse(appointment)).not.toThrow();
      });
    });
  });

  describe("Boundary value testing", () => {
    it("tests string length boundaries", () => {
      // Exactly at limit
      expect(() =>
        doorcardSchema.parse({
          name: "A".repeat(100), // Exactly 100 characters
          doorcardName: "B".repeat(100),
          officeNumber: "C".repeat(20),
          term: "FALL", // Valid enum value
          year: 2024, // Number, not string
          college: "SKYLINE",
        })
      ).not.toThrow();

      // Over limit
      expect(() =>
        doorcardSchema.parse({
          name: "A".repeat(101), // 101 characters
          doorcardName: "Valid Name",
          officeNumber: "Valid Office",
          term: "FALL",
          year: "2024",
          college: "SKYLINE",
        })
      ).toThrow();
    });

    it("tests time validation boundaries", () => {
      // Valid boundaries
      expect(() => timeSchema.parse("00:00")).not.toThrow();
      expect(() => timeSchema.parse("23:59")).not.toThrow();

      // Invalid boundaries
      expect(() => timeSchema.parse("24:00")).toThrow();
      expect(() => timeSchema.parse("12:60")).toThrow();
    });
  });
});
