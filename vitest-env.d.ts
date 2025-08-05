/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

// Extend Vitest's Assertion interface with Jest-DOM matchers
declare module "vitest" {
  interface Assertion<T = any>
    extends jest.Matchers<void, T>,
      TestingLibraryMatchers<T, void> {}
  interface AsymmetricMatchersContaining
    extends jest.Matchers<void, any>,
      TestingLibraryMatchers<any, void> {}
}

// Global types for Jest compatibility
declare global {
  // Add Jest global namespace for compatibility
  namespace jest {
    interface Matchers<R, T = {}> {
      toBe(expected: T): R;
      toBeInTheDocument(): R;
      toHaveLength(expected: number): R;
      toBeGreaterThan(expected: number): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(expected: number): R;
      toBeDefined(): R;
      toBeNull(): R;
      toBeTruthy(): R;
      toBeUndefined(): R;
      toThrow(expected?: string | RegExp | Error): R;
    }
  }
}
