/**
 * Accessibility Testing Strategy for Faculty Doorcard Application
 *
 * This file outlines comprehensive testing approaches for ADA compliance
 * and provides utilities for automated accessibility testing
 */

export interface AccessibilityTestResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
}

/**
 * Manual Testing Checklist
 */
export const MANUAL_TESTING_CHECKLIST = {
  keyboard_navigation: [
    "Can navigate entire form using only Tab/Shift+Tab",
    "All interactive elements are reachable via keyboard",
    "Focus indicators are clearly visible",
    "Tab order is logical and intuitive",
    "Escape key dismisses modals/dropdowns",
    "Enter/Space activates buttons and controls",
    "Arrow keys work in appropriate contexts (radio groups, etc)",
  ],

  screen_reader: [
    "Form labels are properly announced",
    "Error messages are announced when they appear",
    "Required fields are clearly identified",
    "Form submission feedback is announced",
    "Complex content (schedules) has proper structure",
    "Skip links function correctly",
    "Page titles and headings provide context",
  ],

  visual_accessibility: [
    "Text meets 4.5:1 contrast ratio (WCAG AA)",
    "Focus indicators meet 3:1 contrast ratio",
    "Color is not the only means of conveying information",
    "Text can be zoomed to 200% without horizontal scrolling",
    "Content reflows properly at different viewport sizes",
    "No seizure-inducing animations or flashing",
  ],

  cognitive_accessibility: [
    "Clear, simple language used throughout",
    "Consistent navigation and interaction patterns",
    "Error messages are specific and helpful",
    "Multi-step processes show progress clearly",
    "Forms can be saved and resumed",
    "Time limits are either absent or adjustable",
  ],
};

/**
 * Screen Reader Testing Guide
 */
export const SCREEN_READER_TESTING = {
  nvda: {
    name: "NVDA (Windows)",
    shortcuts: {
      "Navigate by headings": "H",
      "Navigate by links": "K",
      "Navigate by buttons": "B",
      "Navigate by form fields": "F",
      "Navigate by landmarks": "D",
      "List all headings": "Insert + F7",
      "List all links": "Insert + F7",
      "Forms mode": "Insert + Space",
    },
  },

  jaws: {
    name: "JAWS (Windows)",
    shortcuts: {
      "Navigate by headings": "H",
      "Navigate by links": "Insert + F7",
      "Navigate by buttons": "B",
      "Navigate by form fields": "F",
      "Virtual PC cursor": "Insert + Z",
      "Forms mode": "Insert + Space",
    },
  },

  voiceover: {
    name: "VoiceOver (macOS)",
    shortcuts: {
      "Navigate by headings": "VO + Command + H",
      "Navigate by links": "VO + Command + L",
      "Navigate by buttons": "VO + Command + J",
      "Navigate by form fields": "VO + Command + J",
      Rotor: "VO + U",
      "Web rotor": "VO + Command + U",
    },
  },
};

/**
 * Browser Testing Matrix
 */
export const BROWSER_TESTING_MATRIX = [
  { browser: "Chrome", screenReader: "NVDA", os: "Windows" },
  { browser: "Firefox", screenReader: "NVDA", os: "Windows" },
  { browser: "Edge", screenReader: "JAWS", os: "Windows" },
  { browser: "Safari", screenReader: "VoiceOver", os: "macOS" },
  { browser: "Chrome", screenReader: "VoiceOver", os: "macOS" },
];

/**
 * Automated Testing Tools Configuration
 */
export const AUTOMATED_TESTING_TOOLS = {
  axe_core: {
    rules: {
      // Color contrast
      "color-contrast": true,
      "color-contrast-enhanced": false, // AAA level - optional

      // Keyboard accessibility
      "focus-order-semantics": true,
      "focusable-content": true,
      tabindex: true,

      // ARIA
      "aria-allowed-attr": true,
      "aria-required-attr": true,
      "aria-valid-attr-value": true,
      "aria-valid-attr": true,

      // Forms
      label: true,
      "label-title-only": true,
      "form-field-multiple-labels": true,

      // Structure
      "heading-order": true,
      "landmark-one-main": true,
      "page-has-heading-one": true,
      region: true,
    },
  },

  lighthouse: {
    categories: {
      accessibility: true,
      performance: true, // Affects accessibility
    },
    settings: {
      onlyCategories: ["accessibility"],
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
      },
    },
  },
};

/**
 * Component-Specific Test Cases
 */
export const COMPONENT_TEST_CASES = {
  NewDoorcardForm: [
    "Campus selection announces selected value",
    "Term selection provides clear feedback",
    "Year selection is logically ordered",
    "Validation errors are properly associated",
    "Form submission status is announced",
    "Required field indicators are accessible",
  ],

  BasicInfoForm: [
    "Name field has proper labeling",
    "Real-time validation feedback is accessible",
    "Character count/limits are announced",
    "Success states are communicated",
    "Error recovery is straightforward",
  ],

  TimeBlockForm: [
    "Day selection buttons work with keyboard",
    "Time pickers are accessible",
    "Category colors don't rely solely on color",
    "Schedule conflicts are clearly announced",
    "Add/remove actions provide feedback",
    "Complex schedule structure is navigable",
  ],

  ScheduleDisplay: [
    "Schedule table has proper headers",
    "Time slots are clearly labeled",
    "Appointment details are accessible",
    "Color coding has text alternatives",
    "Schedule can be navigated linearly",
    "Print version maintains accessibility",
  ],
};

/**
 * Assistive Technology Testing Scenarios
 */
export const ASSISTIVE_TECH_SCENARIOS = [
  {
    name: "Keyboard-only user",
    description: "User relies solely on keyboard navigation",
    test_steps: [
      "Navigate to doorcard creation",
      "Fill out complete form using only keyboard",
      "Submit form and verify success",
      "Edit existing doorcard",
      "Navigate through schedule",
    ],
  },

  {
    name: "Screen reader user",
    description: "Blind user using NVDA or similar",
    test_steps: [
      "Navigate site structure using landmarks",
      "Complete form using screen reader announcements",
      "Understand schedule layout through audio",
      "Identify and correct form errors",
      "Access help and documentation",
    ],
  },

  {
    name: "Low vision user",
    description: "User with visual impairment requiring zoom",
    test_steps: [
      "Zoom to 200% and verify layout",
      "Test with high contrast mode",
      "Verify focus indicators are visible",
      "Check that text remains readable",
      "Ensure no horizontal scrolling required",
    ],
  },

  {
    name: "Motor impairment user",
    description: "User with limited fine motor control",
    test_steps: [
      "Test with large click targets",
      "Verify drag interactions have alternatives",
      "Check timeout accommodations",
      "Test with switch navigation",
      "Ensure error tolerance in forms",
    ],
  },
];

/**
 * Compliance Checklist (WCAG 2.1 AA)
 */
export const WCAG_COMPLIANCE_CHECKLIST = {
  perceivable: {
    text_alternatives: "All images, form controls have alt text",
    captions: "Audio content has captions (if applicable)",
    adaptable:
      "Content can be presented in different ways without losing meaning",
    distinguishable: "Content is easier to see and hear",
  },

  operable: {
    keyboard_accessible: "All functionality available via keyboard",
    seizures: "No content causes seizures",
    navigable: "Users can navigate and find content",
    input_modalities: "Functionality via various inputs",
  },

  understandable: {
    readable: "Text is readable and understandable",
    predictable: "Web pages appear and operate predictably",
    input_assistance: "Users are helped to avoid and correct mistakes",
  },

  robust: {
    compatible: "Content works with assistive technologies",
  },
};

/**
 * Testing Priority Levels
 */
export const TESTING_PRIORITIES = {
  critical: [
    "Keyboard navigation works completely",
    "Screen readers can access all content",
    "Forms are fully accessible",
    "Color contrast meets WCAG AA",
    "No accessibility blocking issues",
  ],

  high: [
    "Focus management is proper",
    "Error handling is accessible",
    "Complex content has proper structure",
    "Zoom functionality works well",
    "Skip links function correctly",
  ],

  medium: [
    "Enhanced ARIA descriptions",
    "Better visual design consistency",
    "Improved cognitive load",
    "Additional keyboard shortcuts",
    "Better mobile accessibility",
  ],

  low: [
    "AAA level contrast ratios",
    "Advanced screen reader features",
    "Specialized assistive tech support",
    "International accessibility standards",
    "Enhanced user preference settings",
  ],
};

/**
 * Generate accessibility testing report
 */
export function generateAccessibilityReport(results: {
  manual: Record<string, boolean>;
  automated: AccessibilityTestResult;
  component_tests: Record<string, boolean>;
}): {
  overall_score: number;
  compliance_level: "AA" | "A" | "Partial" | "Non-compliant";
  recommendations: string[];
  next_steps: string[];
} {
  // This would implement scoring logic based on test results
  // For now, return a template structure

  return {
    overall_score: 85,
    compliance_level: "AA",
    recommendations: [
      "Add more ARIA labels to complex components",
      "Improve error announcement timing",
      "Test with additional screen readers",
    ],
    next_steps: [
      "Schedule user testing with disabled users",
      "Implement remaining keyboard shortcuts",
      "Create accessibility documentation",
    ],
  };
}
