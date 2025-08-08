import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// This function is now correctly defined but not exported.
// You'll likely want to use this inside your GET handler.
const getRecentDoorcards = unstable_cache(
  async () => {
    // The try...catch block must be INSIDE the function passed to unstable_cache
    try {
      // 1. Assign the result to a variable instead of returning immediately
      const doorcards = await prisma.doorcard.findMany({
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
        orderBy: {
          updatedAt: "desc",
        },
        take: 25,
      });

      // 2. This mapping code is now reachable
      const formattedDoorcards = doorcards.map((doorcard: any) => ({
        id: doorcard.id,
        name: doorcard.name,
        doorcardName: doorcard.doorcardName,
        slug: doorcard.slug,
        college: doorcard.college,
        officeNumber: doorcard.officeNumber,
        term: doorcard.term,
        year: doorcard.year,
        createdAt: doorcard.createdAt.toISOString(),
        updatedAt: doorcard.updatedAt.toISOString(),
        user: {
          name: doorcard.User.name || "",
          username: doorcard.User.username,
          college: doorcard.college,
        },
        appointmentCount: doorcard.Appointment?.length || 0,
        availableDays: [
          ...new Set(
            doorcard.Appointment?.map((apt: any) => apt.dayOfWeek) || []
          ),
        ],
      }));

      // 3. Return the formatted data at the end of the 'try' block
      return {
        doorcards: formattedDoorcards,
        success: true,
        count: formattedDoorcards.length,
      };
    } catch (error: any) {
      console.error("Error fetching recent doorcards:", error);
      // When using unstable_cache, it's better to return an error object
      // than a NextResponse, as the cache layer expects serializable data.
      return { error: "Failed to fetch doorcards", success: false };
    }
  },
  ["recent-doorcards"], // It's best practice to provide a key for the cache
  {
    revalidate: 60, // Revalidate every 60 seconds
  }
);

// You need to export a named function for the HTTP method, like GET
export async function GET() {
  const data = await getRecentDoorcards();

  if (data.error) {
    return NextResponse.json({ error: data.error }, { status: 500 });
  }

  return NextResponse.json(data);
}
