import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewDoorcardForm from "../NewDoorcardForm";
import { createDoorcardWithCampusTerm } from "@/app/doorcard/actions";
import React from "react";

// Dynamic year helper
const getCurrentYear = () => new Date().getFullYear();
const getNextYear = () => getCurrentYear() + 1;

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

// Get typed mock
const mockCreateDoorcardWithCampusTerm =
  createDoorcardWithCampusTerm as jest.MockedFunction<
    typeof createDoorcardWithCampusTerm
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
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateDoorcardWithCampusTerm).toHaveBeenCalledWith(
        { success: true }, // previous state
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
    await user.click(
      screen.getByRole("button", { name: /continue to basic info/i })
    );

    // Verify the server action was called with correct data
    await waitFor(() => {
      expect(mockCreateDoorcardWithCampusTerm).toHaveBeenCalled();
    });

    // Verify the form data contains expected values
    const callArgs = mockCreateDoorcardWithCampusTerm.mock.calls[0];
    expect(callArgs).toBeDefined();
    expect(callArgs[1]).toBeInstanceOf(FormData);
  });

  it("shows loading state during submission", async () => {
    // Make the action take time to resolve
    mockCreateDoorcardWithCampusTerm.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, doorcardId: "test" }), 100)
        )
    );

    render(<NewDoorcardForm />);

    // Fill out form quickly
    await selectOption(/campus/i, "SKYLINE");
    await selectOption(/term/i, "Fall");
    await selectOption(/year/i, getCurrentYear().toString());

    // Submit
    await user.click(
      screen.getByRole("button", { name: /continue to basic info/i })
    );

    // Check for loading state - submit button should be disabled during submission
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const submitButton = buttons.find(
        (btn) => btn.getAttribute("type") === "submit"
      );
      expect(submitButton).toBeDisabled();
    });

    // Wait for completion
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it("handles server errors gracefully", async () => {
    mockCreateDoorcardWithCampusTerm.mockResolvedValue({
      success: false,
      errors: ["A doorcard already exists for this campus, term, and year"],
    });

    render(<NewDoorcardForm />);

    // Fill and submit form
    await selectOption(/campus/i, "SKYLINE");
    await selectOption(/term/i, "Fall");
    await selectOption(/year/i, getCurrentYear().toString());

    await user.click(
      screen.getByRole("button", { name: /continue to basic info/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/doorcard already exists/i)).toBeInTheDocument();
    });

    // Should not navigate on error
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("prevents duplicate submissions", async () => {
    render(<NewDoorcardForm />);

    // Fill out form
    await selectOption(/campus/i, "SKYLINE");
    await selectOption(/term/i, "Fall");
    await selectOption(/year/i, getCurrentYear().toString());

    const submitButton = screen.getByRole("button", {
      name: /continue to basic info/i,
    });

    // Click multiple times rapidly
    await user.click(submitButton);
    await user.click(submitButton);
    await user.click(submitButton);

    // Should only be called once
    await waitFor(() => {
      expect(mockCreateDoorcardWithCampusTerm).toHaveBeenCalledTimes(1);
    });
  });

  it("clears validation errors when fields are corrected", async () => {
    render(<NewDoorcardForm />);

    // Submit with empty fields to show errors
    await user.click(
      screen.getByRole("button", { name: /continue to basic info/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/campus is required/i)).toBeInTheDocument();
    });

    // Select campus to clear error
    await selectOption(/campus/i, "SKYLINE");

    await waitFor(() => {
      expect(screen.queryByText(/campus is required/i)).not.toBeInTheDocument();
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
        const errorMessage = screen.getByText(/campus is required/i);
        expect(errorMessage).toHaveAttribute("role", "alert");
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
      mockCreateDoorcardWithCampusTerm.mockResolvedValue(undefined);

      render(<NewDoorcardForm />);

      // Fill and submit form
      await selectOption(/campus/i, "SKYLINE");
      await selectOption(/term/i, "Fall");
      await selectOption(/year/i, getCurrentYear().toString());

      await user.click(
        screen.getByRole("button", { name: /continue to basic info/i })
      );

      // Should handle gracefully without crashing
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /continue to basic info/i })
        ).not.toBeDisabled();
      });
    });

    it("handles network errors", async () => {
      mockCreateDoorcardWithCampusTerm.mockResolvedValue({
        success: false,
        message: "An error occurred",
      });

      render(<NewDoorcardForm />);

      // Fill and submit form
      await selectOption(/campus/i, "SKYLINE");
      await selectOption(/term/i, "Fall");
      await selectOption(/year/i, getCurrentYear().toString());

      await user.click(
        screen.getByRole("button", { name: /continue to basic info/i })
      );

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
      });
    });
  });
});
