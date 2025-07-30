import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminPage from "../page";
import type { ReactNode } from "react";

// Mock fetch globally
global.fetch = jest.fn();

// Mock UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    ...props
  }: {
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children }: { children: ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: { children: ReactNode }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children }: { children: ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: ReactNode }) => (
    <h2 data-testid="card-title">{children}</h2>
  ),
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
    ...props
  }: {
    children: ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
    [key: string]: unknown;
  }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    variant,
    className,
  }: {
    children: ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: { [key: string]: unknown }) => (
    <input data-testid="input" {...props} />
  ),
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({
    children,
    ...props
  }: {
    children: ReactNode;
    [key: string]: unknown;
  }) => <label {...props}>{children}</label>,
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    onValueChange?: (value: string) => void;
    value?: string;
  }) => (
    <div data-testid="select">
      <select onChange={(e) => onValueChange?.(e.target.value)} value={value}>
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: ReactNode;
    value?: string;
  }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
  }) => (
    <div data-testid="tabs" data-value={value}>
      <div onClick={() => onValueChange?.("users")}>{children}</div>
    </div>
  ),
  TabsContent: ({
    children,
    value,
  }: {
    children: ReactNode;
    value?: string;
  }) => <div data-testid={`tab-content-${value}`}>{children}</div>,
  TabsList: ({ children }: { children: ReactNode }) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({
    children,
    value,
  }: {
    children: ReactNode;
    value?: string;
  }) => <button data-testid={`tab-trigger-${value}`}>{children}</button>,
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  AlertCircle: () => <span data-testid="alert-circle-icon">AlertCircle</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  Calendar: () => <span data-testid="calendar-icon">Calendar</span>,
  MapPin: () => <span data-testid="map-pin-icon">MapPin</span>,
  Activity: () => <span data-testid="activity-icon">Activity</span>,
  Search: () => <span data-testid="search-icon">Search</span>,
  Filter: () => <span data-testid="filter-icon">Filter</span>,
  Download: () => <span data-testid="download-icon">Download</span>,
  RefreshCw: () => <span data-testid="refresh-icon">RefreshCw</span>,
  CheckCircle: () => <span data-testid="check-circle-icon">CheckCircle</span>,
  XCircle: () => <span data-testid="x-circle-icon">XCircle</span>,
}));

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const mockStatsResponse = {
  totalUsers: 150,
  activeUsers: 120,
  totalDoorcards: 75,
  activeDoorcards: 60,
  totalAppointments: 300,
  campusBreakdown: {
    SKYLINE: { users: 50, doorcards: 25, appointments: 100 },
    CSM: { users: 60, doorcards: 30, appointments: 120 },
    CANADA: { users: 40, doorcards: 20, appointments: 80 },
  },
  recentActivity: {
    newUsers: 5,
    newDoorcards: 3,
    newAppointments: 15,
  },
};

const mockUsersResponse = [
  {
    id: "user1",
    email: "john.doe@example.com",
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    role: "faculty",
    college: "SKYLINE",
    createdAt: "2024-01-01T00:00:00Z",
    doorcardCount: 2,
    appointmentCount: 8,
    lastActive: "2024-01-15T00:00:00Z",
  },
  {
    id: "user2",
    email: "jane.smith@example.com",
    name: "Jane Smith",
    firstName: "Jane",
    lastName: "Smith",
    username: "janesmith",
    role: "faculty",
    college: "CSM",
    createdAt: "2024-01-02T00:00:00Z",
    doorcardCount: 1,
    appointmentCount: 5,
    lastActive: "2024-01-14T00:00:00Z",
  },
];

const mockDoorcardsResponse = [
  {
    id: "doorcard1",
    name: "Dr. John Doe",
    doorcardName: "John Doe - Fall 2024",
    term: "FALL",
    year: 2024,
    college: "SKYLINE",
    isActive: true,
    isPublic: true,
    officeNumber: "Room 101",
    appointmentCount: 8,
    createdAt: "2024-01-01T00:00:00Z",
    user: {
      email: "john.doe@example.com",
      name: "Dr. John Doe",
    },
  },
  {
    id: "doorcard2",
    name: "Dr. Jane Smith",
    doorcardName: "Jane Smith - Spring 2024",
    term: "SPRING",
    year: 2024,
    college: "CSM",
    isActive: false,
    isPublic: false,
    officeNumber: "Room 202",
    appointmentCount: 5,
    createdAt: "2024-01-02T00:00:00Z",
    user: {
      email: "jane.smith@example.com",
      name: "Dr. Jane Smith",
    },
  },
];

describe("AdminPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
  });

  describe("Loading States", () => {
    it("should show loading spinner initially", () => {
      // Mock slow response
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<AdminPage />);

      expect(
        screen.getByText("Loading admin dashboard...")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Loading admin dashboard...")
      ).toBeInTheDocument();
    });

    it("should hide loading state after data loads", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatsResponse,
      } as Response);

      render(<AdminPage />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading admin dashboard...")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error when all API calls fail", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText("Admin Dashboard Error")).toBeInTheDocument();
        expect(
          screen.getByText("Failed to load admin data")
        ).toBeInTheDocument();
      });
    });

    it("should show retry button on error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      render(<AdminPage />);

      await waitFor(() => {
        const retryButton = screen.getByText("Retry");
        expect(retryButton).toBeInTheDocument();
      });
    });

    it("should retry fetching data when retry button is clicked", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
        .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
        .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStatsResponse,
        } as Response);

      render(<AdminPage />);

      await waitFor(() => {
        const retryButton = screen.getByText("Retry");
        expect(retryButton).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Retry"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/stats");
      });
    });
  });

  describe("Data Fetching", () => {
    it("should fetch admin data on mount", async () => {
      mockFetch.mockImplementation((url) => {
        if (typeof url === "string") {
          if (url.includes("/api/admin/stats")) {
            return Promise.resolve({
              ok: true,
              json: async () => mockStatsResponse,
            } as Response);
          }
          if (url.includes("/api/admin/users")) {
            return Promise.resolve({
              ok: true,
              json: async () => mockUsersResponse,
            } as Response);
          }
          if (url.includes("/api/admin/doorcards")) {
            return Promise.resolve({
              ok: true,
              json: async () => mockDoorcardsResponse,
            } as Response);
          }
        }
        return Promise.resolve({ ok: false } as Response);
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/stats");
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/users");
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/doorcards");
      });
    });

    it("should refresh data when refresh button is clicked", async () => {
      mockFetch.mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/api/admin/stats")) {
          return Promise.resolve({
            ok: true,
            json: async () => mockStatsResponse,
          } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading admin dashboard...")
        ).not.toBeInTheDocument();
      });

      const refreshButton = screen.getByText("Refresh");
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(6); // 3 initial + 3 refresh
      });
    });
  });

  describe("Stats Overview", () => {
    beforeEach(async () => {
      mockFetch.mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/api/admin/stats")) {
          return Promise.resolve({
            ok: true,
            json: async () => mockStatsResponse,
          } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading admin dashboard...")
        ).not.toBeInTheDocument();
      });
    });

    it("should display total users stat", () => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("120 active users")).toBeInTheDocument();
    });

    it("should display doorcards stat", () => {
      expect(screen.getByText("Doorcards")).toBeInTheDocument();
      expect(screen.getByText("75")).toBeInTheDocument();
      expect(screen.getByText("60 currently active")).toBeInTheDocument();
    });

    it("should display appointments stat", () => {
      expect(screen.getByText("Appointments")).toBeInTheDocument();
      expect(screen.getByText("300")).toBeInTheDocument();
    });

    it("should display recent activity stat", () => {
      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("New users this week")).toBeInTheDocument();
    });
  });

  describe("Campus Breakdown", () => {
    beforeEach(async () => {
      mockFetch.mockImplementation((url) => {
        if (typeof url === "string" && url.includes("/api/admin/stats")) {
          return Promise.resolve({
            ok: true,
            json: async () => mockStatsResponse,
          } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading admin dashboard...")
        ).not.toBeInTheDocument();
      });
    });

    it("should display campus distribution", () => {
      expect(screen.getByText("Campus Distribution")).toBeInTheDocument();
      expect(screen.getByText("SKYLINE")).toBeInTheDocument();
      expect(screen.getByText("CSM")).toBeInTheDocument();
      expect(screen.getByText("CANADA")).toBeInTheDocument();
    });

    it("should show campus stats correctly", () => {
      // Check SKYLINE stats
      const skylineSection = screen.getByText("SKYLINE").closest("div");
      expect(skylineSection).toHaveTextContent("50"); // users
      expect(skylineSection).toHaveTextContent("25"); // doorcards
      expect(skylineSection).toHaveTextContent("100"); // appointments
    });
  });

  describe("Search and Filter", () => {
    beforeEach(async () => {
      mockFetch.mockImplementation((url) => {
        if (typeof url === "string") {
          if (url.includes("/api/admin/users")) {
            return Promise.resolve({
              ok: true,
              json: async () => mockUsersResponse,
            } as Response);
          }
          if (url.includes("/api/admin/doorcards")) {
            return Promise.resolve({
              ok: true,
              json: async () => mockDoorcardsResponse,
            } as Response);
          }
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        } as Response);
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading admin dashboard...")
        ).not.toBeInTheDocument();
      });
    });

    it("should provide search functionality", () => {
      const searchInputs = screen.getAllByTestId("input");
      expect(searchInputs.length).toBeGreaterThan(0);
    });

    it("should provide campus filter options", () => {
      const selects = screen.getAllByTestId("select");
      expect(selects.length).toBeGreaterThan(0);
    });

    it("should filter users by search query", async () => {
      // Switch to users tab
      fireEvent.click(screen.getByTestId("tab-trigger-users"));

      const searchInput = screen.getByPlaceholderText(
        /search by email, name, or username/i
      );
      fireEvent.change(searchInput, { target: { value: "john" } });

      // The filtering logic would be tested with actual user data
      expect(searchInput).toHaveValue("john");
    });
  });

  describe("Tab Navigation", () => {
    beforeEach(async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({ ok: true, json: async () => ({}) } as Response)
      );

      render(<AdminPage />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading admin dashboard...")
        ).not.toBeInTheDocument();
      });
    });

    it("should show all tab triggers", () => {
      expect(screen.getByTestId("tab-trigger-overview")).toBeInTheDocument();
      expect(screen.getByTestId("tab-trigger-users")).toBeInTheDocument();
      expect(screen.getByTestId("tab-trigger-doorcards")).toBeInTheDocument();
      expect(screen.getByTestId("tab-trigger-analytics")).toBeInTheDocument();
    });

    it("should switch between tabs", () => {
      expect(screen.getByTestId("tab-content-overview")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("tab-trigger-users"));
      expect(screen.getByTestId("tab-content-users")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    beforeEach(async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({ ok: true, json: async () => ({}) } as Response)
      );

      render(<AdminPage />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading admin dashboard...")
        ).not.toBeInTheDocument();
      });
    });

    it("should have proper headings structure", () => {
      expect(
        screen.getByRole("heading", { name: /admin dashboard/i })
      ).toBeInTheDocument();
    });

    it("should have accessible form labels", () => {
      expect(screen.getByLabelText(/search users/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/campus/i)).toBeInTheDocument();
    });

    it("should use semantic HTML elements", () => {
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
