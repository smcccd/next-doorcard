import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { applyRateLimit, registrationRateLimit } from "@/lib/rate-limit";
import {
  sanitizeRegistrationData,
  isValidEmail,
  isStrongPassword,
  validateName,
} from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(req, registrationRateLimit);
  if (rateLimitResult) return rateLimitResult;

  try {
    const rawData = await req.json();

    // Validate and sanitize input data
    const { name, email, password } = sanitizeRegistrationData(rawData);

    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { message: nameValidation.message },
        { status: 400 }
      );
    }

    // Validate email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = isStrongPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { message: passwordValidation.message },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate username from name or email
    const username =
      name
        ?.toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") || email.split("@")[0];

    // Use retry loop with constraint handling to ensure username uniqueness
    const maxRetries = 5;
    let attempt = 0;
    let finalUsername = username;
    let userCreated = false;

    while (attempt < maxRetries && !userCreated) {
      try {
        await prisma.user.create({
          data: {
            id: randomUUID(),
            name,
            email,
            username: finalUsername,
            password: hashedPassword,
            updatedAt: new Date(),
          },
        });
        userCreated = true;
      } catch (error: any) {
        // Handle unique constraint violation for username
        if (
          error.code === "P2002" &&
          error.meta?.target?.includes("username")
        ) {
          attempt++;
          // Use timestamp + attempt to ensure uniqueness across concurrent requests
          finalUsername = `${username}-${Date.now()}-${attempt}`;
        } else {
          throw error; // Re-throw non-constraint errors
        }
      }
    }

    if (!userCreated) {
      throw new Error(
        "Failed to create unique username after multiple attempts"
      );
    }

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
