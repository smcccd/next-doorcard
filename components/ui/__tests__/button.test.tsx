import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button", () => {
  const user = userEvent.setup();

  it("renders with default props", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary text-primary-foreground");
  });

  it("renders all button variants", () => {
    const variants = [
      { variant: "default" as const, expectedClass: "bg-primary" },
      { variant: "destructive" as const, expectedClass: "bg-destructive" },
      { variant: "outline" as const, expectedClass: "border border-input" },
      { variant: "secondary" as const, expectedClass: "bg-secondary" },
      { variant: "ghost" as const, expectedClass: "hover:bg-accent" },
      {
        variant: "link" as const,
        expectedClass: "text-primary underline-offset-4",
      },
    ];

    variants.forEach(({ variant, expectedClass }) => {
      render(<Button variant={variant}>Test {variant}</Button>);
      const button = screen.getByRole("button", {
        name: new RegExp(`test ${variant}`, "i"),
      });
      expect(button).toHaveClass(expectedClass);
    });
  });

  it("renders all button sizes", () => {
    const sizes = [
      { size: "default" as const, expectedClass: "h-11 px-4 py-2" }, // Updated to 44px
      { size: "sm" as const, expectedClass: "h-11 rounded-md px-3" }, // Updated to 44px
      { size: "lg" as const, expectedClass: "h-12 rounded-md px-8" }, // Updated to 48px
      { size: "icon" as const, expectedClass: "h-11 w-11" }, // Updated to 44px x 44px
    ];

    sizes.forEach(({ size, expectedClass }) => {
      render(<Button size={size}>Test {size}</Button>);
      const button = screen.getByRole("button", {
        name: new RegExp(`test ${size}`, "i"),
      });
      expect(button).toHaveClass(expectedClass);
    });
  });

  it("handles click events", async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("can be disabled", () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled button
      </Button>
    );

    const button = screen.getByRole("button", { name: /disabled button/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass(
      "disabled:pointer-events-none disabled:opacity-50"
    );
  });

  it("does not trigger click when disabled", async () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled button
      </Button>
    );

    const button = screen.getByRole("button", { name: /disabled button/i });
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("forwards ref correctly", () => {
    const ref = jest.fn();
    render(<Button ref={ref}>Button with ref</Button>);

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom button</Button>);

    const button = screen.getByRole("button", { name: /custom button/i });
    expect(button).toHaveClass("custom-class");
    expect(button).toHaveClass("bg-primary"); // Should still have default classes
  });

  it("renders as different element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link button</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
    expect(link).toHaveClass("bg-primary"); // Should have button styles
  });

  it("supports keyboard navigation", async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Keyboard button</Button>);

    const button = screen.getByRole("button", { name: /keyboard button/i });
    button.focus();
    expect(button).toHaveFocus();

    // Press Enter
    await user.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(1);

    // Press Space
    await user.keyboard(" ");
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it("accepts HTML button attributes", () => {
    render(
      <Button
        type="submit"
        form="my-form"
        aria-label="Submit form"
        data-testid="submit-button"
      >
        Submit
      </Button>
    );

    const button = screen.getByRole("button", { name: /submit/i });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("form", "my-form");
    expect(button).toHaveAttribute("aria-label", "Submit form");
    expect(button).toHaveAttribute("data-testid", "submit-button");
  });

  describe("variant combinations", () => {
    it("combines variant and size classes correctly", () => {
      render(
        <Button variant="outline" size="lg">
          Large outline
        </Button>
      );

      const button = screen.getByRole("button", { name: /large outline/i });
      expect(button).toHaveClass("border border-input"); // outline variant
      expect(button).toHaveClass("h-12 rounded-md px-8"); // lg size
    });

    it("destructive variant with small size", () => {
      render(
        <Button variant="destructive" size="sm">
          Small destructive
        </Button>
      );

      const button = screen.getByRole("button", { name: /small destructive/i });
      expect(button).toHaveClass("bg-destructive"); // destructive variant
      expect(button).toHaveClass("h-11 rounded-md px-3"); // sm size
    });

    it("ghost variant with icon size", () => {
      render(
        <Button variant="ghost" size="icon">
          ×
        </Button>
      );

      const button = screen.getByRole("button", { name: /×/i });
      expect(button).toHaveClass("hover:bg-accent"); // ghost variant
      expect(button).toHaveClass("h-11 w-11"); // icon size
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA attributes when disabled", () => {
      render(<Button disabled>Disabled button</Button>);

      const button = screen.getByRole("button", { name: /disabled button/i });
      expect(button).toHaveAttribute("aria-disabled", "true");
    });

    it("supports custom ARIA attributes", () => {
      render(
        <Button
          aria-expanded={true}
          aria-haspopup="menu"
          aria-describedby="help-text"
        >
          Menu button
        </Button>
      );

      const button = screen.getByRole("button", { name: /menu button/i });
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(button).toHaveAttribute("aria-haspopup", "menu");
      expect(button).toHaveAttribute("aria-describedby", "help-text");
    });

    it("maintains focus outline for keyboard users", () => {
      render(<Button>Focus me</Button>);

      const button = screen.getByRole("button", { name: /focus me/i });
      button.focus();

      expect(button).toHaveClass("focus-visible:outline-none");
      expect(button).toHaveClass("focus-visible:ring-2");
    });
  });

  describe("edge cases", () => {
    it("handles empty children", () => {
      render(<Button></Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toBeEmptyDOMElement();
    });

    it("handles complex children", () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("IconText");
      expect(screen.getByText("Icon")).toBeInTheDocument();
      expect(screen.getByText("Text")).toBeInTheDocument();
    });

    it("handles rapid successive clicks", async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Rapid click</Button>);

      const button = screen.getByRole("button", { name: /rapid click/i });

      // Click rapidly
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it("handles long text content", () => {
      const longText =
        "This is a very long button text that might wrap or overflow depending on the container width and styling";
      render(<Button>{longText}</Button>);

      const button = screen.getByRole("button", { name: longText });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(longText);
    });
  });

  describe("event handling", () => {
    it("handles mousedown and mouseup events", async () => {
      const handleMouseDown = jest.fn();
      const handleMouseUp = jest.fn();

      render(
        <Button onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
          Mouse events
        </Button>
      );

      const button = screen.getByRole("button", { name: /mouse events/i });

      fireEvent.mouseDown(button);
      expect(handleMouseDown).toHaveBeenCalledTimes(1);

      fireEvent.mouseUp(button);
      expect(handleMouseUp).toHaveBeenCalledTimes(1);
    });

    it("handles focus and blur events", () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();

      render(
        <Button onFocus={handleFocus} onBlur={handleBlur}>
          Focus events
        </Button>
      );

      const button = screen.getByRole("button", { name: /focus events/i });

      fireEvent.focus(button);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      fireEvent.blur(button);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });
});
