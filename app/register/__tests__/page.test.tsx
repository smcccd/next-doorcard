import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

import RegisterPage from "../page";

// Mock the router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock UI components
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children, className }: any) => (
    <h1 className={className}>{children}</h1>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ onChange, value, ...props }: any) => (
    <input
      {...props}
      value={value}
      onChange={onChange}
      data-testid={`input-${props.name || props.id}`}
    />
  ),
}));

// Mock fetch
global.fetch = vi.fn() as MockedFunction<typeof fetch>;

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as MockedFunction<typeof fetch>).mockClear();
  });

  it("renders the registration form", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", { name: "Register" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Register" })
    ).toBeInTheDocument();
  });

  it("updates input values when typing", () => {
    render(<RegisterPage />);

    const nameInput = screen.getByTestId("input-name") as HTMLInputElement;
    const emailInput = screen.getByTestId("input-email") as HTMLInputElement;
    const passwordInput = screen.getByTestId(
      "input-password"
    ) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(nameInput.value).toBe("John Doe");
    expect(emailInput.value).toBe("john@example.com");
    expect(passwordInput.value).toBe("password123");
  });

  it("submits form with correct data on successful registration", async () => {
    (fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<RegisterPage />);

    // Fill out the form
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByTestId("input-email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByTestId("input-password"), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    // Wait for the API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        }),
      });
    });

    // Check success toast and navigation
    expect(mockToast).toHaveBeenCalledWith({
      title: "Success",
      description: "Account created successfully. Please log in.",
    });
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("shows error toast on registration failure", async () => {
    const errorMessage = "Email already exists";
    (fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: errorMessage }),
    } as Response);

    render(<RegisterPage />);

    // Fill out the form
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByTestId("input-email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByTestId("input-password"), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    // Wait for the API call and error handling
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    });

    // Should not navigate on error
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows generic error message when no specific message provided", async () => {
    (fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(<RegisterPage />);

    // Fill out the form
    fireEvent.change(screen.getByTestId("input-name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByTestId("input-email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByTestId("input-password"), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    // Wait for the API call and error handling
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong",
      });
    });
  });

  it("prevents form submission when required fields are empty", () => {
    render(<RegisterPage />);

    const nameInput = screen.getByTestId("input-name") as HTMLInputElement;
    const emailInput = screen.getByTestId("input-email") as HTMLInputElement;
    const passwordInput = screen.getByTestId(
      "input-password"
    ) as HTMLInputElement;

    // Verify required attributes are set
    expect(nameInput.required).toBe(true);
    expect(emailInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
  });

  it("sets correct input types", () => {
    render(<RegisterPage />);

    const emailInput = screen.getByTestId("input-email") as HTMLInputElement;
    const passwordInput = screen.getByTestId(
      "input-password"
    ) as HTMLInputElement;

    expect(emailInput.type).toBe("email");
    expect(passwordInput.type).toBe("password");
  });
});
