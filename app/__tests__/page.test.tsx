import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import Home from "../page";
import { HomePageObject } from "@/lib/test-page-objects";

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
    await act(async () => {
      render(<Home />);
    });

    expect(screen.getByText("Find Your Professor")).toBeInTheDocument();
    expect(
      screen.getByText("Office Hours & Contact Information")
    ).toBeInTheDocument();
    expect(screen.getByText("Search for Your Professor")).toBeInTheDocument();
  });

  it("renders the improved search section", async () => {
    await act(async () => {
      render(<Home />);
    });

    // Test user-facing functionality, not exact text
    expect(
      screen.getByRole("heading", { name: /search.*professor/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("campus-filter")).toBeInTheDocument();
    expect(screen.getByTestId("department-filter")).toBeInTheDocument();

    // Test that search input is accessible
    expect(homePage.getSearchInput()).toBeInTheDocument();
  });

  it("shows campus names clearly in tabs", async () => {
    await act(async () => {
      render(<Home />);
    });

    expect(screen.getByText("All Campuses")).toBeInTheDocument();
    expect(screen.getAllByText("Skyline").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CSM").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cañada").length).toBeGreaterThan(0);
  });

  it("displays professor cards with improved layout", async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      // Test for professor cards using semantic queries, not exact text
      homePage.expectProfessorCardsVisible();
    });

    // Check for improved information display - use patterns, not exact text
    expect(screen.getAllByText(/office.*123/i)).toHaveLength(2);
    expect(screen.getAllByText(/office hours available/i)).toHaveLength(2);
  });

  it("shows helpful content when professors are found", async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      // Check that professor content is displayed instead of specific tips
      expect(screen.getAllByText("Dr. John Smith")).toHaveLength(2);
      expect(
        screen.getByText(/Search for Your Professor/i)
      ).toBeInTheDocument();
    });
  });

  it("filters by campus correctly", async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      // Wait for professors to load by checking for professor cards
      expect(screen.getAllByTestId("professor-card")).toHaveLength(2);
    });

    // Get initial professor count
    const initialCards = screen.getAllByTestId("professor-card");
    expect(initialCards.length).toBe(2);

    // Click CSM radio button by finding the radio input with value "CSM"
    const csmRadio = screen.getByRole("radio", { name: /CSM/ });
    await act(async () => {
      fireEvent.click(csmRadio);
    });

    await waitFor(() => {
      // Check that filtering happened - should now only show CSM professor
      const filteredCards = screen.getAllByTestId("professor-card");
      expect(filteredCards.length).toBe(1);

      // Verify the professor count indicator shows correct number
      expect(screen.getByText("1 professor")).toBeInTheDocument();
    });
  });

  it("searches professors by name", async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getAllByText("Dr. John Smith")).toHaveLength(2);
      expect(screen.getAllByText("Dr. Jane Doe")).toHaveLength(2);
    });

    const searchInput = screen.getByPlaceholderText(/Type professor's name/);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "John" } });
    });

    await waitFor(() => {
      expect(screen.getAllByText("Dr. John Smith").length).toBeGreaterThan(0);
      expect(screen.queryByText("Dr. Jane Doe")).not.toBeInTheDocument();
    });
  });

  it("shows improved empty state when no professors found", async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({ doorcards: [], success: true }),
    } as Response);

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText("No professors found")).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your search/)).toBeInTheDocument();
    });
  });

  it("navigates to professor page when clicked", async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getAllByText("Dr. John Smith")).toHaveLength(2);
    });

    // Click the first occurrence (most likely in a professor card)
    await act(async () => {
      fireEvent.click(screen.getAllByText("Dr. John Smith")[0]);
    });

    expect(mockPush).toHaveBeenCalledWith("/view/john-smith");
  });

  it("shows proper professor count", async () => {
    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText("2 professors")).toBeInTheDocument();
    });
  });

  it("handles loading state with improved message", async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    await act(async () => {
      render(<Home />);
    });

    // Test for loading state without relying on exact text
    expect(
      screen.getByText(/loading/i) ||
        screen.getByText(/finding/i) ||
        screen.getByRole("status")
    ).toBeInTheDocument();
  });
});
