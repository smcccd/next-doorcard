"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { toastHelpers } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Banner component that shows network status to users
 */
export function NetworkStatusBanner() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    // Show toast when going offline
    if (!isOnline && !wasOfflineRef.current) {
      toastHelpers.critical({
        title: "You're offline",
        description: "Some features may not work until you reconnect.",
      });
      wasOfflineRef.current = true;
    }

    // Show toast when coming back online
    if (isOnline && wasOfflineRef.current) {
      toastHelpers.success({
        title: "You're back online",
        description: "All features are now available.",
      });
      wasOfflineRef.current = false;
    }
  }, [isOnline]);

  // Show persistent banner when offline
  if (!isOnline) {
    return (
      <div className="bg-red-600 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>You're currently offline. Some features may not work.</span>
      </div>
    );
  }

  // Show warning for slow connections
  if (isSlowConnection) {
    return (
      <div className="bg-yellow-600 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
        <Wifi className="h-4 w-4" />
        <span>Slow connection detected. Pages may load slower than usual.</span>
      </div>
    );
  }

  return null;
}