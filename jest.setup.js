import "@testing-library/jest-dom";
import React from "react";

// Mock Headers and global objects for testing
global.Headers = class Headers {
  constructor(init) {
    this.headers = new Map();
    if (init) {
      if (init instanceof Headers) {
        for (const [key, value] of init.headers) {
          this.headers.set(key.toLowerCase(), value);
        }
      } else if (Array.isArray(init)) {
        for (const [key, value] of init) {
          this.headers.set(key.toLowerCase(), value);
        }
      } else {
        for (const [key, value] of Object.entries(init)) {
          this.headers.set(key.toLowerCase(), value);
        }
      }
    }
  }

  get(name) {
    return this.headers.get(name.toLowerCase()) || null;
  }

  set(name, value) {
    this.headers.set(name.toLowerCase(), value);
  }

  has(name) {
    return this.headers.has(name.toLowerCase());
  }

  delete(name) {
    this.headers.delete(name.toLowerCase());
  }

  *[Symbol.iterator]() {
    for (const [key, value] of this.headers) {
      yield [key, value];
    }
  }

  entries() {
    return this.headers.entries();
  }
};

global.Request = class Request {
  constructor(input, init = {}) {
    this.url = typeof input === "string" ? input : input.url;
    this.method = init.method || "GET";
    this.headers = new Headers(init.headers);
    this.body = init.body || null;
    this._bodyText = init.body || null;
  }

  async json() {
    return JSON.parse(this._bodyText);
  }

  async text() {
    return this._bodyText;
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || "OK";
    this.headers = new Headers(init.headers);
  }

  static json(body, init = {}) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...init.headers,
      },
    });
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }
};

// Mock Next.js server utilities
jest.mock("next/server", () => ({
  NextRequest: jest.fn().mockImplementation((input, init = {}) => ({
    nextUrl: new URL(typeof input === "string" ? input : input.url),
    cookies: {
      get: jest.fn(),
      getAll: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    },
    geo: {},
    headers: new Headers(init.headers),
    method: init.method || "GET",
    url: typeof input === "string" ? input : input.url,
    body: init.body,
    json: jest.fn().mockImplementation(() => {
      if (!init.body) return Promise.resolve({});
      try {
        return Promise.resolve(JSON.parse(init.body));
      } catch (e) {
        return Promise.reject(
          new SyntaxError(
            `Unexpected token ${init.body[0]}, "${init.body}" is not valid JSON`
          )
        );
      }
    }),
    text: jest.fn().mockImplementation(() => Promise.resolve(init.body || "")),
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((body, init = {}) => ({
      status: init.status || 200,
      headers: new Headers(init.headers),
      body: JSON.stringify(body),
      json: jest.fn().mockResolvedValue(body),
    })),
    next: jest.fn(),
    redirect: jest.fn(),
    rewrite: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "";
  },
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// Mock NextAuth completely to avoid ESM issues
jest.mock("next-auth", () => ({
  default: jest.fn(),
  getServerSession: jest.fn(),
  AuthOptions: {},
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

jest.mock("next-auth/next", () => ({
  NextAuthHandler: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock("next-auth/providers/credentials", () => {
  return jest.fn(() => ({
    id: "credentials",
    name: "credentials",
    type: "credentials",
    credentials: {},
    authorize: jest.fn(),
  }));
});

// Mock auth-related dependencies that cause ESM issues
jest.mock("jose", () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(),
}));

// Mock Prisma adapter - simplified to avoid conflicts with test-specific mocks
jest.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(),
}));

// Mock Prisma - simplified to avoid conflicts with test-specific mocks
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(),
}));

// Mock the singleton prisma instance - use a simple mock that can be overridden in tests
const mockPrismaInstance = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  doorcard: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  appointment: {
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  analytics: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  term: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
};

jest.mock("@/lib/prisma", () => ({
  prisma: mockPrismaInstance,
}));

// Mock bcryptjs
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock environment variables
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Mock window.matchMedia for responsive/media query tests
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock pointer capture methods for JSDOM compatibility
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture = jest.fn(() => false);
  Element.prototype.setPointerCapture = jest.fn();
  Element.prototype.releasePointerCapture = jest.fn();
}

// Mock fetch if needed
global.fetch = jest.fn();

// Mock Prisma enums for tests
// Mock Prisma error classes
class MockPrismaClientKnownRequestError extends Error {
  constructor(message, { code, meta } = {}) {
    super(message);
    this.name = "PrismaClientKnownRequestError";
    this.code = code;
    this.meta = meta;
  }
}

class MockPrismaClientInitializationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PrismaClientInitializationError";
  }
}

class MockPrismaClientValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PrismaClientValidationError";
  }
}

class MockPrismaClientRustPanicError extends Error {
  constructor(message) {
    super(message);
    this.name = "PrismaClientRustPanicError";
  }
}

jest.doMock("@prisma/client", () => ({
  ...jest.requireActual("@prisma/client"),
  Prisma: {
    PrismaClientKnownRequestError: MockPrismaClientKnownRequestError,
    PrismaClientInitializationError: MockPrismaClientInitializationError,
    PrismaClientValidationError: MockPrismaClientValidationError,
    PrismaClientRustPanicError: MockPrismaClientRustPanicError,
  },
  TermSeason: {
    FALL: "FALL",
    SPRING: "SPRING",
    SUMMER: "SUMMER",
  },
  College: {
    SKYLINE: "SKYLINE",
    CSM: "CSM",
    CANADA: "CANADA",
  },
  DayOfWeek: {
    MONDAY: "MONDAY",
    TUESDAY: "TUESDAY",
    WEDNESDAY: "WEDNESDAY",
    THURSDAY: "THURSDAY",
    FRIDAY: "FRIDAY",
    SATURDAY: "SATURDAY",
    SUNDAY: "SUNDAY",
  },
  AppointmentCategory: {
    OFFICE_HOURS: "OFFICE_HOURS",
    IN_CLASS: "IN_CLASS",
    LECTURE: "LECTURE",
    LAB: "LAB",
    HOURS_BY_ARRANGEMENT: "HOURS_BY_ARRANGEMENT",
    REFERENCE: "REFERENCE",
  },
}));

// Suppress console errors for cleaner test output (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is no longer supported")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock the UI components directly to avoid Radix UI complexity in tests
jest.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange, ...props }) => {
    const handleChange = (e) => {
      onValueChange?.(e.target.value);
    };

    // Extract options from SelectContent > SelectItem children recursively
    const extractOptions = (children) => {
      const options = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          // Check if this is a SelectContent
          if (
            child.type &&
            (child.type.displayName === "SelectContent" ||
              child.props?.className?.includes("SelectContent"))
          ) {
            options.push(...extractOptions(child.props.children));
          }
          // Check if this is a SelectItem
          else if (
            child.type &&
            (child.type.displayName === "SelectItem" ||
              child.props?.value !== undefined)
          ) {
            options.push({
              value: child.props.value,
              label: child.props.children,
            });
          }
          // Recursively check children
          else if (child.props?.children) {
            options.push(...extractOptions(child.props.children));
          }
        }
      });
      return options;
    };

    const options = extractOptions(children);

    return (
      <div data-testid="select-wrapper" {...props}>
        <select
          value={value || ""}
          onChange={handleChange}
          data-testid="select"
        >
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {children}
      </div>
    );
  },
  SelectTrigger: React.forwardRef(({ children, className, ...props }, ref) => (
    <button ref={ref} className={className} type="button" {...props}>
      {children}
    </button>
  )),
  SelectContent: ({ children, ...props }) => {
    const Content = ({ children, ...props }) => (
      <div {...props}>{children}</div>
    );
    Content.displayName = "SelectContent";
    return <Content {...props}>{children}</Content>;
  },
  SelectItem: ({ children, value, ...props }) => {
    const Item = ({ children, ...props }) => <div {...props}>{children}</div>;
    Item.displayName = "SelectItem";
    return (
      <Item value={value} {...props}>
        {children}
      </Item>
    );
  },
  SelectValue: ({ placeholder, children, ...props }) => (
    <span {...props}>{children || placeholder}</span>
  ),
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }) => <label {...props}>{children}</label>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, disabled, type, ...props }) => (
    <button disabled={disabled} type={type} {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ChevronUp: ({ className, ...props }) => (
    <div className={className} data-testid="chevron-up" {...props} />
  ),
  ChevronDown: ({ className, ...props }) => (
    <div className={className} data-testid="chevron-down" {...props} />
  ),
  Check: ({ className, ...props }) => (
    <div className={className} data-testid="check" {...props} />
  ),
  CheckCircle2: ({ className, ...props }) => (
    <div className={className} data-testid="check-circle-2" {...props} />
  ),
  X: ({ className, ...props }) => (
    <div className={className} data-testid="x" {...props} />
  ),
  Plus: ({ className, ...props }) => (
    <div className={className} data-testid="plus" {...props} />
  ),
  Minus: ({ className, ...props }) => (
    <div className={className} data-testid="minus" {...props} />
  ),
  Calendar: ({ className, ...props }) => (
    <div className={className} data-testid="calendar" {...props} />
  ),
  Clock: ({ className, ...props }) => (
    <div className={className} data-testid="clock" {...props} />
  ),
  MapPin: ({ className, ...props }) => (
    <div className={className} data-testid="map-pin" {...props} />
  ),
  User: ({ className, ...props }) => (
    <div className={className} data-testid="user" {...props} />
  ),
  Mail: ({ className, ...props }) => (
    <div className={className} data-testid="mail" {...props} />
  ),
  Phone: ({ className, ...props }) => (
    <div className={className} data-testid="phone" {...props} />
  ),
  Building: ({ className, ...props }) => (
    <div className={className} data-testid="building" {...props} />
  ),
  Building2: ({ className, ...props }) => (
    <div className={className} data-testid="building-2" {...props} />
  ),
  Edit: ({ className, ...props }) => (
    <div className={className} data-testid="edit" {...props} />
  ),
  Trash: ({ className, ...props }) => (
    <div className={className} data-testid="trash" {...props} />
  ),
  Eye: ({ className, ...props }) => (
    <div className={className} data-testid="eye" {...props} />
  ),
  Copy: ({ className, ...props }) => (
    <div className={className} data-testid="copy" {...props} />
  ),
  Share: ({ className, ...props }) => (
    <div className={className} data-testid="share" {...props} />
  ),
  Download: ({ className, ...props }) => (
    <div className={className} data-testid="download" {...props} />
  ),
  ExternalLink: ({ className, ...props }) => (
    <div className={className} data-testid="external-link" {...props} />
  ),
  FileText: ({ className, ...props }) => (
    <div className={className} data-testid="file-text" {...props} />
  ),
  Image: ({ className, ...props }) => (
    <div className={className} data-testid="image" {...props} />
  ),
  AlertCircle: ({ className, ...props }) => (
    <div className={className} data-testid="alert-circle" {...props} />
  ),
  Info: ({ className, ...props }) => (
    <div className={className} data-testid="info" {...props} />
  ),
  Search: ({ className, ...props }) => (
    <div className={className} data-testid="search" {...props} />
  ),
  Filter: ({ className, ...props }) => (
    <div className={className} data-testid="filter" {...props} />
  ),
  Settings: ({ className, ...props }) => (
    <div className={className} data-testid="settings" {...props} />
  ),
  MoreHorizontal: ({ className, ...props }) => (
    <div className={className} data-testid="more-horizontal" {...props} />
  ),
  MoreVertical: ({ className, ...props }) => (
    <div className={className} data-testid="more-vertical" {...props} />
  ),
  ArrowRight: ({ className, ...props }) => (
    <div className={className} data-testid="arrow-right" {...props} />
  ),
  ArrowLeft: ({ className, ...props }) => (
    <div className={className} data-testid="arrow-left" {...props} />
  ),
  Globe: ({ className, ...props }) => (
    <div className={className} data-testid="globe" {...props} />
  ),
  GraduationCap: ({ className, ...props }) => (
    <div className={className} data-testid="graduation-cap" {...props} />
  ),
}));
