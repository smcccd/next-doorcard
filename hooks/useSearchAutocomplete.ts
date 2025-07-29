// hooks/useSearchAutocomplete.ts
import { useState, useEffect, useMemo } from 'react';
import type { PublicDoorcard } from '@/types/pages/public';
import { DEPARTMENTS, extractDepartmentFromText } from '@/lib/departments';

export interface AutocompleteSuggestion {
  id: string;
  type: 'professor' | 'department' | 'course';
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

  // Extract unique professors, departments, and courses from doorcards
  const searchData = useMemo(() => {
    const professors = new Set<string>();
    const departments = new Set<string>();
    const courses = new Set<string>();

    doorcards.forEach(doorcard => {
      // Add professor names
      professors.add(doorcard.name.toLowerCase());
      if (doorcard.doorcardName !== doorcard.name) {
        professors.add(doorcard.doorcardName.toLowerCase());
      }
      if (doorcard.user?.name && doorcard.user.name !== doorcard.name) {
        professors.add(doorcard.user.name.toLowerCase());
      }

      // Extract departments and courses from appointments (if available)
      // Note: We don't have appointment data in the public API, but we can infer from names
      const deptCode = extractDepartmentFromText(doorcard.name);
      if (deptCode) {
        departments.add(deptCode);
      }
    });

    return {
      professors: Array.from(professors),
      departments: Array.from(departments),
      courses: Array.from(courses)
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
      .filter(name => name.includes(term))
      .slice(0, 5)
      .forEach(name => {
        newSuggestions.push({
          id: `prof-${name}`,
          type: 'professor',
          text: name.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          subtitle: 'Professor',
          value: name
        });
      });

    // Department suggestions
    DEPARTMENTS
      .filter(dept => 
        dept.name.toLowerCase().includes(term) || 
        dept.code.toLowerCase().includes(term) ||
        dept.searchTerms.some(searchTerm => searchTerm.includes(term))
      )
      .slice(0, 3)
      .forEach(dept => {
        newSuggestions.push({
          id: `dept-${dept.code}`,
          type: 'department',
          text: dept.name,
          subtitle: 'Department',
          value: dept.code
        });
      });

    // Limit total suggestions
    setSuggestions(newSuggestions.slice(0, 8));
  }, [searchTerm, searchData, isVisible]);

  return suggestions;
}