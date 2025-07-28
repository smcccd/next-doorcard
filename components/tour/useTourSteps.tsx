"use client";

import { useCallback } from "react";
import { TourStep } from "./TourProvider";

// Predefined tour configurations for different pages
export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    element: "body",
    popover: {
      title: "👋 Welcome to Faculty Doorcard!",
      description:
        "Let's take a quick tour to help you get started with creating and managing your doorcards.",
      nextBtnText: "Start Tour",
      showButtons: ["next"],
    },
  },
  {
    id: "user-menu",
    element: '[data-tour="user-menu"]',
    popover: {
      title: "Your Profile Menu",
      description:
        "Access your profile settings, view analytics, and manage your account from here.",
      nextBtnText: "Next",
      prevBtnText: "Previous",
    },
  },
  {
    id: "create-doorcard",
    element: '[data-tour="create-doorcard-btn"]',
    popover: {
      title: "Create New Doorcard",
      description:
        "Click here to create a new doorcard for the current term. Try clicking this button now!",
      waitForUserInput: true,
      requiredInputType: "click",
      inputSelector: '[data-tour="create-doorcard-btn"]',
      onUserInputComplete: () => {
        // User completed create doorcard action
      },
    },
  },
  {
    id: "doorcard-grid",
    element: '[data-tour="doorcard-grid"]',
    popover: {
      title: "Your Doorcards",
      description:
        "Here you can see all your existing doorcards. You can edit, view, or duplicate them.",
      nextBtnText: "Next",
      prevBtnText: "Back",
    },
  },
  {
    id: "site-index",
    element: '[data-tour="site-index"]',
    popover: {
      title: "Site Navigation",
      description:
        "Use this alphabetical index to quickly navigate to different sections of the site.",
      nextBtnText: "Next",
      prevBtnText: "Back",
    },
  },
];

export const NEW_DOORCARD_TOUR_STEPS: TourStep[] = [
  {
    id: "doorcard-form-welcome",
    element: "body",
    popover: {
      title: "📝 Creating Your Doorcard",
      description:
        "This form will help you create a professional doorcard with your office hours and contact information.",
      nextBtnText: "Let's Start",
    },
  },
  {
    id: "name-input",
    element: '[data-tour="name-input"]',
    popover: {
      title: "Your Display Name",
      description:
        "Enter your name as you want it to appear on your doorcard. Please type your name now.",
      waitForUserInput: true,
      requiredInputType: "input",
      inputSelector: '[data-tour="name-input"]',
    },
  },
  {
    id: "college-select",
    element: '[data-tour="college-select"]',
    popover: {
      title: "Select Your College",
      description:
        "Choose which college you belong to. Please make a selection now.",
      waitForUserInput: true,
      requiredInputType: "select",
      inputSelector: '[data-tour="college-select"]',
    },
  },
  {
    id: "office-number",
    element: '[data-tour="office-input"]',
    popover: {
      title: "Office Information",
      description: "Enter your office number so students can find you easily.",
      waitForUserInput: true,
      requiredInputType: "input",
      inputSelector: '[data-tour="office-input"]',
    },
  },
  {
    id: "submit-form",
    element: '[data-tour="submit-btn"]',
    popover: {
      title: "Submit Your Doorcard",
      description:
        "When you're ready, click submit to create your doorcard. You can always edit it later!",
      doneBtnText: "Finish Tour",
    },
  },
];

export const EDIT_DOORCARD_TOUR_STEPS: TourStep[] = [
  {
    id: "edit-welcome",
    element: "body",
    popover: {
      title: "✏️ Editing Your Doorcard",
      description:
        "Here you can update your doorcard information, add office hours, and customize your display.",
      nextBtnText: "Continue",
    },
  },
  {
    id: "basic-info-tab",
    element: '[data-tour="basic-info-tab"]',
    popover: {
      title: "Basic Information",
      description:
        "Update your name, title, and contact information in this section.",
      nextBtnText: "Next",
    },
  },
  {
    id: "office-hours-tab",
    element: '[data-tour="office-hours-tab"]',
    popover: {
      title: "Office Hours & Appointments",
      description:
        "Add your office hours and appointment types here. Students will see when you're available.",
      nextBtnText: "Next",
    },
  },
  {
    id: "add-office-hours",
    element: '[data-tour="add-office-hours-btn"]',
    popover: {
      title: "Add Office Hours",
      description:
        "Click this button to add new office hours. Try clicking it now!",
      waitForUserInput: true,
      requiredInputType: "click",
      inputSelector: '[data-tour="add-office-hours-btn"]',
    },
  },
  {
    id: "save-changes",
    element: '[data-tour="save-btn"]',
    popover: {
      title: "Save Your Changes",
      description:
        "Don't forget to save your changes when you're done editing!",
      doneBtnText: "Finish",
    },
  },
];

// Hook for managing tour steps and utilities
export const useTourSteps = () => {
  // Add tour data attributes to elements
  const addTourAttributes = useCallback((elementId: string, tourId: string) => {
    const element =
      document.getElementById(elementId) ||
      document.querySelector(`[data-testid="${elementId}"]`);
    if (element) {
      element.setAttribute("data-tour", tourId);
    }
  }, []);

  // Remove tour data attributes
  const removeTourAttributes = useCallback((elementId: string) => {
    const element =
      document.getElementById(elementId) ||
      document.querySelector(`[data-testid="${elementId}"]`);
    if (element) {
      element.removeAttribute("data-tour");
    }
  }, []);

  // Prepare page for tour by adding necessary attributes
  const prepareDashboardForTour = useCallback(() => {
    // Add data-tour attributes to dashboard elements
    setTimeout(() => {
      const elements = [
        { selector: '[data-testid="user-menu"]', tourId: "user-menu" },
        {
          selector: '[data-testid="create-doorcard-btn"]',
          tourId: "create-doorcard-btn",
        },
        { selector: '[data-testid="doorcard-grid"]', tourId: "doorcard-grid" },
        {
          selector: '.site-index, [data-testid="site-index"]',
          tourId: "site-index",
        },
      ];

      elements.forEach(({ selector, tourId }) => {
        const element = document.querySelector(selector);
        if (element) {
          element.setAttribute("data-tour", tourId);
        } else {
          console.warn(`Tour preparation: Element not found for selector: ${selector}`);
        }
      });
    }, 100);
  }, []);

  const prepareNewDoorcardForTour = useCallback(() => {
    setTimeout(() => {
      const elements = [
        { selector: 'input[name="name"], #name-input', tourId: "name-input" },
        {
          selector: 'select[name="college"], #college-select',
          tourId: "college-select",
        },
        {
          selector: 'input[name="officeNumber"], #office-input',
          tourId: "office-input",
        },
        {
          selector: 'button[type="submit"], #submit-btn',
          tourId: "submit-btn",
        },
      ];

      elements.forEach(({ selector, tourId }) => {
        const element = document.querySelector(selector);
        if (element) {
          element.setAttribute("data-tour", tourId);
        } else {
          console.warn(`Tour preparation: Element not found for selector: ${selector}`);
        }
      });
    }, 100);
  }, []);

  const prepareEditDoorcardForTour = useCallback(() => {
    setTimeout(() => {
      const elements = [
        {
          selector: '[data-testid="basic-info-tab"], .tab-basic-info',
          tourId: "basic-info-tab",
        },
        {
          selector: '[data-testid="office-hours-tab"], .tab-office-hours',
          tourId: "office-hours-tab",
        },
        {
          selector: '[data-testid="add-office-hours-btn"], .add-office-hours',
          tourId: "add-office-hours-btn",
        },
        {
          selector: '[data-testid="save-btn"], button[type="submit"]',
          tourId: "save-btn",
        },
      ];

      elements.forEach(({ selector, tourId }) => {
        const element = document.querySelector(selector);
        if (element) {
          element.setAttribute("data-tour", tourId);
        } else {
          console.warn(`Tour preparation: Element not found for selector: ${selector}`);
        }
      });
    }, 100);
  }, []);

  // Create custom tour steps
  const createCustomTourStep = useCallback(
    (
      id: string,
      element: string,
      title: string,
      description: string,
      options?: {
        waitForUserInput?: boolean;
        requiredInputType?: "click" | "input" | "select" | "custom";
        inputSelector?: string;
        inputValue?: string;
        customValidator?: () => boolean;
        onUserInputComplete?: () => void;
      },
    ): TourStep => {
      return {
        id,
        element,
        popover: {
          title,
          description,
          nextBtnText: "Next",
          prevBtnText: "Previous",
          ...options,
        },
      };
    },
    [],
  );

  return {
    // Predefined tour steps
    DASHBOARD_TOUR_STEPS,
    NEW_DOORCARD_TOUR_STEPS,
    EDIT_DOORCARD_TOUR_STEPS,

    // Utility functions
    addTourAttributes,
    removeTourAttributes,
    prepareDashboardForTour,
    prepareNewDoorcardForTour,
    prepareEditDoorcardForTour,
    createCustomTourStep,
  };
};

export default useTourSteps;
