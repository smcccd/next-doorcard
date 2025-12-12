"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Globe, Loader2 } from "lucide-react";

interface PublishSectionProps {
  doorcardId: string;
  publishDisabled: boolean;
  publishAction: () => Promise<void>;
}

/**
 * Publish section with confirmation dialog for the doorcard edit page.
 */
export function PublishSection({
  doorcardId,
  publishDisabled,
  publishAction,
}: PublishSectionProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handlePublish = () => {
    startTransition(async () => {
      await publishAction();
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-6">
      <h3 className="text-lg font-semibold text-green-800">Ready to Publish</h3>
      {publishDisabled ? (
        <p className="text-sm text-green-700">
          Complete all previous steps before publishing.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-green-700">
            Publishing will make your doorcard visible to students and staff.
          </p>
          <ul className="text-sm text-green-600 list-disc list-inside space-y-1">
            <li>Your schedule will be publicly accessible</li>
            <li>Students can find your office hours</li>
            <li>You can unpublish at any time from the dashboard</li>
          </ul>
        </div>
      )}
      <div className="flex gap-4 pt-2">
        <Button variant="outline" asChild>
          <Link href={`/doorcard/${doorcardId}/edit?step=2`}>
            Back to Schedule
          </Link>
        </Button>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={publishDisabled || isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            "Publish Doorcard"
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              <DialogTitle>Publish Your Doorcard?</DialogTitle>
            </div>
            <DialogDescription className="pt-3 text-left">
              This will make your doorcard publicly visible. Students and staff
              will be able to view your office hours and schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-2">
              After publishing, you can:
            </p>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Edit your schedule at any time
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Share your doorcard link
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Unpublish from the dashboard
              </li>
            </ul>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirmDialog(false);
                handlePublish();
              }}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Yes, Publish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
