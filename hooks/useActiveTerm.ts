// hooks/useActiveTerm.ts
"use client";

import { useState, useEffect } from "react";
import { TermSeason } from "@prisma/client";
import { getCurrentAcademicTerm, type ActiveTermInfo } from "@/lib/active-term";
import { api } from "@/lib/api-client";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function useActiveTerm() {
  const [activeTerm, setActiveTerm] = useState<ActiveTermInfo>(() =>
    getCurrentAcademicTerm()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    // Try to fetch active term from API, fallback to computed term
    const fetchActiveTerm = async () => {
      // Skip API call if offline, use computed term
      if (!isOnline) {
        setActiveTerm(getCurrentAcademicTerm());
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.terms.getActive();
        
        if (response.success && response.data && typeof response.data === 'object' && 'activeTerm' in response.data && response.data.activeTerm) {
          const activeTerm = response.data.activeTerm as any;
          // Use term from database
          setActiveTerm({
            season: activeTerm.season as TermSeason,
            year: activeTerm.year,
            displayName: activeTerm.name,
            isFromDatabase: true,
          });
        } else {
          // Fallback to computed term
          setActiveTerm(getCurrentAcademicTerm());
          if (response.error) {
            setError(response.error);
          }
        }
      } catch (err) {
        // Network error, use computed term
        setActiveTerm(getCurrentAcademicTerm());
        setError("Unable to fetch current term from server");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveTerm();
  }, [isOnline]);

  return {
    activeTerm,
    isLoading,
    error,
    // Helper methods
    isCurrentTerm: (season: TermSeason, year: number) =>
      activeTerm.season === season && activeTerm.year === year,
    formatTerm: (season: TermSeason, year: number) =>
      `${season.charAt(0).toUpperCase() + season.slice(1).toLowerCase()} ${year}`,
  };
}
