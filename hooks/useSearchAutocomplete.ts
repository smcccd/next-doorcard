// hooks/useSearchAutocomplete.ts
import { useState, useEffect, useMemo } from "react";
import type { PublicDoorcard } from "@/types/pages/public";

export interface AutocompleteSuggestion {
  id: string;
  type: "professor";
  text: string;
  subtitle?: string;
  value: string;
}

export function useSearchAutocomplete(
  doorcards: PublicDoorcard[],
  searchTerm: string,
  isVisible: boolean = false
) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);

  // Extract unique professors from doorcards
  const searchData = useMemo(() => {
    const professors = new Set<string>();

    doorcards.forEach((doorcard) => {
      // Add professor names
      professors.add(doorcard.name.toLowerCase());
      if (doorcard.doorcardName !== doorcard.name) {
        professors.add(doorcard.doorcardName.toLowerCase());
      }
      if (doorcard.user?.name && doorcard.user.name !== doorcard.name) {
        professors.add(doorcard.user.name.toLowerCase());
      }
    });

    return {
      professors: Array.from(professors),
    };
  }, [doorcards]);

  useEffect(() => {
    if (!isVisible || !searchTerm.trim() || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const newSuggestions: AutocompleteSuggestion[] = [];

    // Professor name suggestions
    searchData.professors
      .filter((name) => name.includes(term))
      .slice(0, 8)
      .forEach((name) => {
        newSuggestions.push({
          id: `prof-${name}`,
          type: "professor",
          text: name
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          subtitle: "Professor",
          value: name,
        });
      });

    setSuggestions(newSuggestions);
  }, [searchTerm, searchData, isVisible]);

  return suggestions;
}
