// hooks/useActiveTerm.ts
"use client";

import { useState, useEffect } from "react";
import { TermSeason } from "@prisma/client";
import { getCurrentAcademicTerm, type ActiveTermInfo } from "@/lib/active-term";

export function useActiveTerm() {
  const [activeTerm, setActiveTerm] = useState<ActiveTermInfo>(() =>
    getCurrentAcademicTerm()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to fetch active term from API, fallback to computed term
    const fetchActiveTerm = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/terms/active");
        if (response.ok) {
          const data = await response.json();
          if (data.activeTerm) {
            // Use term from database
            setActiveTerm({
              season: data.activeTerm.season as TermSeason,
              year: data.activeTerm.year,
              displayName: data.activeTerm.name,
              isFromDatabase: true,
            });
          } else {
            // Fallback to computed term
            setActiveTerm(getCurrentAcademicTerm());
          }
        } else {
          // API failed, use computed term
          setActiveTerm(getCurrentAcademicTerm());
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
  }, []);

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
