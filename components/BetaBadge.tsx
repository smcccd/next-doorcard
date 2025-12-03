import { Info } from "lucide-react";

/**
 * Beta Banner Component - Indicates pre-production beta status
 * Displayed as a full-width banner below the navbar to communicate UAT testing phase
 * Controlled by NEXT_PUBLIC_SHOW_BETA_BANNER environment variable
 */
export function BetaBadge() {
  // Check if beta banner should be shown (controlled by env var)
  const showBanner = process.env.NEXT_PUBLIC_SHOW_BETA_BANNER === "true";

  if (!showBanner) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-100 via-orange-50 to-orange-100 dark:from-orange-950 dark:via-orange-900 dark:to-orange-950 border-b border-orange-200 dark:border-orange-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-center gap-2 text-orange-800 dark:text-orange-200">
          <Info className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm sm:text-base font-semibold">
            <span className="hidden sm:inline">
              Pre-Production Beta Testing Environment
            </span>
            <span className="sm:hidden">PRE-PROD BETA</span>
            <span className="ml-2 font-normal text-xs sm:text-sm opacity-90">
              Your feedback helps us improve before launch!
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
