import { render, screen } from "@testing-library/react";
import DoorcardGrid from "../DoorcardGrid";
import type { Doorcard, Appointment, User } from "@prisma/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type,
  MockedFunction,
  vi,
} from "vitest";

// Mock the external dependencies
vi.mock("@/lib/doorcard/doorcard-status", () => ({
  getDoorcardDisplayStatus: vi.fn(),
}));

vi.mock("@/types/doorcard", () => ({
  COLLEGE_META: {
    SKYLINE: { label: "Skyline College" },
    CSM: { label: "College of San Mateo" },
    CANADA: { label: "Cañada College" },
  },
}));

// Mock Next.js Link component
vi.mock("next/link", () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Printer: () => <span data-testid="printer-icon">Printer</span>,
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  ExternalLink: () => (
    <span data-testid="external-link-icon">ExternalLink</span>
  ),
  XCircle: () => <span data-testid="x-circle-icon">XCircle</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  Archive: () => <span data-testid="archive-icon">Archive</span>,
  AlertTriangle: () => (
    <span data-testid="alert-triangle-icon">AlertTriangle</span>
  ),
  Plus: () => <span data-testid="plus-icon">Plus</span>,
}));

import { getDoorcardDisplayStatus } from "@/lib/doorcard/doorcard-status";

const mockGetDoorcardDisplayStatus = getDoorcardDisplayStatus as MockedFunction<
  typeof getDoorcardDisplayStatus
>;

const createMockDoorcard = (
  overrides: Partial<Doorcard> = {}
): Doorcard & {
  appointments: Appointment[];
  user?: Pick<User, "username" | "name">;
} => ({
  id: "test-doorcard-1",
  term: "FALL",
  year: 2024,
  campus: "SKYLINE",
  college: "SKYLINE",
  doorcardName: "Test Doorcard",
  officeNumber: "Room 101",
  email: "test@example.com",
  phone: "555-1234",
  name: "Dr. Test Professor",
  isActive: true,
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: "user-123",
  appointments: [],
  user: { username: "testuser", name: "Dr. Test Professor" },
  ...overrides,
});

describe("DoorcardGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Grid Layout", () => {
    it("should render title and empty message when no doorcards", () => {
      render(
        <DoorcardGrid
          doorcards={[]}
          title="My Doorcards"
          emptyMessage="No doorcards found"
          variant="grid"
        />
      );

      expect(screen.getByText("My Doorcards")).toBeInTheDocument();
      expect(screen.getByText("No doorcards found")).toBeInTheDocument();
    });

    it("should render doorcards in grid layout", () => {
      const doorcards = [
        createMockDoorcard({ id: "1", doorcardName: "Doorcard 1" }),
        createMockDoorcard({ id: "2", doorcardName: "Doorcard 2" }),
      ];

      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "live",
        label: "Live",
        description: "Publicly visible",
      });

      render(
        <DoorcardGrid
          doorcards={doorcards}
          title="My Doorcards"
          emptyMessage="No doorcards found"
          variant="grid"
        />
      );

      expect(screen.getByText("Doorcard 1")).toBeInTheDocument();
      expect(screen.getByText("Doorcard 2")).toBeInTheDocument();
      expect(screen.getAllByTestId("status-badge")).toHaveLength(2);
    });
  });

  describe("List Layout", () => {
    it("should render doorcards in list layout", () => {
      const doorcards = [createMockDoorcard({ doorcardName: "List Doorcard" })];

      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "draft",
        label: "Draft",
        description: "Not published",
      });

      render(
        <DoorcardGrid
          doorcards={doorcards}
          title="Draft Doorcards"
          emptyMessage="No drafts"
          variant="list"
        />
      );

      expect(screen.getByText("List Doorcard")).toBeInTheDocument();
      expect(screen.getByText("Draft")).toBeInTheDocument();
    });
  });

  describe("Status Badges", () => {
    it("should display live status badge correctly", () => {
      const doorcards = [createMockDoorcard()];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "live",
        label: "Live",
        description: "Publicly visible",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      expect(screen.getByText("Live")).toBeInTheDocument();
      expect(screen.getByTestId("eye-icon")).toBeInTheDocument();
    });

    it("should display incomplete status badge correctly", () => {
      const doorcards = [createMockDoorcard()];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "incomplete",
        label: "Incomplete",
        description: "Missing information",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      expect(screen.getByText("Incomplete")).toBeInTheDocument();
      expect(screen.getByTestId("alert-triangle-icon")).toBeInTheDocument();
    });

    it("should display archived status badge correctly", () => {
      const doorcards = [createMockDoorcard()];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "archived",
        label: "Archived",
        description: "From past term",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      expect(screen.getByText("Archived")).toBeInTheDocument();
      expect(screen.getByTestId("archive-icon")).toBeInTheDocument();
    });
  });

  describe("Action Links", () => {
    it("should show complete setup link for incomplete doorcards", () => {
      const doorcards = [createMockDoorcard({ id: "incomplete-1" })];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "incomplete",
        label: "Incomplete",
        description: "Missing information",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      const completeLink = screen.getByRole("link", {
        name: /complete setup/i,
      });
      expect(completeLink).toHaveAttribute(
        "href",
        "/doorcard/incomplete-1/edit?step=1"
      );
    });

    it("should show view, edit, and print links for complete doorcards", () => {
      const doorcards = [createMockDoorcard({ id: "complete-1" })];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "live",
        label: "Live",
        description: "Publicly visible",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      expect(
        screen.getByRole("link", { name: /view doorcard/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /edit doorcard/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /print doorcard/i })
      ).toBeInTheDocument();
    });

    it("should not show edit link for archived doorcards", () => {
      const doorcards = [createMockDoorcard({ id: "archived-1" })];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "archived",
        label: "Archived",
        description: "From past term",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      expect(
        screen.getByRole("link", { name: /view doorcard/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /edit doorcard/i })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /print doorcard/i })
      ).toBeInTheDocument();
    });
  });

  describe("URL Generation", () => {
    it("should generate public view URL for live doorcards", () => {
      const doorcards = [
        createMockDoorcard({
          user: { username: "testuser", name: "Test User" },
        }),
      ];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "live",
        label: "Live",
        description: "Publicly visible",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      const viewLink = screen.getByRole("link", { name: /view doorcard/i });
      expect(viewLink).toHaveAttribute("href", "/view/testuser");
    });

    it("should generate auth view URL for non-live doorcards", () => {
      const doorcards = [createMockDoorcard({ id: "draft-1" })];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "draft",
        label: "Draft",
        description: "Not published",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      const viewLink = screen.getByRole("link", { name: /view doorcard/i });
      expect(viewLink).toHaveAttribute(
        "href",
        "/doorcard/draft-1/view?auth=true"
      );
    });
  });

  describe("Campus Label Display", () => {
    it("should display campus label correctly", () => {
      const doorcards = [createMockDoorcard({ college: "SKYLINE" })];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "live",
        label: "Live",
        description: "Publicly visible",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      expect(screen.getByText("Skyline College")).toBeInTheDocument();
    });

    it("should handle missing campus", () => {
      const doorcards = [createMockDoorcard({ college: null })];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "live",
        label: "Live",
        description: "Publicly visible",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      // Should not display campus section when college is null
      expect(screen.queryByText("Campus:")).not.toBeInTheDocument();
    });
  });

  describe("Fallback Values", () => {
    it("should handle missing doorcard name", () => {
      const doorcards = [
        createMockDoorcard({
          doorcardName: "",
          name: "Dr. Smith",
          term: "SPRING",
          year: 2025,
        }),
      ];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "live",
        label: "Live",
        description: "Publicly visible",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      expect(
        screen.getByText("Dr. Smith's SPRING 2025 Doorcard")
      ).toBeInTheDocument();
    });

    it("should handle missing faculty name", () => {
      const doorcards = [createMockDoorcard({ name: null })];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "live",
        label: "Live",
        description: "Publicly visible",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      expect(screen.getByText(/Faculty Member/)).toBeInTheDocument();
    });
  });

  describe("Appointment Count", () => {
    it("should display correct appointment count", () => {
      const doorcards = [
        createMockDoorcard({
          appointments: [
            { id: "1" } as Appointment,
            { id: "2" } as Appointment,
            { id: "3" } as Appointment,
          ],
        }),
      ];
      mockGetDoorcardDisplayStatus.mockReturnValue({
        status: "live",
        label: "Live",
        description: "Publicly visible",
      });

      render(
        <DoorcardGrid doorcards={doorcards} title="Test" emptyMessage="Empty" />
      );

      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });
});
