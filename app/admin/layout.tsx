import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Check if user has admin role
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, name: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">A</span>
              </div>
              <div>
                <h2 className="font-semibold">Admin Panel</h2>
                <p className="text-sm text-gray-600">
                  Welcome, {user?.name || session.user.name}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-500">Role: ADMIN</div>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-6 py-4">{children}</main>
    </div>
  );
}
