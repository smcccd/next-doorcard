import { PrismaClient } from "@prisma/client";
import {
  DayOfWeek,
  AppointmentCategory,
  College,
  UserRole,
  TermSeason,
} from "@prisma/client";
import { parentPort, workerData } from "worker_threads";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Types
interface UserData {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  updatedAt: Date;
}

interface DoorcardData {
  oldId: string;
  data: {
    id: string;
    name: string;
    doorcardName: string;
    officeNumber: string;
    term: TermSeason;
    year: number;
    college: College;
    slug: string;
    isActive: boolean;
    isPublic: boolean;
    userId: string;
    updatedAt: Date;
  };
}

interface AppointmentData {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
  category: AppointmentCategory;
  location: string | null;
  doorcardId: string;
  updatedAt: Date;
}

interface WorkerResult {
  success: boolean;
  created: number;
  errors: any[];
  idMappings?: Record<string, string>;
}

// Worker functions
async function processUserBatch(users: UserData[]): Promise<WorkerResult> {
  try {
    const result = await prisma.user.createMany({
      data: users,
      skipDuplicates: true,
    });

    // Get the created users to return ID mappings
    const createdUsers = await prisma.user.findMany({
      where: {
        email: { in: users.map((u) => u.email) },
      },
      select: { id: true, username: true },
    });

    const idMappings = createdUsers.reduce(
      (acc, user) => {
        if (user.username) {
          acc[user.username] = user.id;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    return {
      success: true,
      created,
      errors,
      idMappings,
    };
  } catch (error) {
    return {
      success: false,
      created: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

async function processDoorcardBatch(
  doorcards: DoorcardData[]
): Promise<WorkerResult> {
  const errors = [];
  const idMappings: Record<string, string> = {};
  let created = 0;

  for (const doorcard of doorcards) {
    try {
      const createdDoorcard = await prisma.doorcard.create({
        data: doorcard.data,
      });
      idMappings[doorcard.oldId] = createdDoorcard.id;
      created++;
    } catch (error) {
      errors.push({
        oldId: doorcard.oldId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    success: errors.length === 0,
    created,
    errors,
    idMappings,
  };
}

async function processAppointmentBatch(
  appointments: AppointmentData[]
): Promise<WorkerResult> {
  try {
    // Process appointments individually to handle constraint violations
    let created = 0;
    const errors: string[] = [];

    for (const appointmentData of appointments) {
      try {
        await prisma.appointment.create({ data: appointmentData });
        created++;
      } catch (error: any) {
        // Skip if appointment already exists or violates unique constraint
        if (error.code !== "P2002") {
          errors.push(`Failed to create appointment: ${error.message}`);
        }
      }
    }

    return {
      success: true,
      created,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      created: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

// Main worker logic
async function processWorkerTask() {
  const { taskType, data } = workerData;

  try {
    let result: WorkerResult;

    switch (taskType) {
      case "users":
        result = await processUserBatch(data);
        break;
      case "doorcards":
        result = await processDoorcardBatch(data);
        break;
      case "appointments":
        result = await processAppointmentBatch(data);
        break;
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }

    parentPort?.postMessage({
      type: "result",
      result,
    });
  } catch (error) {
    parentPort?.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    await prisma.$disconnect();
  }
}

if (parentPort) {
  processWorkerTask();
}
