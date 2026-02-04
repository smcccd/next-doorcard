import { Mail, Phone, HelpCircle } from "lucide-react";

/**
 * IT Support Contact Component
 * Displays contact information for SMCCD IT support
 * Used on error pages to help users get assistance
 */
export function ITSupportContact() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
            Need Help?
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
            Contact SMCCD IT Support for assistance:
          </p>
          <div className="mt-3 space-y-2">
            <a
              href="mailto:itsupport@smccd.edu"
              className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>itsupport@smccd.edu</span>
            </a>
            <a
              href="tel:+16505746565"
              className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>(650) 574-6565</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
