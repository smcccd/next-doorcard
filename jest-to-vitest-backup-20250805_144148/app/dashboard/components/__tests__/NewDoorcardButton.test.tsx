import { render, screen } from "@testing-library/react";
import NewDoorcardButton from "../NewDoorcardButton";

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Plus: () => <span data-testid="plus-icon">Plus</span>,
}));

describe("NewDoorcardButton", () => {
  it("should render as a link with button styling", () => {
    render(<NewDoorcardButton />);

    const link = screen.getByRole("link", { name: /create doorcard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/doorcard/new");
    expect(screen.getByTestId("plus-icon")).toBeInTheDocument();
    expect(screen.getByText("Create Doorcard")).toBeInTheDocument();
  });

  it("should have correct href attribute", () => {
    render(<NewDoorcardButton />);

    const link = screen.getByRole("link", { name: /create doorcard/i });
    expect(link).toHaveAttribute("href", "/doorcard/new");
  });

  it("should be focusable for keyboard navigation", () => {
    render(<NewDoorcardButton />);

    const link = screen.getByRole("link", { name: /create doorcard/i });

    // Focus the link
    link.focus();
    expect(link).toHaveFocus();
  });

  it("should maintain button styling and structure", () => {
    render(<NewDoorcardButton />);

    const link = screen.getByRole("link", { name: /create doorcard/i });

    // Check that icon and text are present
    const icon = screen.getByTestId("plus-icon");
    const text = screen.getByText("Create Doorcard");

    expect(link).toContainElement(icon);
    expect(link).toContainElement(text);
  });

  it("should have data-testid for testing", () => {
    render(<NewDoorcardButton />);

    const element = screen.getByTestId("create-doorcard-button");
    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute("href", "/doorcard/new");
  });
});
