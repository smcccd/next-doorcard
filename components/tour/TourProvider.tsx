"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { driver, DriveStep, Config } from 'driver.js';
import 'driver.js/dist/driver.css';

// Tour step interface extending DriveStep with user input requirements
interface TourStep extends Omit<DriveStep, 'popover'> {
  id: string;
  element: string;
  popover: {
    title: string;
    description: string;
    nextBtnText?: string;
    prevBtnText?: string;
    doneBtnText?: string;
    showButtons?: string[] | boolean;
    // User input requirements
    waitForUserInput?: boolean;
    requiredInputType?: 'click' | 'input' | 'select' | 'custom';
    inputSelector?: string;
    inputValue?: string;
    customValidator?: () => boolean;
    onUserInputComplete?: () => void;
  };
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: (tourSteps: TourStep[], config?: Partial<Config>) => void;
  stopTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepIndex: number) => void;
  checkUserInputComplete: (stepId: string) => boolean;
  markInputComplete: (stepId: string) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [driverInstance, setDriverInstance] = useState<ReturnType<typeof driver> | null>(null);
  const [completedInputs, setCompletedInputs] = useState<Set<string>>(new Set());

  const checkUserInputComplete = useCallback((stepId: string): boolean => {
    return completedInputs.has(stepId);
  }, [completedInputs]);

  const markInputComplete = useCallback((stepId: string) => {
    setCompletedInputs(prev => new Set(prev).add(stepId));
  }, []);

  const validateUserInput = useCallback((step: TourStep): boolean => {
    if (!step.popover.waitForUserInput) return true;

    // Custom validator takes precedence
    if (step.popover.customValidator) {
      return (step.popover.customValidator as () => boolean)();
    }

    // Check if input is already marked as complete
    if (completedInputs.has(step.id)) return true;

    const element = document.querySelector(step.popover.inputSelector || step.element);
    if (!element) return false;

    switch (step.popover.requiredInputType) {
      case 'click':
        // For click validation, we rely on the markInputComplete being called
        return completedInputs.has(step.id);
      
      case 'input':
        const inputElement = element as HTMLInputElement;
        const expectedValue = step.popover.inputValue;
        return expectedValue ? inputElement.value === expectedValue : inputElement.value.trim() !== '';
      
      case 'select':
        const selectElement = element as HTMLSelectElement;
        const expectedSelectValue = step.popover.inputValue;
        return expectedSelectValue ? selectElement.value === expectedSelectValue : selectElement.value !== '';
      
      case 'custom':
        return step.popover.customValidator ? (step.popover.customValidator as () => boolean)() : false;
      
      default:
        return true;
    }
  }, [completedInputs]);

  const setupInputListeners = useCallback((step: TourStep) => {
    if (!step.popover.waitForUserInput) return;

    const element = document.querySelector(step.popover.inputSelector || step.element);
    if (!element) return;

    const handleInputChange = () => {
      if (validateUserInput(step)) {
        markInputComplete(step.id);
        if (step.popover.onUserInputComplete) {
          step.popover.onUserInputComplete();
        }
      }
    };

    const handleClick = () => {
      markInputComplete(step.id);
      if (step.popover.onUserInputComplete) {
        step.popover.onUserInputComplete();
      }
    };

    // Add appropriate event listeners based on input type
    switch (step.popover.requiredInputType) {
      case 'click':
        element.addEventListener('click', handleClick);
        break;
      case 'input':
        element.addEventListener('input', handleInputChange);
        element.addEventListener('change', handleInputChange);
        break;
      case 'select':
        element.addEventListener('change', handleInputChange);
        break;
    }

    // Store cleanup function
    (element as any).__tourCleanup = () => {
      element.removeEventListener('click', handleClick);
      element.removeEventListener('input', handleInputChange);
      element.removeEventListener('change', handleInputChange);
    };
  }, [validateUserInput, markInputComplete]);

  const cleanupInputListeners = useCallback(() => {
    // Clean up all event listeners
    document.querySelectorAll('[data-tour-element]').forEach(element => {
      if ((element as any).__tourCleanup) {
        (element as any).__tourCleanup();
        delete (element as any).__tourCleanup;
      }
    });
  }, []);

  const startTour = useCallback((tourSteps: TourStep[], config?: Partial<Config>) => {
    if (tourSteps.length === 0) return;

    setSteps(tourSteps);
    setCurrentStep(0);
    setCompletedInputs(new Set());

    // Convert TourStep to DriveStep format
    const driverSteps = tourSteps.map((step, index) => ({
      element: step.element,
      popover: {
        title: step.popover.title,
        description: step.popover.description,
        nextBtnText: step.popover.nextBtnText || 'Next',
        prevBtnText: step.popover.prevBtnText || 'Previous',
        doneBtnText: step.popover.doneBtnText || 'Done',
        showButtons: Array.isArray(step.popover.showButtons) 
          ? (step.popover.showButtons as ('next' | 'previous' | 'close')[])
          : ['next', 'previous'],
        onNextClick: (element: Element, step: DriveStep, opts: { config: Config, state: any }) => {
          const currentTourStep = tourSteps[index];
          
          // Check if user input is required and completed
          if (currentTourStep.popover.waitForUserInput && !validateUserInput(currentTourStep)) {
            // Prevent advancing to next step
            console.warn(`User input required for step: ${currentTourStep.id}`);
            return false;
          }

          // Allow normal progression
          setCurrentStep(prev => Math.min(prev + 1, tourSteps.length - 1));
          opts.state.activeIndex = Math.min(opts.state.activeIndex + 1, tourSteps.length - 1);
        },
        onPrevClick: (element: Element, step: DriveStep, opts: { config: Config, state: any }) => {
          // Always allow going back
          setCurrentStep(prev => Math.max(prev - 1, 0));
          opts.state.activeIndex = Math.max(opts.state.activeIndex - 1, 0);
        }
      }
    }));

    const defaultConfig: Config = {
      showProgress: true,
      showButtons: ['next', 'previous'],
      allowClose: true,
      overlayOpacity: 0.7,
      smoothScroll: true,
      onHighlightStarted: (element, step, opts) => {
        const stepIndex = opts.state.activeIndex;
        if (typeof stepIndex === 'number') {
          const currentTourStep = tourSteps[stepIndex];
          setCurrentStep(stepIndex);
        
          // Set up input listeners for the current step
          if (currentTourStep) {
            setupInputListeners(currentTourStep);
          }
        }
      },
      onDestroyed: () => {
        setIsActive(false);
        setCurrentStep(0);
        cleanupInputListeners();
      },
      ...config
    };

    const driverObj = driver(defaultConfig);
    driverObj.setSteps(driverSteps as any);
    driverObj.drive();
    
    setDriverInstance(driverObj);
    setIsActive(true);
  }, [validateUserInput, setupInputListeners, cleanupInputListeners]);

  const stopTour = useCallback(() => {
    if (driverInstance) {
      driverInstance.destroy();
      setDriverInstance(null);
    }
    cleanupInputListeners();
    setIsActive(false);
    setCurrentStep(0);
    setCompletedInputs(new Set());
  }, [driverInstance, cleanupInputListeners]);

  const nextStep = useCallback(() => {
    if (driverInstance && currentStep < steps.length - 1) {
      const currentTourStep = steps[currentStep];
      
      // Check if user input is required and completed
      if (currentTourStep.popover.waitForUserInput && !validateUserInput(currentTourStep)) {
        console.warn(`User input required for step: ${currentTourStep.id}`);
        return;
      }

      driverInstance.moveNext();
    }
  }, [driverInstance, currentStep, steps, validateUserInput]);

  const previousStep = useCallback(() => {
    if (driverInstance && currentStep > 0) {
      driverInstance.movePrevious();
    }
  }, [driverInstance, currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (driverInstance && stepIndex >= 0 && stepIndex < steps.length) {
      driverInstance.moveTo(stepIndex);
      setCurrentStep(stepIndex);
    }
  }, [driverInstance, steps.length]);

  const contextValue: TourContextType = {
    isActive,
    currentStep,
    steps,
    startTour,
    stopTour,
    nextStep,
    previousStep,
    goToStep,
    checkUserInputComplete,
    markInputComplete
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

export type { TourStep };