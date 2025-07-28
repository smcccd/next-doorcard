"use client";

import { useEffect } from "react";

interface AutoPrintHandlerProps {
  autoPrint: boolean;
}

export function AutoPrintHandler({ autoPrint }: AutoPrintHandlerProps) {
  useEffect(() => {
    if (autoPrint) {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return null; // This component doesn't render anything
}