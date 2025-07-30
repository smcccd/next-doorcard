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

  it("renders login form with OneLogin button", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /sign in to faculty doorcards/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with smccd onelogin/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/use your smccd credentials/i)).toBeInTheDocument();
  });

  it("handles OneLogin authentication", async () => {
    render(<LoginPage />);

    const oneLoginButton = screen.getByRole("button", {
      name: /sign in with smccd onelogin/i,
    });
    await user.click(oneLoginButton);

    expect(mockSignIn).toHaveBeenCalledWith("onelogin", {
      callbackUrl: "/dashboard",
      redirect: true,
    });
  });

  it("shows development credentials toggle in development mode", () => {
    process.env.NODE_ENV = "development";

    render(<LoginPage />);

    expect(
      screen.getByRole("button", { name: /show development login/i })
    ).toBeInTheDocument();
  });

  it("does not show development credentials in production", () => {
    process.env.NODE_ENV = "production";

    render(<LoginPage />);

    expect(
      screen.queryByRole("button", { name: /show development login/i })
    ).not.toBeInTheDocument();
  });

  describe("Development credentials form", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("shows credentials form when development toggle is clicked", async () => {
      render(<LoginPage />);

      const showCredentialsButton = screen.getByRole("button", {
        name: /show development login/i,
      });
      await user.click(showCredentialsButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /^sign in$/i })
        ).toBeInTheDocument();
      });
    });

    it("validates email format in development mode", async () => {
      render(<LoginPage />);

      // Show credentials form
      const showCredentialsButton = screen.getByRole("button", {
        name: /show development login/i,
      });
      await user.click(showCredentialsButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /^sign in$/i });

      await user.type(emailInput, "invalid-email");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("validates required fields in development mode", async () => {
      render(<LoginPage />);

      // Show credentials form
      const showCredentialsButton = screen.getByRole("button", {
        name: /show development login/i,
      });
      await user.click(showCredentialsButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /^sign in$/i })
        ).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: /^sign in$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("validates minimum password length in development mode", async () => {
      render(<LoginPage />);

      // Show credentials form
      const showCredentialsButton = screen.getByRole("button", {
        name: /show development login/i,
      });
      await user.click(showCredentialsButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /^sign in$/i });

      await user.type(emailInput, "test@smccd.edu");
      await user.type(passwordInput, "123"); // Too short
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 6 characters/i)
        ).toBeInTheDocument();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("submits valid credentials in development mode", async () => {
      render(<LoginPage />);

      // Show credentials form
      const showCredentialsButton = screen.getByRole("button", {
        name: /show development login/i,
      });
      await user.click(showCredentialsButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /^sign in$/i });

      await user.type(emailInput, "test@smccd.edu");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@smccd.edu",
        password: "password123",
        redirect: false,
      });
    });
  });

  describe("Error handling", () => {
    it("displays OneLogin authentication errors", async () => {
      mockSignIn.mockResolvedValueOnce({
        ok: false,
        error: "Authentication failed",
      } as any);

      render(<LoginPage />);

      const oneLoginButton = screen.getByRole("button", {
        name: /sign in with smccd onelogin/i,
      });
      await user.click(oneLoginButton);

      await waitFor(() => {
        expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
      });
    });

    it("displays credentials authentication errors in development mode", async () => {
      process.env.NODE_ENV = "development";
      mockSignIn.mockResolvedValueOnce({
        ok: false,
        error: "Invalid credentials",
      } as any);

      render(<LoginPage />);

      // Show credentials form
      const showCredentialsButton = screen.getByRole("button", {
        name: /show development login/i,
      });
      await user.click(showCredentialsButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /^sign in$/i });

      await user.type(emailInput, "test@smccd.edu");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Edge cases", () => {
    it("handles email trimming in development mode", async () => {
      process.env.NODE_ENV = "development";

      render(<LoginPage />);

      // Show credentials form
      const showCredentialsButton = screen.getByRole("button", {
        name: /show development login/i,
      });
      await user.click(showCredentialsButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /^sign in$/i });

      await user.type(emailInput, "  test@smccd.edu  ");
      await user.type(passwordInput, "password123");
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

      // Show credentials form
      const showCredentialsButton = screen.getByRole("button", {
        name: /show development login/i,
      });
      await user.click(showCredentialsButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /^sign in$/i });

      await user.type(emailInput, "test@smccd.edu");
      await user.type(passwordInput, "password123");

      // Click submit button multiple times
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only be called once
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });
});
