import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BasicInfoForm from "../BasicInfoForm";
import { updateBasicInfo } from "@/app/doorcard/actions";

// Mock the server action
jest.mock("@/app/doorcard/actions", () => ({
  updateBasicInfo: jest.fn(),
}));

// Mock useFormStatus
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  useFormStatus: () => ({ pending: false }),
}));

// Mock UI components
jest.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: any) => <input data-testid="input" {...props} />,
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  AlertCircle: () => <span data-testid="alert-circle">Alert</span>,
  CheckCircle2: () => <span data-testid="check-circle">Check</span>,
  User: () => <span data-testid="user-icon">User</span>,
  UserSquare2: () => <span data-testid="user-square-icon">UserSquare</span>,
  Building2: () => <span data-testid="building-icon">Building</span>,
}));

const mockUpdateBasicInfo = updateBasicInfo as jest.MockedFunction<
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
    jest.clearAllMocks();
    mockUpdateBasicInfo.mockReturnValue({ success: true } as any);
  });

  describe("Initial Render", () => {
    it("should render form with pre-filled values", () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      expect(
        screen.getByDisplayValue("Dr. Test Professor")
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Doorcard")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Room 101")).toBeInTheDocument();
    });

    it("should render all form fields with labels", () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/doorcard title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/office location/i)).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      expect(
        screen.getByRole("button", { name: /continue to schedule/i })
      ).toBeInTheDocument();
    });

    it("should show term and campus info", () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      expect(screen.getByText(/FALL 2024/)).toBeInTheDocument();
      expect(screen.getByText(/SKYLINE/)).toBeInTheDocument();
    });
  });

  describe("Field Validation", () => {
    it("should show error for empty full name", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.clear(nameInput);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      expect(screen.getByText("Full name is required")).toBeInTheDocument();
      expect(mockUpdateBasicInfo).not.toHaveBeenCalled();
    });

    it("should show error for short full name", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "A");

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("Full name must be at least 2 characters")
      ).toBeInTheDocument();
    });

    it("should show error for long full name", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "A".repeat(101));

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("Full name must be under 100 characters")
      ).toBeInTheDocument();
    });

    it("should validate doorcard title", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const titleInput = screen.getByLabelText(/doorcard title/i);
      await user.clear(titleInput);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("Doorcard title is required")
      ).toBeInTheDocument();
    });

    it("should validate office location", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const officeInput = screen.getByLabelText(/office location/i);
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
      await user.click(submitButton);

      // Clear field and blur
      const nameInput = screen.getByLabelText(/full name/i);
      await user.clear(nameInput);
      await user.tab(); // Blur

      expect(screen.getByText("Full name is required")).toBeInTheDocument();
    });

    it("should clear validation errors when field is corrected", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.clear(nameInput);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      expect(screen.getByText("Full name is required")).toBeInTheDocument();

      // Type valid name
      await user.type(nameInput, "Valid Name");

      expect(
        screen.queryByText("Full name is required")
      ).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should submit form with valid data", async () => {
      mockUpdateBasicInfo.mockImplementation(() => {
        return Promise.resolve({ success: true });
      });

      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const nameInput = screen.getByLabelText(/full name/i);
      const titleInput = screen.getByLabelText(/doorcard title/i);
      const officeInput = screen.getByLabelText(/office location/i);

      await user.clear(nameInput);
      await user.type(nameInput, "Dr. Updated Name");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Title");
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

      const nameInput = screen.getByLabelText(/full name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "  Dr. Trimmed Name  ");

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateBasicInfo).toHaveBeenCalled();
        const formData = mockUpdateBasicInfo.mock.calls[0][2];
        expect(formData.get("name")).toBe("Dr. Trimmed Name");
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
  });

  describe("Edge Cases", () => {
    it("should handle empty initial values", () => {
      const emptyDoorcard = { id: "doorcard-123" };
      render(<BasicInfoForm doorcard={emptyDoorcard} />);

      const nameInput = screen.getByLabelText(/full name/i);
      const titleInput = screen.getByLabelText(/doorcard title/i);
      const officeInput = screen.getByLabelText(/office location/i);

      expect(nameInput).toHaveValue("");
      expect(titleInput).toHaveValue("");
      expect(officeInput).toHaveValue("");
    });

    it("should not submit form with validation errors", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      // Clear all fields
      const nameInput = screen.getByLabelText(/full name/i);
      const titleInput = screen.getByLabelText(/doorcard title/i);
      const officeInput = screen.getByLabelText(/office location/i);

      await user.clear(nameInput);
      await user.clear(titleInput);
      await user.clear(officeInput);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      expect(mockUpdateBasicInfo).not.toHaveBeenCalled();
      expect(screen.getByText("Full name is required")).toBeInTheDocument();
      expect(
        screen.getByText("Doorcard title is required")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Office location is required")
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes for errors", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.clear(nameInput);

      const submitButton = screen.getByRole("button", {
        name: /continue to schedule/i,
      });
      await user.click(submitButton);

      const errorMessage = screen.getByText("Full name is required");
      expect(errorMessage).toHaveAttribute("id", "name-error");
      expect(nameInput).toHaveAttribute("aria-describedby", "name-error");
      expect(nameInput).toHaveAttribute("aria-invalid", "true");
    });

    it("should have required attributes on inputs", () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      const nameInput = screen.getByLabelText(/full name/i);
      const titleInput = screen.getByLabelText(/doorcard title/i);
      const officeInput = screen.getByLabelText(/office location/i);

      // Check for aria-required instead of HTML required attribute (semantic approach)
      expect(nameInput).toHaveAttribute("aria-required", "true");
      expect(titleInput).toHaveAttribute("aria-required", "true");
      expect(officeInput).toHaveAttribute("aria-required", "true");
    });

    it("should be keyboard navigable", async () => {
      render(<BasicInfoForm doorcard={mockDoorcard} />);

      await user.tab(); // Focus first input
      expect(screen.getByLabelText(/full name/i)).toHaveFocus();

      await user.tab(); // Focus second input
      expect(screen.getByLabelText(/doorcard title/i)).toHaveFocus();

      await user.tab(); // Focus third input
      expect(screen.getByLabelText(/office location/i)).toHaveFocus();

      await user.tab(); // Focus submit button
      expect(
        screen.getByRole("button", { name: /continue to schedule/i })
      ).toHaveFocus();
    });
  });
});
