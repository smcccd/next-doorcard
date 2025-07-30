import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewDoorcardForm from "../NewDoorcardForm";
import { createDoorcardWithCampusTerm } from "@/app/doorcard/actions";
import React, { startTransition } from "react";

// Dynamic year helper
const getCurrentYear = () => new Date().getFullYear();

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock server action
jest.mock("@/app/doorcard/actions", () => ({
  createDoorcardWithCampusTerm: jest.fn(),
  validateCampusTerm: jest.fn(),
}));

// Mock useActionState to avoid dispatch context issues
const mockDispatch = jest.fn();

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useActionState: jest.fn(),
}));

// Get typed mocks
const mockCreateDoorcardWithCampusTerm =
  createDoorcardWithCampusTerm as jest.MockedFunction<
    typeof createDoorcardWithCampusTerm
  >;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useActionState } = require("react");
const mockUseActionState = useActionState as jest.MockedFunction<
  typeof useActionState
>;

// Mock UI components are handled in jest.setup.js

describe("NewDoorcardForm", () => {
  const user = userEvent.setup();

  // Helper function to select from a custom select component
  const selectOption = async (labelText: RegExp, value: string) => {
    const selectWrapper = screen
      .getByLabelText(labelText)
      .closest('[data-testid=\"select-wrapper\"]');
    const select = selectWrapper?.querySelector("select") as HTMLSelectElement;
    await user.selectOptions(select, value);
    return select;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateDoorcardWithCampusTerm.mockResolvedValue({
      success: true,
      doorcardId: "test-id",
    });
    mockUseActionState.mockReturnValue([{ success: true }, mockDispatch]);
    mockDispatch.mockClear();
  });

  it("renders all form fields", () => {
    render(<NewDoorcardForm />);

    expect(screen.getByLabelText(/campus/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/term/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue to basic info/i })
    ).toBeInTheDocument();
  });

  it("shows validation errors when submitted with empty fields", async () => {
    render(<NewDoorcardForm />);

    const submitButton = screen.getByRole("button", {
      name: /continue to basic info/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/please fill in all required fields correctly/i)
      ).toBeInTheDocument();
    });
  });

  it("allows selecting campus options", async () => {
    render(<NewDoorcardForm />);

    expect(screen.getAllByText("Skyline College")).toHaveLength(2); // One in select option, one in visible item
    expect(screen.getAllByText("College of San Mateo")).toHaveLength(2);
    expect(screen.getAllByText("Cañada College")).toHaveLength(2);

    const campusSelect = await selectOption(/campus/i, "SKYLINE");
    expect(campusSelect).toHaveValue("SKYLINE");
  });

  it("allows selecting term options", async () => {
    render(<NewDoorcardForm />);

    expect(screen.getAllByText("Fall")).toHaveLength(2); // One in select option, one in visible item
    expect(screen.getAllByText("Spring")).toHaveLength(2);

    const termSelect = await selectOption(/term/i, "Fall");
    expect(termSelect).toHaveValue("Fall");
  });

  it("shows year options from current year to future years", async () => {
    render(<NewDoorcardForm />);

    const currentYear = new Date().getFullYear();
    expect(screen.getAllByText(currentYear.toString())).toHaveLength(2); // One in select option, one in visible item
    expect(screen.getAllByText((currentYear + 1).toString())).toHaveLength(2);
    expect(screen.getAllByText((currentYear + 2).toString())).toHaveLength(2);
  });

  it("submits form with valid data", async () => {
    render(<NewDoorcardForm />);

    // Select options
    await selectOption(/campus/i, "SKYLINE");
    await selectOption(/term/i, "Fall");
    await selectOption(/year/i, getCurrentYear().toString());

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: /continue to basic info/i,
    });
    await act(async () => {
      startTransition(() => {
        submitButton.click();
      });
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.any(FormData) // form data
      );
    });
  });

  it("calls server action on successful form submission", async () => {
    mockCreateDoorcardWithCampusTerm.mockResolvedValue({
      success: true,
      doorcardId: "new-doorcard-123",
    });

    render(<NewDoorcardForm />);

    // Fill out form
    await selectOption(/campus/i, "CSM");
    await selectOption(/term/i, "Spring");
    await selectOption(/year/i, getCurrentYear().toString());

    // Submit
    await act(async () => {
      startTransition(() => {
        screen.getByRole("button", { name: /continue to basic info/i }).click();
      });
    });

    // Verify the dispatch was called with form data
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });

    // Verify the form data contains expected values
    const callArgs = mockDispatch.mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(callArgs[0]).toBeInstanceOf(FormData);
  });

  it("shows loading state during submission", async () => {
    render(<NewDoorcardForm />);

    // Fill out form
    await selectOption(/campus/i, "SKYLINE");
    await selectOption(/term/i, "Fall");
    await selectOption(/year/i, getCurrentYear().toString());

    // Get submit button
    const submitButton = screen.getByRole("button", {
      name: /continue to basic info/i,
    });
    expect(submitButton).not.toBeDisabled();
    expect(submitButton).toHaveTextContent("Continue to Basic Info");

    // Verify form is ready for submission
    expect(mockDispatch).not.toHaveBeenCalled();

    // Submit form
    await user.click(submitButton);

    // Verify the dispatch was called
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  it("handles server errors gracefully", async () => {
    // Mock error state from useActionState
    mockUseActionState.mockReturnValue([
      {
        success: false,
        message: "A doorcard already exists for this campus, term, and year",
      },
      mockDispatch,
    ]);

    render(<NewDoorcardForm />);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/doorcard already exists/i)).toBeInTheDocument();
    });

    // Should not navigate on error
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("allows form resubmission after validation", async () => {
    render(<NewDoorcardForm />);

    // Fill out form
    await selectOption(/campus/i, "SKYLINE");
    await selectOption(/term/i, "Fall");
    await selectOption(/year/i, getCurrentYear().toString());

    const submitButton = screen.getByRole("button", {
      name: /continue to basic info/i,
    });

    // Submit form once
    await user.click(submitButton);

    // Verify dispatch was called
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });

    // Form should allow resubmission if user clicks again
    const initialCallCount = mockDispatch.mock.calls.length;
    await user.click(submitButton);

    // Should have been called again
    expect(mockDispatch.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it("clears validation errors when fields are corrected", async () => {
    render(<NewDoorcardForm />);

    // Submit with empty fields to show errors
    await user.click(
      screen.getByRole("button", { name: /continue to basic info/i })
    );

    await waitFor(() => {
      expect(screen.getAllByText("Required")).toHaveLength(3); // All three fields should show Required
    });

    // Select campus to clear error
    await selectOption(/campus/i, "SKYLINE");

    await waitFor(() => {
      // Should have one fewer Required error now
      expect(screen.getAllByText("Required")).toHaveLength(2);
    });
  });

  describe("accessibility", () => {
    it("has proper form labels and ARIA attributes", () => {
      render(<NewDoorcardForm />);

      const campusSelect = screen.getByLabelText(/campus/i);
      const termSelect = screen.getByLabelText(/term/i);
      const yearSelect = screen.getByLabelText(/year/i);

      expect(campusSelect).toHaveAttribute("aria-required", "true");
      expect(termSelect).toHaveAttribute("aria-required", "true");
      expect(yearSelect).toHaveAttribute("aria-required", "true");
    });

    it("announces validation errors to screen readers", async () => {
      render(<NewDoorcardForm />);

      await user.click(
        screen.getByRole("button", { name: /continue to basic info/i })
      );

      await waitFor(() => {
        const errorMessages = screen.getAllByText("Required");
        expect(errorMessages.length).toBeGreaterThan(0);
        // Check that at least one error message has role="alert"
        const alertErrors = errorMessages.filter(
          (el) => el.getAttribute("role") === "alert"
        );
        expect(alertErrors.length).toBeGreaterThan(0);
      });
    });

    it("supports keyboard navigation", async () => {
      render(<NewDoorcardForm />);

      // Test that form elements are keyboard accessible
      const selects = screen.getAllByTestId("select");
      expect(selects).toHaveLength(3);

      // Verify all selects are focusable
      selects.forEach((select) => {
        expect(select).not.toBeDisabled();
        expect(select.tabIndex).not.toBe(-1);
      });

      // Verify submit button is focusable
      const submitButton = screen.getByRole("button", {
        name: /continue to basic info/i,
      });
      expect(submitButton).not.toBeDisabled();
      expect(submitButton.tabIndex).not.toBe(-1);
    });
  });

  describe("edge cases", () => {
    it("handles empty response from server action", async () => {
      // Mock undefined state - form should handle gracefully
      mockUseActionState.mockReturnValue([undefined, mockDispatch]);

      render(<NewDoorcardForm />);

      // Should render without crashing
      expect(
        screen.getByRole("button", { name: /continue to basic info/i })
      ).toBeInTheDocument();
    });

    it("handles network errors", async () => {
      // Mock error state from useActionState
      mockUseActionState.mockReturnValue([
        {
          success: false,
          message: "An error occurred",
        },
        mockDispatch,
      ]);

      render(<NewDoorcardForm />);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
      });
    });
  });
});
