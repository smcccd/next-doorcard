"use client";

import Clarity from "@microsoft/clarity";

/**
 * Utility functions for Microsoft Clarity integration
 * These functions provide a clean interface to Clarity's features
 */

export const ClarityUtils = {
  /**
   * Track a custom event
   * @param eventName - Name of the event to track
   */
  trackEvent: (eventName: string) => {
    if (typeof window !== "undefined") {
      try {
        Clarity.event(eventName);
        if (process.env.NODE_ENV === "development") {
          console.log(`📊 Clarity event tracked: ${eventName}`);
        }
      } catch (error) {
        console.error("Failed to track Clarity event:", error);
      }
    }
  },

  /**
   * Set a custom tag for the session
   * @param key - Tag key
   * @param value - Tag value
   */
  setTag: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      try {
        Clarity.setTag(key, value);
        if (process.env.NODE_ENV === "development") {
          console.log(`🏷️ Clarity tag set: ${key} = ${value}`);
        }
      } catch (error) {
        console.error("Failed to set Clarity tag:", error);
      }
    }
  },

  /**
   * Identify a user, session, or page
   * @param customId - Custom identifier
   * @param sessionId - Optional session ID
   * @param pageId - Optional page ID
   * @param friendlyName - Optional friendly name
   */
  identify: (
    customId: string,
    sessionId?: string,
    pageId?: string,
    friendlyName?: string
  ) => {
    if (typeof window !== "undefined") {
      try {
        Clarity.identify(customId, sessionId, pageId, friendlyName);
        if (process.env.NODE_ENV === "development") {
          console.log(`👤 Clarity identify: ${customId}`);
        }
      } catch (error) {
        console.error("Failed to identify with Clarity:", error);
      }
    }
  },

  /**
   * Update consent status
   * @param hasConsent - Whether user has given consent
   */
  consent: (hasConsent: boolean = true) => {
    if (typeof window !== "undefined") {
      try {
        Clarity.consent(hasConsent);
        if (process.env.NODE_ENV === "development") {
          console.log(`🔒 Clarity consent: ${hasConsent}`);
        }
      } catch (error) {
        console.error("Failed to set Clarity consent:", error);
      }
    }
  },
};

export default ClarityUtils;
