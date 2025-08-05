/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

// Global types for Jest compatibility
declare global {
  type MockedFunction<T extends (...args: any[]) => any> =
    import("vitest").MockedFunction<T>;
  type MockedObject<T> = import("vitest").MockedObject<T>;
}
