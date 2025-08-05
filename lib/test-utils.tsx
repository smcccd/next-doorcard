import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

// Custom render function that includes common providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
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
      container.querySelectorAll(".professor-card")
    );
  },

  // Wait for loading states to resolve
  waitForDataToLoad: async (container: HTMLElement) => {
    // Wait for loading indicators to disappear
    const loadingIndicators = container.querySelectorAll(
      '[data-testid="loading"], [aria-label*="loading" i], .loading'
    );

    if (loadingIndicators.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  },
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
      website: "https://example.com",
    },
    appointmentCount: 3,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    ...overrides,
  }),

  appointment: (overrides = {}) => ({
    id: "appt-1",
    name: "Office Hours",
    startTime: "10:00",
    endTime: "11:00",
    dayOfWeek: "MONDAY",
    category: "OFFICE_HOURS",
    location: "Room 123",
    ...overrides,
  }),
};

// Setup user events with consistent configuration
export const setupUserEvent = () =>
  userEvent.setup({
    // Add consistent timing for all tests
    delay: null, // Disable delays in tests for speed
  });

// Vitest-specific test utilities
export const vitestHelpers = {
  // Mock Next.js router with custom state
  mockRouter: (routerState = {}) => {
    const mockPush = vi.fn();
    const mockReplace = vi.fn();
    const mockRefresh = vi.fn();

    vi.mocked(
      vi.doMock("next/navigation", () => ({
        useRouter: () => ({
          push: mockPush,
          replace: mockReplace,
          refresh: mockRefresh,
          back: vi.fn(),
          forward: vi.fn(),
          prefetch: vi.fn(),
          ...routerState,
        }),
        usePathname: () => "/",
        useSearchParams: () => new URLSearchParams(),
      }))
    );

    return { mockPush, mockReplace, mockRefresh };
  },

  // Mock NextAuth session with custom user
  mockSession: (sessionData: any = {}) => {
    const mockSession = {
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
        ...(sessionData.user || {}),
      },
      expires: "2024-12-31",
      ...sessionData,
    };

    vi.mocked(
      vi.doMock("next-auth/react", () => ({
        useSession: () => ({
          data: mockSession,
          status: "authenticated",
        }),
        signIn: vi.fn(),
        signOut: vi.fn(),
      }))
    );

    return mockSession;
  },

  // Mock Prisma with custom responses
  mockPrisma: (mockResponses = {}) => {
    const defaultMocks = {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      doorcard: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      ...mockResponses,
    };

    vi.mocked(
      vi.doMock("@/lib/prisma", () => ({
        prisma: defaultMocks,
      }))
    );

    return defaultMocks;
  },
};

// React 19 specific test helpers
export const react19Helpers = {
  // Helper for testing Server Components (mock data fetching)
  mockServerComponentData: (data: any) => {
    return Promise.resolve(data);
  },

  // Helper for testing React 19 Actions
  mockAction: (implementation?: (...args: any[]) => any) => {
    return vi.fn(implementation || (() => Promise.resolve()));
  },

  // Helper for testing optimistic updates
  mockOptimisticState: (initialState: any) => {
    let currentState = initialState;
    const updateOptimistic = vi.fn((updater) => {
      currentState =
        typeof updater === "function" ? updater(currentState) : updater;
      return currentState;
    });

    return [currentState, updateOptimistic];
  },
};

// Re-export everything from testing-library
export * from "@testing-library/react";
export { customRender as render };
