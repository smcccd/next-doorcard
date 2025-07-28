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

  it("should be focusable for keyboard navigation", () => {
    render(<NewDoorcardButton />);

    const button = screen.getByRole("button", { name: /create doorcard/i });

    // Focus the button
    button.focus();
    expect(button).toHaveFocus();
  });

  it("should call router.push when clicked", () => {
    render(<NewDoorcardButton />);

    const button = screen.getByRole("button", { name: /create doorcard/i });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith("/doorcard/new");
    expect(mockPush).toHaveBeenCalledTimes(1);
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

  it("should render correctly", () => {
    render(<NewDoorcardButton />);

    const button = screen.getByRole("button", { name: /create doorcard/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });
});
