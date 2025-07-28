"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export default function ClarityInit() {
  useEffect(() => {
    // Only run on client side and if we have a project ID
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_CLARITY_ID) {
      try {
        // Initialize Microsoft Clarity
        Clarity.init(process.env.NEXT_PUBLIC_CLARITY_ID);

        console.log(
          "✅ Microsoft Clarity initialized successfully with ID:",
          process.env.NEXT_PUBLIC_CLARITY_ID,
        );

        // Optional: Add a custom event to verify it's working
        Clarity.event("clarity_initialized");
      } catch (error) {
        console.error("❌ Failed to initialize Microsoft Clarity:", error);
      }
    } else {
      console.warn(
        "⚠️ Microsoft Clarity not initialized - missing project ID or not in browser environment",
      );
    }
  }, []);

  // This component doesn't render anything
  return null;
}
