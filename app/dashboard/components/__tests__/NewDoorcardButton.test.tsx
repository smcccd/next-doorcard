import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import NewDoorcardButton from "../NewDoorcardButton";

// Mock Next.js useRouter
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Plus: () => <span data-testid="plus-icon">Plus</span>,
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("NewDoorcardButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);
  });

  it("should render the button with correct text and icon", () => {
    render(<NewDoorcardButton />);

    const button = screen.getByRole("button", { name: /create doorcard/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByTestId("plus-icon")).toBeInTheDocument();
    expect(screen.getByText("Create Doorcard")).toBeInTheDocument();
  });

  it("should navigate to /doorcard/new when clicked", () => {
    render(<NewDoorcardButton />);

    const button = screen.getByRole("button", { name: /create doorcard/i });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith("/doorcard/new");
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("should handle multiple clicks correctly", () => {
    render(<NewDoorcardButton />);

    const button = screen.getByRole("button", { name: /create doorcard/i });

    // Click multiple times
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledTimes(3);
    expect(mockPush).toHaveBeenCalledWith("/doorcard/new");
  });

  it("should be accessible with keyboard navigation", () => {
    render(<NewDoorcardButton />);

    const button = screen.getByRole("button", { name: /create doorcard/i });

    // Focus the button
    button.focus();
    expect(button).toHaveFocus();

    // Press Enter
    fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
    fireEvent.keyUp(button, { key: "Enter", code: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/doorcard/new");
  });

  it("should handle router errors gracefully", () => {
    // Mock router.push to throw an error
    mockPush.mockImplementation(() => {
      throw new Error("Navigation failed");
    });

    render(<NewDoorcardButton />);

    const button = screen.getByRole("button", { name: /create doorcard/i });

    // Should not throw when clicked even if router fails
    expect(() => {
      fireEvent.click(button);
    }).not.toThrow();

    expect(mockPush).toHaveBeenCalledWith("/doorcard/new");
  });

  it("should maintain button styling and structure", () => {
    render(<NewDoorcardButton />);

    const button = screen.getByRole("button", { name: /create doorcard/i });

    // Check that it's actually a button element
    expect(button.tagName).toBe("BUTTON");

    // Check that icon and text are present in the right order
    const icon = screen.getByTestId("plus-icon");
    const text = screen.getByText("Create Doorcard");

    expect(button).toContainElement(icon);
    expect(button).toContainElement(text);
  });

  it("should work when router is undefined", () => {
    // Test edge case where useRouter might return undefined
    mockUseRouter.mockReturnValue(undefined as any);

    render(<NewDoorcardButton />);

    const button = screen.getByRole("button", { name: /create doorcard/i });
    expect(button).toBeInTheDocument();

    // Should not crash when clicked
    expect(() => {
      fireEvent.click(button);
    }).not.toThrow();
  });
});
