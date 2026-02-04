"use client";

import { useSession } from "next-auth/react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export function ProfileBanner() {
  const { data: session, status } = useSession();
  const [isDismissed, setIsDismissed] = useState(false);

  if (status === "loading" || !session?.user || isDismissed) {
    return null;
  }

  // Check if user has a generic username as their name or no name
  const hasGenericName =
    !session.user.name ||
    session.user.name === session.user.email?.split("@")[0] ||
    session.user.name === (session.user as any).username;

  if (!hasGenericName) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Complete Your Profile
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              Add your name and optional website to personalize your doorcard
              and help students find you.
            </p>
          </div>
          <div className="mt-3">
            <Button size="sm" asChild>
              <Link href="/profile">Update Profile</Link>
            </Button>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="inline-flex rounded-md p-1.5 text-blue-500 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-blue-50"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
