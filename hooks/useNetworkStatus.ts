"use client";

import { useState, useEffect } from "react";

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType?: string;
}

/**
 * Hook to monitor network connectivity status
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true); // Start optimistically as online
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [connectionType, setConnectionType] = useState<string>();

  useEffect(() => {
    // Initial connectivity check
    const checkConnectivity = async () => {
      try {
        // Try to fetch a small resource to verify actual connectivity
        const response = await fetch("/favicon.ico", {
          method: "HEAD",
          cache: "no-cache",
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        setIsOnline(response.ok);
      } catch {
        // If fetch fails, fall back to navigator.onLine
        setIsOnline(
          typeof navigator !== "undefined" ? navigator.onLine : false
        );
      }
    };

    checkConnectivity();

    // Update online status
    const handleOnline = () => {
      setIsOnline(true);
      // Double-check connectivity when coming online
      checkConnectivity();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Detect slow connection if Network Information API is available
    const updateConnectionInfo = () => {
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          setConnectionType(connection.effectiveType);
          // Consider 2G and slow-2g as slow connections
          setIsSlowConnection(
            connection.effectiveType === "2g" ||
              connection.effectiveType === "slow-2g"
          );
        }
      }
    };

    updateConnectionInfo();

    // Listen for connection changes
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener("change", updateConnectionInfo);

        return () => {
          window.removeEventListener("online", handleOnline);
          window.removeEventListener("offline", handleOffline);
          connection.removeEventListener("change", updateConnectionInfo);
        };
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    isSlowConnection,
    connectionType,
  };
}

/**
 * Hook to get adaptive fetch options based on network conditions
 */
export function useAdaptiveFetch() {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  const getAdaptiveOptions = (baseOptions: RequestInit = {}) => {
    if (!isOnline) {
      // Return cached response or throw offline error
      return {
        ...baseOptions,
        cache: "force-cache" as RequestCache,
      };
    }

    if (isSlowConnection) {
      // Use more aggressive caching and longer timeouts for slow connections
      return {
        ...baseOptions,
        cache: "force-cache" as RequestCache,
        // Note: timeout would be handled by our fetchWithTimeout wrapper
      };
    }

    return baseOptions;
  };

  return {
    isOnline,
    isSlowConnection,
    getAdaptiveOptions,
  };
}
