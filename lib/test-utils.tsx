import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Custom render function that includes common providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  // Add any providers here (Theme, Router, etc.)
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Reusable test helpers
export const testHelpers = {
  // Find search functionality regardless of exact UI
  getSearchInput: (container: HTMLElement) => {
    return (
      container.querySelector('input[type="search"]') ||
      container.querySelector('input[placeholder*="search" i]') ||
      container.querySelector('[role="searchbox"]')
    );
  },

  // Find campus/college filter regardless of exact implementation
  getCampusFilter: (container: HTMLElement) => {
    return (
      container.querySelector('[data-testid="campus-filter"]') ||
      container.querySelector('select[name*="campus" i]') ||
      container.querySelector('[aria-label*="campus" i]')
    );
  },

  // Find professor cards regardless of exact structure
  getProfessorCards: (container: HTMLElement) => {
    return (
      container.querySelectorAll('[data-testid="professor-card"]') ||
      container.querySelectorAll('[role="article"]') ||
      container.querySelectorAll('.professor-card')
    );
  },

  // Wait for loading states to resolve
  waitForDataToLoad: async (container: HTMLElement) => {
    // Wait for loading indicators to disappear
    const loadingIndicators = container.querySelectorAll(
      '[data-testid="loading"], [aria-label*="loading" i], .loading'
    );
    
    if (loadingIndicators.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};

// Mock data generators
export const mockData = {
  doorcard: (overrides = {}) => ({
    id: "test-id",
    name: "Dr. Test Professor",
    doorcardName: "Professor Test",
    officeNumber: "123",
    term: "Fall",
    year: "2024",
    college: "SKYLINE",
    isActive: true,
    isPublic: true,
    user: {
      name: "Dr. Test Professor",
      username: "test-prof",
      title: "Dr.",
      website: "https://example.com"
    },
    appointmentCount: 3,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    ...overrides
  }),

  appointment: (overrides = {}) => ({
    id: "appt-1",
    name: "Office Hours",
    startTime: "10:00",
    endTime: "11:00",
    dayOfWeek: "MONDAY",
    category: "OFFICE_HOURS",
    location: "Room 123",
    ...overrides
  })
};

// Setup user events with consistent configuration
export const setupUserEvent = () => userEvent.setup({
  // Add consistent timing for all tests
  delay: null, // Disable delays in tests for speed
});

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };