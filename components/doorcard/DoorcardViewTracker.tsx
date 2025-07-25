"use client";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

export function DoorcardViewTracker({
  doorcardId,
  slug,
  source,
  isSpecificTerm,
}: {
  doorcardId: string;
  slug: string;
  source: string;
  isSpecificTerm: boolean;
}) {
  useEffect(() => {
    analytics.trackView(doorcardId, {
      slug,
      source,
      userAgent: navigator.userAgent,
      isSpecificTerm,
    });
  }, [doorcardId, slug, source, isSpecificTerm]);

  return null;
}
