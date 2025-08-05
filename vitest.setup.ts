import "@testing-library/jest-dom/vitest";
import { vi, beforeEach, afterEach, type MockedFunction } from "vitest";
import { cleanup } from "@testing-library/react";

// Enhanced Jest compatibility layer for existing tests
declare global {
  const jest: typeof vi & {
    fn: typeof vi.fn;
    mock: typeof vi.mock;
    clearAllMocks: typeof vi.clearAllMocks;
    resetAllMocks: typeof vi.resetAllMocks;
    restoreAllMocks: typeof vi.restoreAllMocks;
    MockedFunction: any;
    Mocked: any;
    spyOn: typeof vi.spyOn;
  };

  // Export Vitest types globally for easier migration
  type MockedFunction<T extends (...args: any[]) => any> =
    import("vitest").MockedFunction<T>;
  type MockedObject<T> = import("vitest").MockedObject<T>;
}

// Make Jest available globally for existing tests with enhanced compatibility
(globalThis as any).jest = Object.assign(vi, {
  fn: vi.fn,
  mock: vi.mock,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  spyOn: vi.spyOn,
  MockedFunction: {} as any,
  Mocked: {} as any,
});

// Automatic cleanup after each test (React 19 best practice)
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock Next.js navigation (App Router - Next.js 15)
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "",
  redirect: vi.fn(),
  notFound: vi.fn(),
  permanentRedirect: vi.fn(),
}));

// Mock Next.js server components and actions (React 19 support)
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: vi.fn((fn) => fn),
    use: vi.fn(),
    startTransition: vi.fn((fn) => fn()),
    experimental_useOptimistic: vi.fn(() => [null, vi.fn()]),
  };
});

// Mock server actions
vi.mock("server-only", () => ({}));

// Mock NextAuth
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: null,
    status: "unauthenticated",
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock NextAuth server functions
vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

// Mock NextAuth next functions
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

// Mock auth utilities
vi.mock("@/lib/require-auth-user", () => ({
  requireAuthUserAPI: vi.fn(),
  requireAuthUser: vi.fn(),
}));

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  doorcard: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  appointment: {
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  analytics: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  doorcardAnalytics: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  term: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
  $disconnect: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock environment variables
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Mock crypto
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "mock-uuid-123",
  },
});

// Mock fetch
global.fetch = vi.fn();

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia (only in JSDOM environment)
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock pointer capture methods
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
}
