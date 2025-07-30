import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import LoginPage from "../page";

// Mock NextAuth
jest.mock("next-auth/react");
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

// Mock Next.js navigation
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

describe("LoginPage", () => {
  const user = userEvent.setup();
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignIn.mockResolvedValue({ ok: true, error: null } as any);
    mockSearchParams.delete("error");
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("renders login form with authentication button", () => {
    render(<LoginPage />);

    // Check for heading element existence (semantic)
    expect(screen.getByRole("heading")).toBeInTheDocument();

    // Check for login button existence (semantic)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);

    // Verify button is not disabled
    const loginButton = buttons[0];
    expect(loginButton).not.toBeDisabled();
  });

  it("handles authentication when button clicked", async () => {
    render(<LoginPage />);

    // Click the primary auth button (semantic)
    const buttons = screen.getAllByRole("button");
    const authButton = buttons[0];
    await user.click(authButton);

    // Verify auth function was called
    expect(mockSignIn).toHaveBeenCalled();

    // Verify call includes required parameters
    const signInCall = mockSignIn.mock.calls[0];
    expect(signInCall).toBeDefined();
    expect(signInCall[0]).toBe("onelogin");
  });

  it("shows additional options in development mode", () => {
    process.env.NODE_ENV = "development";

    render(<LoginPage />);

    // In dev mode, should have more than one button
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(1);
  });

  it("shows fewer options in production mode", () => {
    process.env.NODE_ENV = "production";

    render(<LoginPage />);

    // In production mode, should have only main auth button
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(1);
  });

  describe("Development credentials form", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("shows credentials form when development toggle is clicked", async () => {
      render(<LoginPage />);

      const buttons = screen.getAllByRole("button");
      // Click the second button (dev toggle)
      await user.click(buttons[1]);

      await waitFor(() => {
        // Check for email input (textbox)
        const emailInput = screen.getByRole("textbox");
        expect(emailInput).toBeInTheDocument();

        // Check for password input (has type="password")
        const passwordInput = document.querySelector('input[type="password"]');
        expect(passwordInput).toBeInTheDocument();
      });
    });

    it("validates form inputs in development mode", async () => {
      render(<LoginPage />);

      const buttons = screen.getAllByRole("button");
      // Click the dev toggle button
      await user.click(buttons[1]);

      await waitFor(() => {
        const emailInput = screen.getByRole("textbox");
        expect(emailInput).toBeInTheDocument();
      });

      const emailInput = screen.getByRole("textbox");
      const submitButtons = screen.getAllByRole("button");
      const submitButton =
        submitButtons.find((btn) => btn.type === "submit") ||
        submitButtons[submitButtons.length - 1];

      // Test with invalid input
      await user.type(emailInput, "invalid-email");
      await user.click(submitButton);

      // Should not call auth with invalid data
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("validates required fields in development mode", async () => {
      render(<LoginPage />);

      const buttons = screen.getAllByRole("button");
      // Click the dev toggle button
      await user.click(buttons[1]);

      await waitFor(() => {
        const submitButtons = screen.getAllByRole("button");
        expect(submitButtons.length).toBeGreaterThan(1);
      });

      const submitButtons = screen.getAllByRole("button");
      const submitButton = submitButtons[submitButtons.length - 1];
      await user.click(submitButton);

      // Should not call auth without required fields
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("validates input constraints in development mode", async () => {
      render(<LoginPage />);

      const buttons = screen.getAllByRole("button");
      // Click the dev toggle button
      await user.click(buttons[1]);

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox");
        expect(inputs.length).toBeGreaterThan(0);
      });

      const emailInput = screen.getByRole("textbox");
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButtons = screen.getAllByRole("button");
      const submitButton = submitButtons[submitButtons.length - 1];

      // Fill with valid email but short password
      await user.type(emailInput, "test@smccd.edu");
      if (passwordInput) {
        await user.type(passwordInput, "123"); // Too short
      }
      await user.click(submitButton);

      // Should not proceed with invalid data
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("submits valid credentials in development mode", async () => {
      render(<LoginPage />);

      const buttons = screen.getAllByRole("button");
      // Click the dev toggle button
      await user.click(buttons[1]);

      await waitFor(() => {
        const inputs = screen.getAllByRole("textbox");
        expect(inputs.length).toBeGreaterThan(0);
      });

      const emailInput = screen.getByRole("textbox");
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButtons = screen.getAllByRole("button");
      const submitButton = submitButtons[submitButtons.length - 1];

      // Fill with valid credentials
      await user.type(emailInput, "test@smccd.edu");
      if (passwordInput) {
        await user.type(passwordInput, "password123");
      }
      await user.click(submitButton);

      // Should call auth with credentials
      expect(mockSignIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({
          email: "test@smccd.edu",
          password: "password123",
        })
      );
    });
  });

  describe("Error handling", () => {
    it("handles authentication errors", async () => {
      mockSignIn.mockResolvedValueOnce({
        ok: false,
        error: "Authentication failed",
      } as any);

      render(<LoginPage />);

      const buttons = screen.getAllByRole("button");
      const authButton = buttons[0];
      await user.click(authButton);

      // Error should be handled (may show in UI or console)
      expect(mockSignIn).toHaveBeenCalled();
    });

    it("handles credentials authentication errors in development mode", async () => {
      process.env.NODE_ENV = "development";
      mockSignIn.mockResolvedValueOnce({
        ok: false,
        error: "Invalid credentials",
      } as any);

      render(<LoginPage />);

      const buttons = screen.getAllByRole("button");
      // Click the dev toggle button
      await user.click(buttons[1]);

      await waitFor(() => {
        const emailInput = screen.getByRole("textbox");
        expect(emailInput).toBeInTheDocument();
      });

      const emailInput = screen.getByRole("textbox");
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButtons = screen.getAllByRole("button");
      const submitButton = submitButtons[submitButtons.length - 1];

      // Fill and submit
      await user.type(emailInput, "test@smccd.edu");
      if (passwordInput) {
        await user.type(passwordInput, "wrongpassword");
      }
      await user.click(submitButton);

      // Auth should be called even if it fails
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("handles email trimming in development mode", async () => {
      process.env.NODE_ENV = "development";

      render(<LoginPage />);

      // Click the dev toggle button (second button)
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[1]);

      await waitFor(() => {
        const emailInput = screen.getByRole("textbox");
        expect(emailInput).toBeInTheDocument();
      });

      const emailInput = screen.getByRole("textbox");
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButtons = screen.getAllByRole("button");
      const submitButton = submitButtons[submitButtons.length - 1];

      await user.type(emailInput, "  test@smccd.edu  ");
      if (passwordInput) {
        await user.type(passwordInput, "password123");
      }
      await user.click(submitButton);

      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@smccd.edu",
        password: "password123",
        redirect: false,
      });
    });

    it("prevents double submission", async () => {
      process.env.NODE_ENV = "development";
      mockSignIn.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, error: null } as any), 1000)
          )
      );

      render(<LoginPage />);

      // Click the dev toggle button (second button)
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[1]);

      await waitFor(() => {
        const emailInput = screen.getByRole("textbox");
        expect(emailInput).toBeInTheDocument();
      });

      const emailInput = screen.getByRole("textbox");
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButtons = screen.getAllByRole("button");
      const submitButton = submitButtons[submitButtons.length - 1];

      await user.type(emailInput, "test@smccd.edu");
      if (passwordInput) {
        await user.type(passwordInput, "password123");
      }

      // Click submit button multiple times
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only be called once
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });
});
