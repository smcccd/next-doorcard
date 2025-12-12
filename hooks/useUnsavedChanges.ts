"use client";

import { useEffect, useCallback, useRef } from "react";

interface UseUnsavedChangesOptions {
  /** Whether the form has unsaved changes */
  isDirty: boolean;
  /** Message shown in the browser's beforeunload dialog */
  message?: string;
  /** Callback when user attempts to leave with unsaved changes */
  onNavigationAttempt?: () => void;
}

/**
 * Hook to warn users about unsaved changes when navigating away.
 *
 * This handles:
 * 1. Browser refresh/close via beforeunload event
 * 2. Browser back/forward buttons via beforeunload
 *
 * Note: For in-app navigation (Next.js Link clicks), the forms should
 * show a confirmation dialog before navigation. Use the returned
 * `shouldBlockNavigation` to control this.
 *
 * @example
 * ```tsx
 * const [isDirty, setIsDirty] = useState(false);
 * const { shouldBlockNavigation, confirmNavigation, cancelNavigation } = useUnsavedChanges({
 *   isDirty,
 *   message: "You have unsaved changes. Are you sure you want to leave?"
 * });
 * ```
 */
export function useUnsavedChanges({
  isDirty,
  message = "You have unsaved changes. Are you sure you want to leave?",
  onNavigationAttempt,
}: UseUnsavedChangesOptions) {
  const isDirtyRef = useRef(isDirty);

  // Keep ref in sync with state
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Handle browser beforeunload (refresh, close tab, browser back)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;

      // Modern browsers ignore custom messages, but we set it anyway
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [message]);

  // Callback for in-app navigation checks
  const checkNavigation = useCallback((): boolean => {
    if (isDirtyRef.current) {
      onNavigationAttempt?.();
      return false; // Block navigation
    }
    return true; // Allow navigation
  }, [onNavigationAttempt]);

  return {
    /** Whether navigation should be blocked */
    shouldBlockNavigation: isDirty,
    /** Check if navigation is allowed - returns false if dirty */
    checkNavigation,
  };
}

/**
 * Tracks if form values have changed from their initial state.
 *
 * @example
 * ```tsx
 * const { isDirty, setInitialValues, trackChange } = useFormDirtyState({
 *   name: doorcard.name,
 *   office: doorcard.officeNumber
 * });
 * ```
 */
export function useFormDirtyState<T extends Record<string, unknown>>(
  initialValues: T
) {
  const initialRef = useRef<T>(initialValues);
  const currentRef = useRef<T>(initialValues);

  const setInitialValues = useCallback((values: T) => {
    initialRef.current = values;
    currentRef.current = values;
  }, []);

  const trackChange = useCallback((key: keyof T, value: unknown) => {
    currentRef.current = { ...currentRef.current, [key]: value };
  }, []);

  const checkIsDirty = useCallback((): boolean => {
    return Object.keys(initialRef.current).some(
      (key) => initialRef.current[key] !== currentRef.current[key]
    );
  }, []);

  const reset = useCallback(() => {
    currentRef.current = { ...initialRef.current };
  }, []);

  return {
    setInitialValues,
    trackChange,
    checkIsDirty,
    reset,
  };
}
