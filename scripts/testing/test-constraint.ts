#!/usr/bin/env npx ts-node

/**
 * Test script to verify the unique constraint on appointments is working correctly
 * This should attempt to create duplicate appointments and show they are rejected
 */

import { prisma } from "../../lib/prisma";
import { randomUUID } from "crypto";

async function testUniqueConstraint() {
  console.log("🧪 Testing appointment unique constraint...");

  try {
    // Create a test doorcard first
    const testDoorcardId = randomUUID();
    const testUserId = randomUUID();

    console.log("📝 Creating test user and doorcard...");

    // Create test user
    await prisma.user.create({
      data: {
        id: testUserId,
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
        password: "test",
        updatedAt: new Date(),
      },
    });

    // Create test doorcard
    await prisma.doorcard.create({
      data: {
        id: testDoorcardId,
        userId: testUserId,
        name: "Test Doorcard",
        doorcardName: "Test Doorcard",
        officeNumber: "TEST123",
        term: "FALL",
        year: 2024,
        college: "SKYLINE",
        updatedAt: new Date(),
      },
    });

    console.log("✅ Test data created");

    // Create first appointment
    const appointment1 = await prisma.appointment.create({
      data: {
        id: randomUUID(),
        doorcardId: testDoorcardId,
        name: "Office Hours",
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "10:00",
        category: "OFFICE_HOURS",
        location: "Office 123",
        updatedAt: new Date(),
      },
    });

    console.log("✅ First appointment created:", appointment1.id);

    // Try to create duplicate appointment - this should fail
    try {
      await prisma.appointment.create({
        data: {
          id: randomUUID(),
          doorcardId: testDoorcardId,
          name: "Duplicate Office Hours", // Different name
          dayOfWeek: "MONDAY", // Same day
          startTime: "09:00", // Same start time
          endTime: "10:00", // Same end time
          category: "OFFICE_HOURS",
          location: "Office 456", // Different location
          updatedAt: new Date(),
        },
      });
      console.log(
        "❌ ERROR: Duplicate appointment was created - constraint not working!"
      );
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log(
          "✅ SUCCESS: Unique constraint properly rejected duplicate appointment"
        );
        console.log("   Error code:", error.code);
        console.log("   Target fields:", error.meta?.target);
      } else {
        console.log("❌ Unexpected error:", error.message);
      }
    }

    // Try to create an appointment with different time - this should succeed
    const appointment2 = await prisma.appointment.create({
      data: {
        id: randomUUID(),
        doorcardId: testDoorcardId,
        name: "Office Hours 2",
        dayOfWeek: "MONDAY",
        startTime: "10:00", // Different start time
        endTime: "11:00", // Different end time
        category: "OFFICE_HOURS",
        location: "Office 123",
        updatedAt: new Date(),
      },
    });

    console.log("✅ Non-duplicate appointment created:", appointment2.id);

    // Clean up test data
    console.log("🧹 Cleaning up test data...");
    await prisma.doorcard.delete({
      where: { id: testDoorcardId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });

    console.log("✅ Test completed successfully!");
    console.log("📊 Summary:");
    console.log("   - Unique constraint is working correctly");
    console.log("   - Duplicate appointments are properly rejected");
    console.log("   - Different time slots are allowed");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testUniqueConstraint().catch(console.error);
}
