# Interactive Tour System

This document explains how to use the interactive tour system built with Driver.js for Next.js 15.

## Overview

The tour system provides guided walkthroughs with user input validation, ensuring users complete required actions before proceeding to the next step. Built with Driver.js and custom React hooks, it offers:

- **User Input Control**: Steps can require specific user interactions
- **Flexible Navigation**: Always allow backward navigation
- **Visual Progress**: Real-time progress tracking and status indicators
- **Framework Integration**: Seamless Next.js 15 and React 19 compatibility

## Installation

The tour system is already installed and configured in your application. It uses:

```bash
npm install driver.js
```

## Components

### 1. TourProvider

The main context provider that manages tour state and functionality.

```tsx
import { TourProvider } from '@/components/tour/TourProvider';

// Wrap your app with TourProvider (already done in layout.tsx)
<TourProvider>
  <YourApp />
</TourProvider>
```

### 2. TourControl

A UI component for starting and controlling tours.

```tsx
import { TourControl } from '@/components/tour/TourControl';

// Full control panel
<TourControl />

// Header version (compact)
<TourControl showInHeader={true} />
```

### 3. useTour Hook

Access tour functionality in your components.

```tsx
import { useTour } from '@/components/tour/TourProvider';

const { 
  isActive,
  currentStep,
  startTour,
  stopTour,
  nextStep,
  previousStep,
  markInputComplete
} = useTour();
```

### 4. useTourSteps Hook

Predefined tour configurations and utilities.

```tsx
import { useTourSteps } from '@/components/tour/useTourSteps';

const {
  DASHBOARD_TOUR_STEPS,
  prepareDashboardForTour,
  createCustomTourStep
} = useTourSteps();
```

## Creating Tour Steps

### Basic Step

```tsx
const basicStep: TourStep = {
  id: 'welcome',
  element: 'body',
  popover: {
    title: 'Welcome!',
    description: 'This is a basic tour step.',
    nextBtnText: 'Next',
    prevBtnText: 'Previous'
  }
};
```

### User Input Step

```tsx
const inputStep: TourStep = {
  id: 'name-input',
  element: '[data-tour="name-field"]',
  popover: {
    title: 'Enter Your Name',
    description: 'Please type your name to continue.',
    waitForUserInput: true,
    requiredInputType: 'input',
    inputSelector: '[data-tour="name-field"]',
    onUserInputComplete: () => {
      console.log('User completed input!');
    }
  }
};
```

### Click Step

```tsx
const clickStep: TourStep = {
  id: 'submit-button',
  element: '[data-tour="submit-btn"]',
  popover: {
    title: 'Submit Form',
    description: 'Click the submit button to proceed.',
    waitForUserInput: true,
    requiredInputType: 'click',
    inputSelector: '[data-tour="submit-btn"]'
  }
};
```

### Select Step

```tsx
const selectStep: TourStep = {
  id: 'college-select',
  element: '[data-tour="college-dropdown"]',
  popover: {
    title: 'Choose College',
    description: 'Select your college from the dropdown.',
    waitForUserInput: true,
    requiredInputType: 'select',
    inputSelector: '[data-tour="college-dropdown"] select'
  }
};
```

### Custom Validation Step

```tsx
const customStep: TourStep = {
  id: 'custom-validation',
  element: '[data-tour="complex-form"]',
  popover: {
    title: 'Complete Form',
    description: 'Fill out all required fields.',
    waitForUserInput: true,
    requiredInputType: 'custom',
    customValidator: () => {
      // Your custom validation logic
      const name = document.getElementById('name')?.value;
      const email = document.getElementById('email')?.value;
      return name && email && email.includes('@');
    }
  }
};
```

## Input Types

### 1. Click (`click`)
Waits for user to click a specific element.

```tsx
requiredInputType: 'click',
inputSelector: '[data-tour="button-id"]'
```

### 2. Input (`input`)
Waits for user to type in an input field.

```tsx
requiredInputType: 'input',
inputSelector: '[data-tour="input-id"]',
inputValue: 'expected-value' // Optional: require specific value
```

### 3. Select (`select`)
Waits for user to make a selection from dropdown.

```tsx
requiredInputType: 'select',
inputSelector: '[data-tour="select-id"] select',
inputValue: 'expected-option' // Optional: require specific selection
```

### 4. Custom (`custom`)
Uses custom validation function.

```tsx
requiredInputType: 'custom',
customValidator: () => {
  // Return true when validation passes
  return someComplexValidation();
}
```

## Starting Tours

### Using Predefined Tours

```tsx
import { useTour } from '@/components/tour/TourProvider';
import { useTourSteps } from '@/components/tour/useTourSteps';

const MyComponent = () => {
  const { startTour } = useTour();
  const { DASHBOARD_TOUR_STEPS, prepareDashboardForTour } = useTourSteps();

  const handleStartTour = () => {
    // Prepare page elements
    prepareDashboardForTour();
    
    // Start the tour
    startTour(DASHBOARD_TOUR_STEPS);
  };

  return (
    <button onClick={handleStartTour}>
      Start Dashboard Tour
    </button>
  );
};
```

### Custom Tours

```tsx
const customTourSteps: TourStep[] = [
  {
    id: 'step1',
    element: '[data-tour="element1"]',
    popover: {
      title: 'Step 1',
      description: 'First step description'
    }
  },
  // ... more steps
];

const handleCustomTour = () => {
  startTour(customTourSteps, {
    showProgress: true,
    allowClose: true,
    overlayOpacity: 0.7
  });
};
```

## Preparing Elements for Tours

### Adding Data Attributes

Tours target elements using CSS selectors. Add `data-tour` attributes to your elements:

```tsx
// Manual approach
<button data-tour="submit-btn">Submit</button>
<input data-tour="name-input" placeholder="Name" />

// Programmatic approach
useEffect(() => {
  const button = document.getElementById('my-button');
  if (button) {
    button.setAttribute('data-tour', 'submit-btn');
  }
}, []);
```

### Using Preparation Functions

```tsx
import { useTourSteps } from '@/components/tour/useTourSteps';

const { prepareDashboardForTour } = useTourSteps();

// Call before starting tour
prepareDashboardForTour();
```

## Best Practices

### 1. Element Targeting

```tsx
// ✅ Good: Use data-tour attributes
element: '[data-tour="unique-id"]'

// ❌ Avoid: Generic selectors that might match multiple elements
element: '.button' // Could match many buttons

// ✅ Better: Specific, unique selectors
element: '#unique-button-id'
element: '[data-testid="specific-button"]'
```

### 2. Input Validation

```tsx
// ✅ Good: Clear, specific validation
waitForUserInput: true,
requiredInputType: 'input',
inputSelector: '[data-tour="email-field"]',
customValidator: () => {
  const email = document.querySelector('[data-tour="email-field"]').value;
  return email.includes('@') && email.includes('.');
}

// ❌ Avoid: Vague validation
waitForUserInput: true,
requiredInputType: 'custom',
customValidator: () => true // Always passes
```

### 3. User Experience

```tsx
// ✅ Good: Helpful descriptions
description: 'Enter your full name as it appears on official documents.'

// ✅ Good: Clear completion callbacks
onUserInputComplete: () => {
  showSuccessMessage('Great! Name entered successfully.');
}

// ✅ Good: Progress indication
showProgress: true,
nextBtnText: 'Continue (2/5)'
```

### 4. Error Handling

```tsx
// ✅ Good: Graceful fallbacks
const startTourSafely = () => {
  try {
    prepareDashboardForTour();
    startTour(DASHBOARD_TOUR_STEPS);
  } catch (error) {
    console.error('Tour failed to start:', error);
    showErrorMessage('Unable to start tour. Please refresh and try again.');
  }
};
```

## Predefined Tours

### Dashboard Tour
- **ID**: `dashboard`
- **Focus**: Navigation and basic features
- **Steps**: Welcome, user menu, create doorcard, doorcard grid, site index

### New Doorcard Tour  
- **ID**: `new-doorcard`
- **Focus**: Form completion with validation
- **Steps**: Welcome, name input, college selection, office number, submit

### Edit Doorcard Tour
- **ID**: `edit-doorcard`  
- **Focus**: Editing interface and options
- **Steps**: Welcome, basic info, office hours, add hours, save changes

## Customization

### Styling

The tour system uses Driver.js CSS classes. Override in your global CSS:

```css
/* Customize overlay */
.driver-overlay {
  opacity: 0.8 !important;
  background-color: rgba(0, 0, 0, 0.8) !important;
}

/* Customize popover */
.driver-popover {
  border-radius: 12px !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important;
}

/* Customize buttons */
.driver-popover-next-btn {
  background-color: #3b82f6 !important;
  border-radius: 8px !important;
}
```

### Configuration Options

```tsx
startTour(steps, {
  // Progress indicator
  showProgress: true,
  
  // Navigation buttons
  showButtons: ['next', 'previous', 'close'],
  
  // Overlay settings
  allowClose: true,
  overlayOpacity: 0.7,
  
  // Animation
  smoothScroll: true,
  
  // Custom classes
  popoverClass: 'custom-popover',
  overlayClass: 'custom-overlay',
  
  // Event handlers
  onHighlighted: (element, step, options) => {
    console.log('Step highlighted:', step);
  },
  onDeselected: (element, step, options) => {
    console.log('Step deselected:', step);
  }
});
```

## Troubleshooting

### Common Issues

1. **Tour doesn't start**
   ```tsx
   // Check if elements exist before starting
   const element = document.querySelector('[data-tour="target"]');
   if (!element) {
     console.error('Tour target element not found');
     return;
   }
   ```

2. **Input validation not working**
   ```tsx
   // Ensure selector matches actual element
   inputSelector: '[data-tour="input-field"]', // Must match exactly
   
   // Debug validation
   customValidator: () => {
     const element = document.querySelector('[data-tour="input-field"]');
     console.log('Validating element:', element, 'Value:', element?.value);
     return element?.value?.length > 0;
   }
   ```

3. **Steps not progressing**
   ```tsx
   // Check if markInputComplete is called
   onUserInputComplete: () => {
     console.log('Input completed, marking as done');
     markInputComplete(stepId);
   }
   ```

### Debug Mode

Enable debug logging:

```tsx
const handleStartTour = () => {
  console.log('Starting tour with steps:', tourSteps);
  prepareDashboardForTour();
  
  startTour(tourSteps, {
    onHighlighted: (element, step) => {
      console.log('Highlighted step:', step.popover?.title);
    },
    onNextClick: (element, step) => {
      console.log('Next clicked for step:', step.popover?.title);
    }
  });
};
```

## Demo

Visit `/tour-demo` to see a complete working example with:
- Form input validation
- Different input types
- Custom validation logic
- Visual progress tracking
- Interactive control panel

## API Reference

### TourStep Interface

```tsx
interface TourStep {
  id: string;                    // Unique step identifier
  element: string;               // CSS selector for target element
  popover: {
    title: string;               // Step title
    description: string;         // Step description
    nextBtnText?: string;        // Custom next button text
    prevBtnText?: string;        // Custom previous button text
    doneBtnText?: string;        // Custom done button text
    waitForUserInput?: boolean;  // Require user input
    requiredInputType?: 'click' | 'input' | 'select' | 'custom';
    inputSelector?: string;      // Selector for input element
    inputValue?: string;         // Expected input value
    customValidator?: () => boolean;     // Custom validation function
    onUserInputComplete?: () => void;    // Completion callback
  };
}
```

### useTour Hook

```tsx
interface TourContextType {
  isActive: boolean;                              // Tour active state
  currentStep: number;                            // Current step index
  steps: TourStep[];                              // Current tour steps
  startTour: (steps: TourStep[], config?: Config) => void;  // Start tour
  stopTour: () => void;                           // Stop tour
  nextStep: () => void;                           // Go to next step
  previousStep: () => void;                       // Go to previous step
  goToStep: (stepIndex: number) => void;          // Jump to specific step
  checkUserInputComplete: (stepId: string) => boolean;      // Check input status
  markInputComplete: (stepId: string) => void;   // Mark input as complete
}
```

This tour system provides a robust foundation for creating guided user experiences that ensure users complete required actions while maintaining flexibility and good UX practices.