"use client";

// Legacy LazyDoorcardPDF component - now uses BulletproofPDFDownload for reliability
// This component maintains backward compatibility while providing bulletproof PDF downloads

import { BulletproofPDFDownload } from "./BulletproofPDFDownload";
import { DoorcardLite } from "../UnifiedDoorcard";

interface LazyDoorcardPDFProps {
  doorcard: DoorcardLite;
  doorcardId?: string;
  className?: string;
}

export function LazyDoorcardPDF({
  doorcard,
  doorcardId,
  className,
}: LazyDoorcardPDFProps) {
  // Simply use the bulletproof implementation - no lazy loading needed anymore
  // This provides immediate feedback and better reliability
  // Analytics tracking is handled internally by the BulletproofPDFDownload component
  return (
    <BulletproofPDFDownload
      doorcard={doorcard}
      doorcardId={doorcardId}
      className={className}
    />
  );
}
