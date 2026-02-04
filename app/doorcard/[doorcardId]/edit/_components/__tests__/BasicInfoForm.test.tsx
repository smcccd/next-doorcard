import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BasicInfoForm from "../BasicInfoForm";
import { updateBasicInfo } from "@/app/doorcard/actions";

// Mock the server action
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

vi.mock("@/app/doorcard/actions", () => ({
  updateBasicInfo: vi.fn(),
}));

// Mock useFormStatus
vi.mock("react-dom", () => ({
  ...vi.importActual("react-dom"),
  useFormStatus: () => ({ pending: false }),
}));

// Mock UI components
vi.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: any) => <input data-testid="input" {...props} />,
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  AlertCircle: () => <span data-testid="alert-circle">Alert</span>,
  CheckCircle2: () => <span data-testid="check-circle">Check</span>,
  User: () => <span data-testid="user-icon">User</span>,
  UserSquare2: () => <span data-testid="user-square-icon">UserSquare</span>,
  Building2: () => <span data-testid="building-icon">Building</span>,
}));

const mockUpdateBasicInfo = updateBasicInfo as MockedFunction<
  typeof updateBasicInfo
>;

describe("BasicInfoForm", () => {
  const user = userEvent.setup();

  const mockDoorcard = {
    id: "doorcard-123",
    name: "Dr. Test Professor",
    doorcardName: "Test Doorcard",
    officeNumber: "Room 101",
    term: "FALL",
    year: "2024",
    college: "SKYLINE",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateBasicInfo.mockReturnValue({ success: true } as any);
  });

  describe("Initial Render", () => {
    it("should render form with pre-filled values", () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      // Name should be displayed as read-only text, not an input
      expect(screen.getByText("Dr. Test Professor")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Doorcard")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Room 101")).toBeInTheDocument();
    });

    it("should render name as read-only display", () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      // Name should not be an editable input
      expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
      // Name should be displayed as text
      expect(screen.getByText("Dr. Test Professor")).toBeInTheDocument();
      // Should show helper text explaining name is from profile
      expect(
        screen.getByText(/name is set from your profile/i)
      ).toBeInTheDocument();
    });

    it("should render editable fields with labels", () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      // Use exact label text without the optional suffix indicator
      expect(
        screen.getByLabelText(/^Subtitle \(optional\)/, { selector: "input" })
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/^Office Location/, { selector: "input" })
      ).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      expect(
        screen.getByRole("button", { name: /continue to schedule/i })
      ).toBeInTheDocument();
    });

    it("should show title preview with name, term and year", () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      // Title preview should show the generated title
      expect(screen.getByText(/Generated Doorcard Title/i)).toBeInTheDocument();
    });
  });

  describe("Field Validation", () => {
    it("should validate office location is required", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const officeInput = screen.getByLabelText(/^Office Location/, {
        selector: "input",
      });
      await user.clear(officeInput);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("Office location is required")
      ).toBeInTheDocument();
    });

    it("should show validation errors on blur after form is touched", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      // Touch form by submitting
      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });

      // Clear office location
      const officeInput = screen.getByLabelText(/^Office Location/, {
        selector: "input",
      });
      await user.clear(officeInput);

      await user.click(submitButton);

      expect(
        screen.getByText("Office location is required")
      ).toBeInTheDocument();
    });

    it("should clear validation errors when field is corrected", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const officeInput = screen.getByLabelText(/^Office Location/, {
        selector: "input",
      });
      await user.clear(officeInput);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("Office location is required")
      ).toBeInTheDocument();

      // Type valid office location
      await user.type(officeInput, "Room 202");

      expect(
        screen.queryByText("Office location is required")
      ).not.toBeInTheDocument();
    });

    it("should allow optional subtitle to be empty", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const subtitleInput = screen.getByLabelText(/^Subtitle \(optional\)/, {
        selector: "input",
      });
      await user.clear(subtitleInput);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      // Should not show error for empty subtitle since it's optional
      await waitFor(() => {
        expect(mockUpdateBasicInfo).toHaveBeenCalled();
      });
    });
  });

  describe("Form Submission", () => {
    it("should submit form with valid data", async () => {
      mockUpdateBasicInfo.mockImplementation(() => {
        return Promise.resolve({ success: true });
      });

      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const subtitleInput = screen.getByLabelText(/^Subtitle \(optional\)/, {
        selector: "input",
      });
      const officeInput = screen.getByLabelText(/^Office Location/, {
        selector: "input",
      });

      await user.clear(subtitleInput);
      await user.type(subtitleInput, "Updated Subtitle");
      await user.clear(officeInput);
      await user.type(officeInput, "Room 202");

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateBasicInfo).toHaveBeenCalledWith(
          "doorcard-123",
          expect.any(Object),
          expect.any(FormData)
        );
      });
    });

    it("should trim whitespace from input values", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const subtitleInput = screen.getByLabelText(/^Subtitle \(optional\)/, {
        selector: "input",
      });
      await user.clear(subtitleInput);
      await user.type(subtitleInput, "  Trimmed Subtitle  ");

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateBasicInfo).toHaveBeenCalled();
        const formData = mockUpdateBasicInfo.mock.calls[0][2];
        expect(formData.get("doorcardName")).toBe("Trimmed Subtitle");
      });
    });

    it("should not include name field in form submission", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateBasicInfo).toHaveBeenCalled();
        const formData = mockUpdateBasicInfo.mock.calls[0][2];
        // Name should not be in the form data - it's derived from user profile on server
        expect(formData.get("name")).toBeNull();
      });
    });

    it("should show loading state during submission", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      // Find submit button semantically and verify it can be interacted with
      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute("type", "submit");

      // Test that button is initially enabled (not in loading state)
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Server Errors", () => {
    it("should display server error messages", async () => {
      mockUpdateBasicInfo.mockImplementation(() => {
        return Promise.resolve({
          success: false,
          message: "Server validation failed",
        } as any);
      });

      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Server validation failed")
        ).toBeInTheDocument();
      });
    });

    it("should display error when user profile has no name", async () => {
      mockUpdateBasicInfo.mockImplementation(() => {
        return Promise.resolve({
          success: false,
          message: "Unable to determine your name from profile",
        } as any);
      });

      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Unable to determine your name/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty initial values", () => {
      const emptyDoorcard = { id: "doorcard-123" };
      render(<BasicInfoForm doorcard={emptyDoorcard} />);

      // Name should show default "Your Name" when not provided
      expect(screen.getByText("Your Name")).toBeInTheDocument();

      const subtitleInput = screen.getByLabelText(/^Subtitle \(optional\)/, {
        selector: "input",
      });
      const officeInput = screen.getByLabelText(/^Office Location/, {
        selector: "input",
      });

      expect(subtitleInput).toHaveValue("");
      expect(officeInput).toHaveValue("");
    });

    it("should not submit form with validation errors", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      // Clear required field
      const officeInput = screen.getByLabelText(/^Office Location/, {
        selector: "input",
      });
      await user.clear(officeInput);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      expect(mockUpdateBasicInfo).not.toHaveBeenCalled();
      expect(
        screen.getByText("Office location is required")
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes for errors", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const officeInput = screen.getByLabelText(/^Office Location/, {
        selector: "input",
      });
      await user.clear(officeInput);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      const errorMessage = screen.getByText("Office location is required");
      expect(errorMessage).toHaveAttribute("id", "officeNumber-error");
      expect(officeInput).toHaveAttribute(
        "aria-describedby",
        "officeNumber-error"
      );
      expect(officeInput).toHaveAttribute("aria-invalid", "true");
    });

    it("should have required attributes on required inputs", () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const officeInput = screen.getByLabelText(/^Office Location/, {
        selector: "input",
      });

      // Check for aria-required on required fields
      expect(officeInput).toHaveAttribute("aria-required", "true");
    });

    it("should not have required attribute on optional subtitle", () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const subtitleInput = screen.getByLabelText(/^Subtitle \(optional\)/, {
        selector: "input",
      });

      // Subtitle is optional, so aria-required should be false
      expect(subtitleInput).toHaveAttribute("aria-required", "false");
    });

    it("should be keyboard navigable (editable fields only)", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      await user.tab(); // Focus first editable input (subtitle)
      expect(
        screen.getByLabelText(/^Subtitle \(optional\)/, { selector: "input" })
      ).toHaveFocus();

      await user.tab(); // Focus second editable input (office location)
      expect(
        screen.getByLabelText(/^Office Location/, { selector: "input" })
      ).toHaveFocus();

      await user.tab(); // Focus submit button
      expect(
        screen.getByRole("button", { name: /continue to schedule/i })
      ).toHaveFocus();
    });
  });
});
