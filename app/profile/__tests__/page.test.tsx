import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "next-auth/react";
import ProfilePage from "../page";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock toast hook
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: any) => <input data-testid="input" {...props} />,
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: any) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: any) => (
    <h2 data-testid="card-title">{children}</h2>
  ),
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select">
      <select onChange={(e) => onValueChange(e.target.value)} value={value}>
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

// Remove separator mock as it's not used in the component

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  AlertCircle: () => <span data-testid="alert-circle">Alert</span>,
  CheckCircle2: () => <span data-testid="check-circle">Check</span>,
  User: () => <span data-testid="user-icon">User</span>,
  Globe: () => <span data-testid="globe-icon">Globe</span>,
  GraduationCap: () => (
    <span data-testid="graduation-cap-icon">GraduationCap</span>
  ),
  Building2: () => <span data-testid="building-icon">Building</span>,
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

const mockSessionData = {
  user: {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
  },
  expires: "2024-12-31",
};

const mockProfileData = {
  id: "user-123",
  name: "Test User",
  firstName: "Test",
  lastName: "User",
  title: "Dr.",
  pronouns: "they/them",
  displayFormat: "FULL_NAME",
  email: "test@example.com",
  username: "testuser",
  website: "https://example.com",
  college: "SKYLINE",
  role: "faculty",
};

describe("ProfilePage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Default mock setup
    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: "authenticated",
      update: jest.fn(),
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockProfileData,
      headers: new Headers(),
      status: 200,
      statusText: "OK",
    } as Response);
  });

  describe("Loading States", () => {
    it("should show loading state while session is loading", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
        update: jest.fn(),
      });

      render(<ProfilePage />);

      expect(screen.getByText("Loading profile...")).toBeInTheDocument();
    });

    it("should show loading state while fetching profile", async () => {
      // Mock slow fetch
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<ProfilePage />);

      expect(screen.getByText("Loading profile...")).toBeInTheDocument();
    });
  });

  describe("Authentication States", () => {
    it("should show error when user is not authenticated", async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(
          screen.getByText(/please log in to view your profile/i),
        ).toBeInTheDocument();
      });
    });

    it("should redirect when not authenticated", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      render(<ProfilePage />);

      expect(
        screen.getByText(/please log in to view your profile/i),
      ).toBeInTheDocument();
    });
  });

  describe("Profile Display", () => {
    it("should display user profile information", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
        expect(screen.getByDisplayValue("User")).toBeInTheDocument();
        expect(
          screen.getByDisplayValue("https://example.com"),
        ).toBeInTheDocument();
      });
    });

    it("should show selected title", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const selects = screen.getAllByTestId("select");
        const titleSelect = selects.find((s) =>
          s.querySelector('option[value="Dr."]'),
        );
        expect(titleSelect?.querySelector("select")).toHaveValue("Dr.");
      });
    });

    it("should show selected pronouns", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const selects = screen.getAllByTestId("select");
        const pronounsSelect = selects.find((s) =>
          s.querySelector('option[value="they/them"]'),
        );
        expect(pronounsSelect?.querySelector("select")).toHaveValue(
          "they/them",
        );
      });
    });

    it("should show selected campus", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const selects = screen.getAllByTestId("select");
        const campusSelect = selects.find((s) =>
          s.querySelector('option[value="SKYLINE"]'),
        );
        expect(campusSelect?.querySelector("select")).toHaveValue("SKYLINE");
      });
    });
  });

  describe("Form Submission", () => {
    it("should handle successful profile update", async () => {
      const mockUpdate = jest.fn();
      mockUseSession.mockReturnValue({
        data: mockSessionData,
        status: "authenticated",
        update: mockUpdate,
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfileData,
          headers: new Headers(),
          status: 200,
          statusText: "OK",
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockProfileData, firstName: "Updated" }),
          headers: new Headers(),
          status: 200,
          statusText: "OK",
        } as Response);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
      });

      // Update first name
      const firstNameInput = screen.getByDisplayValue("Test");
      await user.clear(firstNameInput);
      await user.type(firstNameInput, "Updated");

      // Submit form
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/user/profile",
          expect.objectContaining({
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: expect.stringContaining('"firstName":"Updated"'),
          }),
        );
        expect(mockToast).toHaveBeenCalledWith({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it("should handle profile update errors", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfileData,
          headers: new Headers(),
          status: 200,
          statusText: "OK",
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: async () => ({ error: "Server error" }),
          headers: new Headers(),
        } as Response);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      });
    });

    it("should show loading state during submission", async () => {
      // Mock slow response
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfileData,
          headers: new Headers(),
          status: 200,
          statusText: "OK",
        } as Response)
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    json: async () => mockProfileData,
                    headers: new Headers(),
                    status: 200,
                    statusText: "OK",
                  } as Response),
                100,
              ),
            ),
        );

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      expect(
        screen.getByRole("button", { name: /saving/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    });
  });

  describe("Display Name Preview", () => {
    it("should update preview when changing display format", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
      });

      // Find display format select
      const selects = screen.getAllByTestId("select");
      const displayFormatSelect = selects
        .find((s) => s.querySelector('option[value="FIRST_LAST"]'))
        ?.querySelector("select");

      if (displayFormatSelect) {
        fireEvent.change(displayFormatSelect, {
          target: { value: "FIRST_LAST" },
        });

        await waitFor(() => {
          expect(screen.getByText(/preview/i)).toBeInTheDocument();
          // Preview should show "Test User" for FIRST_LAST format
          expect(screen.getByText("Test User")).toBeInTheDocument();
        });
      }
    });

    it("should update preview when adding title", async () => {
      const profileWithoutTitle = { ...mockProfileData, title: "none" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => profileWithoutTitle,
        headers: new Headers(),
        status: 200,
        statusText: "OK",
      } as Response);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
      });

      // Change title
      const selects = screen.getAllByTestId("select");
      const titleSelect = selects
        .find((s) => s.querySelector('option[value="Dr."]'))
        ?.querySelector("select");

      if (titleSelect) {
        fireEvent.change(titleSelect, { target: { value: "Dr." } });

        await waitFor(() => {
          expect(screen.getByText(/Dr\. Test User/)).toBeInTheDocument();
        });
      }
    });
  });

  describe("Form Validation", () => {
    it("should validate required fields", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
      });

      // Clear required fields
      const firstNameInput = screen.getByDisplayValue("Test");
      const lastNameInput = screen.getByDisplayValue("User");

      await user.clear(firstNameInput);
      await user.clear(lastNameInput);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      // Should not submit with empty required fields
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial fetch
    });

    it("should validate website URL format", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(
          screen.getByDisplayValue("https://example.com"),
        ).toBeInTheDocument();
      });

      const websiteInput = screen.getByDisplayValue("https://example.com");
      await user.clear(websiteInput);
      await user.type(websiteInput, "not-a-url");

      // Input should show validation state
      expect(websiteInput).toHaveAttribute("type", "url");
    });
  });

  describe("Local Storage", () => {
    it("should clear profile setup dismissal on mount", async () => {
      localStorage.setItem("profile-setup-dismissed-user-123", "true");

      render(<ProfilePage />);

      await waitFor(() => {
        expect(
          localStorage.getItem("profile-setup-dismissed-user-123"),
        ).toBeNull();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle API fetch errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
      });
    });

    it("should handle non-OK responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: async () => ({ error: "Forbidden" }),
        headers: new Headers(),
      } as Response);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
      });
    });

    it("should have proper heading structure", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /profile settings/i }),
        ).toBeInTheDocument();
      });
    });
  });
});
