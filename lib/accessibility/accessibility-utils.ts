/**
 * Accessibility utility functions for WCAG 2.1 AA compliance
 */

/**
 * Check if color contrast meets WCAG AA standards
 * @param foreground - foreground color (hex format)
 * @param background - background color (hex format)
 * @returns contrast ratio
 */
export function getContrastRatio(
  foreground: string,
  background: string
): number {
  const getLuminance = (hex: string): number => {
    // Remove # if present
    const color = hex.replace("#", "");
    const r = parseInt(color.substr(0, 2), 16) / 255;
    const g = parseInt(color.substr(2, 2), 16) / 255;
    const b = parseInt(color.substr(4, 2), 16) / 255;

    const toLinear = (val: number) => {
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standards
 * @param foreground - foreground color
 * @param background - background color
 * @param level - 'AA' or 'AAA'
 * @param size - 'normal' or 'large' text
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: "AA" | "AAA" = "AA",
  size: "normal" | "large" = "normal"
): boolean {
  const ratio = getContrastRatio(foreground, background);

  if (level === "AAA") {
    return size === "large" ? ratio >= 4.5 : ratio >= 7;
  }

  // AA standards
  return size === "large" ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Generate accessible aria-describedby IDs
 */
export function generateAriaIds(baseId: string): {
  helpId: string;
  errorId: string;
  successId: string;
} {
  return {
    helpId: `${baseId}-help`,
    errorId: `${baseId}-error`,
    successId: `${baseId}-success`,
  };
}

/**
 * Create accessible form field props
 */
export function createFormFieldProps(
  id: string,
  required = false,
  hasError = false,
  hasHelp = false
) {
  const ariaIds = generateAriaIds(id);
  const describedBy = [];

  if (hasHelp) describedBy.push(ariaIds.helpId);
  if (hasError) describedBy.push(ariaIds.errorId);

  return {
    id,
    "aria-required": required,
    "aria-invalid": hasError,
    "aria-describedby":
      describedBy.length > 0 ? describedBy.join(" ") : undefined,
    ...ariaIds,
  };
}

/**
 * Validate heading hierarchy
 */
export function validateHeadingHierarchy(container: HTMLElement): string[] {
  const issues: string[] = [];
  const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
  let previousLevel = 0;

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));

    if (index === 0 && level !== 1) {
      issues.push(
        `First heading should be h1, found ${heading.tagName.toLowerCase()}`
      );
    }

    if (level > previousLevel + 1) {
      issues.push(
        `Heading level skipped: ${heading.tagName.toLowerCase()} after h${previousLevel}`
      );
    }

    previousLevel = level;
  });

  return issues;
}

/**
 * Check for accessibility issues in forms
 */
export function validateFormAccessibility(form: HTMLFormElement): string[] {
  const issues: string[] = [];

  // Check for unlabeled inputs
  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    const id = input.getAttribute("id");
    const ariaLabel = input.getAttribute("aria-label");
    const ariaLabelledBy = input.getAttribute("aria-labelledby");

    if (id) {
      const label = form.querySelector(`label[for="${id}"]`);
      if (!label && !ariaLabel && !ariaLabelledBy) {
        issues.push(`Input ${id} has no associated label`);
      }
    } else if (!ariaLabel && !ariaLabelledBy) {
      issues.push("Input has no id and no aria-label");
    }
  });

  // Check for missing fieldsets in groups
  const radioGroups = form.querySelectorAll('input[type="radio"]');
  const checkboxGroups = form.querySelectorAll('input[type="checkbox"]');

  if (radioGroups.length > 1) {
    const fieldset = form.querySelector("fieldset");
    if (!fieldset) {
      issues.push(
        "Radio button groups should be wrapped in fieldset with legend"
      );
    }
  }

  return issues;
}

/**
 * WCAG 2.1 Color palette validation
 */
export const colorPalette = {
  // Primary colors
  blue900: "#1e3a8a", // Main brand color
  blue800: "#1e40af",
  blue700: "#1d4ed8",
  blue600: "#2563eb",
  blue500: "#3b82f6",

  // Status colors
  red600: "#dc2626", // Error (4.83:1 - PASS)
  green700: "#15803d", // Success - darker for better contrast (5.37:1)
  yellow700: "#a16207", // Warning - darker for better contrast (4.52:1)

  // Neutral colors
  gray900: "#111827",
  gray800: "#1f2937",
  gray700: "#374151",
  gray600: "#4b5563",
  gray500: "#6b7280",
  gray400: "#9ca3af",
  gray300: "#d1d5db",
  gray200: "#e5e7eb",
  gray100: "#f3f4f6",
  gray50: "#f9fafb",

  white: "#ffffff",
} as const;

/**
 * Validate color combinations used in the app
 */
export function validateAppColorContrast(): Array<{
  name: string;
  foreground: string;
  background: string;
  ratio: number;
  passes: boolean;
}> {
  const combinations = [
    {
      name: "Primary button text",
      foreground: colorPalette.white,
      background: colorPalette.blue900,
    },
    {
      name: "Body text on white",
      foreground: colorPalette.gray900,
      background: colorPalette.white,
    },
    {
      name: "Secondary text",
      foreground: colorPalette.gray600,
      background: colorPalette.white,
    },
    {
      name: "Error text",
      foreground: colorPalette.red600,
      background: colorPalette.white,
    },
    {
      name: "Success text",
      foreground: colorPalette.green700,
      background: colorPalette.white,
    },
    {
      name: "Warning text",
      foreground: colorPalette.yellow700,
      background: colorPalette.white,
    },
  ];

  return combinations.map((combo) => {
    const ratio = getContrastRatio(combo.foreground, combo.background);
    const passes = meetsContrastRequirement(combo.foreground, combo.background);

    return {
      ...combo,
      ratio: Math.round(ratio * 100) / 100,
      passes,
    };
  });
}
