import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../page";
import { HomePageObject } from "@/lib/test-page-objects";
import { testHelpers, mockData } from "@/lib/test-utils";

// Mock the router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockDoorcards = [
  {
    id: "1",
    name: "Dr. John Smith",
    doorcardName: "Professor John Smith",
    officeNumber: "123",
    term: "Fall",
    year: "2024",
    college: "SKYLINE",
    user: {
      name: "Dr. John Smith",
      username: "john-smith",
    },
    appointmentCount: 3,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "2",
    name: "Dr. Jane Doe",
    doorcardName: "Professor Jane Doe",
    officeNumber: "456",
    term: "Fall",
    year: "2024",
    college: "CSM",
    user: {
      name: "Dr. Jane Doe",
      username: "jane-doe",
    },
    appointmentCount: 2,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
];

describe("Home Page", () => {
  let homePage: HomePageObject;

  beforeEach(() => {
    homePage = new HomePageObject();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ doorcards: mockDoorcards, success: true }),
    } as Response);
  });

  it("renders the improved header with student-friendly language", async () => {
    render(<Home />);

    expect(screen.getByText("Find Your Professor")).toBeInTheDocument();
    expect(
      screen.getByText("Office Hours & Contact Information")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Search for Your Professor")  
    ).toBeInTheDocument();
  });

  it("renders the improved search section", async () => {
    render(<Home />);

    // Test user-facing functionality, not exact text
    expect(screen.getByRole('heading', { name: /search.*professor/i })).toBeInTheDocument();
    expect(screen.getByTestId('campus-filter')).toBeInTheDocument();
    expect(screen.getByTestId('department-filter')).toBeInTheDocument();
    
    // Test that search input is accessible
    expect(homePage.getSearchInput()).toBeInTheDocument();
  });

  it("shows campus names clearly in tabs", async () => {
    render(<Home />);

    expect(screen.getByText("All Campuses")).toBeInTheDocument();
    expect(screen.getByText("Skyline")).toBeInTheDocument();
    expect(screen.getByText("CSM")).toBeInTheDocument();
    expect(screen.getByText("Cañada")).toBeInTheDocument();
  });

  it("displays professor cards with improved layout", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Dr. John Smith")).toBeInTheDocument();
      expect(screen.getByText("Dr. Jane Doe")).toBeInTheDocument();
    });

    // Check for improved information display
    expect(screen.getByText("Office 123")).toBeInTheDocument();
    expect(screen.getByText("3 office hours available")).toBeInTheDocument();
    expect(screen.getByText("2 office hours available")).toBeInTheDocument();
  });

  it("shows helpful tips section when professors are found", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("💡 Student Tips")).toBeInTheDocument();
      expect(screen.getByText(/Before visiting:/)).toBeInTheDocument();
      expect(screen.getByText(/Office locations:/)).toBeInTheDocument();
    });
  });

  it("filters by campus correctly", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Dr. John Smith")).toBeInTheDocument();
      expect(screen.getByText("Dr. Jane Doe")).toBeInTheDocument();
    });

    // Click CSM tab (get the button, not the badge)
    fireEvent.click(screen.getByRole("tab", { name: "CSM" }));

    await waitFor(() => {
      expect(screen.queryByText("Dr. John Smith")).not.toBeInTheDocument(); // Skyline professor
      expect(screen.getByText("Dr. Jane Doe")).toBeInTheDocument(); // CSM professor
    });
  });

  it("searches professors by name", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Dr. John Smith")).toBeInTheDocument();
      expect(screen.getByText("Dr. Jane Doe")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Type professor's name/);
    fireEvent.change(searchInput, { target: { value: "John" } });

    await waitFor(() => {
      expect(screen.getByText("Dr. John Smith")).toBeInTheDocument();
      expect(screen.queryByText("Dr. Jane Doe")).not.toBeInTheDocument();
    });
  });

  it("shows improved empty state when no professors found", async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ doorcards: [], success: true }),
    } as Response);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("No professors found")).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your search/)).toBeInTheDocument();
    });
  });

  it("navigates to professor page when clicked", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Dr. John Smith")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Dr. John Smith"));

    expect(mockPush).toHaveBeenCalledWith("/view/john-smith");
  });

  it("shows proper professor count", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("2 professors")).toBeInTheDocument();
    });
  });

  it("handles loading state with improved message", async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<Home />);

    expect(screen.getByText("Finding professors...")).toBeInTheDocument();
  });
});
