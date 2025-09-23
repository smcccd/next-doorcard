"use client";

import { useCallback } from "react";

type AnnouncementLevel = "polite" | "assertive";

/**
 * Hook for making screen reader announcements
 * Uses the ARIA live region that's already in the layout
 */
export function useAnnouncer() {
  const announce = useCallback(
    (message: string, level: AnnouncementLevel = "polite") => {
      // Find the live region in the layout
      const liveRegion = document.getElementById("aria-live-region");

      if (!liveRegion) {
        console.warn(
          "ARIA live region not found. Message not announced:",
          message
        );
        return;
      }

      // Set the appropriate level
      liveRegion.setAttribute("aria-live", level);

      // Clear and then set the message to trigger announcement
      liveRegion.textContent = "";

      // Use timeout to ensure the clear happens first
      setTimeout(() => {
        liveRegion.textContent = message;

        // Clear the message after announcement
        setTimeout(() => {
          liveRegion.textContent = "";
        }, 1000);
      }, 100);
    },
    []
  );

  return { announce };
}
