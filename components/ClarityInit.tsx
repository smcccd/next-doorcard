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

        // Add custom events for better tracking
        Clarity.event("app_initialized");

        // Add custom tags for environment and app info
        Clarity.setTag("environment", process.env.NODE_ENV || "development");
        Clarity.setTag("app_name", "Faculty Doorcard");
        Clarity.setTag("version", "1.0.0");

        // Track page load
        Clarity.event("page_loaded");

        // Optional: Track user interactions
        const trackUserInteraction = () => {
          Clarity.event("user_interaction");
        };

        // Add event listeners for key interactions
        document.addEventListener("click", trackUserInteraction);
        document.addEventListener("scroll", () => {
          Clarity.event("page_scroll");
        });

        // Cleanup event listeners
        return () => {
          document.removeEventListener("click", trackUserInteraction);
        };
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
