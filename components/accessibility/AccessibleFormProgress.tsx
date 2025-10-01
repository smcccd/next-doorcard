"use client";

import React, { useEffect } from 'react';
import { useKeyboardNavigation } from './KeyboardNavigationProvider';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface FormStep {
  id: string;
  title: string;
  completed: boolean;
  current: boolean;
  hasErrors?: boolean;
}

interface AccessibleFormProgressProps {
  steps: FormStep[];
  currentStepIndex: number;
  className?: string;
}

export function AccessibleFormProgress({ 
  steps, 
  currentStepIndex, 
  className = "" 
}: AccessibleFormProgressProps) {
  const { announceToUser } = useKeyboardNavigation();

  // Announce progress changes
  useEffect(() => {
    const currentStep = steps[currentStepIndex];
    if (currentStep) {
      const stepNumber = currentStepIndex + 1;
      const totalSteps = steps.length;
      const message = `Step ${stepNumber} of ${totalSteps}: ${currentStep.title}`;
      announceToUser(message, 'polite');
    }
  }, [currentStepIndex, steps, announceToUser]);

  return (
    <nav 
      role="navigation" 
      aria-label="Form progress"
      className={`form-progress ${className}`}
    >
      {/* Screen reader summary */}
      <div className="sr-only">
        <p>
          Form progress: Step {currentStepIndex + 1} of {steps.length}. 
          {steps.filter(s => s.completed).length} steps completed.
        </p>
      </div>

      <ol className="progress-steps" role="list">
        {steps.map((step, index) => {
          const isCompleted = step.completed;
          const isCurrent = step.current;
          const hasErrors = step.hasErrors;
          
          return (
            <li
              key={step.id}
              className={`progress-step ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${hasErrors ? 'error' : ''}`}
              role="listitem"
            >
              <div
                className="step-indicator"
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`
                  Step ${index + 1}: ${step.title}. 
                  ${isCompleted ? 'Completed' : isCurrent ? 'Current step' : 'Not started'}
                  ${hasErrors ? '. Has errors that need attention' : ''}
                `}
              >
                <div className="step-icon" aria-hidden="true">
                  {hasErrors ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                
                <div className="step-content">
                  <div className="step-number" aria-hidden="true">
                    Step {index + 1}
                  </div>
                  <div className="step-title">
                    {step.title}
                  </div>
                  {hasErrors && (
                    <div className="step-error" role="alert">
                      Needs attention
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress connector */}
              {index < steps.length - 1 && (
                <div 
                  className={`step-connector ${isCompleted ? 'completed' : ''}`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      <style jsx>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .form-progress {
          margin: 2rem 0;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }

        .progress-steps {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        @media (min-width: 768px) {
          .progress-steps {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .progress-step {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: all 0.2s ease-in-out;
          cursor: default;
          flex: 1;
        }

        .step-indicator:focus {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        .step-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: #e2e8f0;
          color: #64748b;
          transition: all 0.2s ease-in-out;
        }

        .progress-step.completed .step-icon {
          background: #10b981;
          color: white;
        }

        .progress-step.current .step-icon {
          background: #3b82f6;
          color: white;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }

        .progress-step.error .step-icon {
          background: #ef4444;
          color: white;
        }

        .step-content {
          flex: 1;
          min-width: 0;
        }

        .step-number {
          font-size: 0.75rem;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 0.125rem;
        }

        .progress-step.current .step-number {
          color: #3b82f6;
        }

        .step-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.25;
        }

        .progress-step.completed .step-title {
          color: #059669;
        }

        .progress-step.current .step-title {
          color: #1d4ed8;
        }

        .progress-step.error .step-title {
          color: #dc2626;
        }

        .step-error {
          font-size: 0.75rem;
          color: #dc2626;
          font-weight: 500;
          margin-top: 0.125rem;
        }

        .step-connector {
          height: 2px;
          background: #e2e8f0;
          margin: 0 1rem;
          flex: 1;
          transition: background-color 0.2s ease-in-out;
        }

        .step-connector.completed {
          background: #10b981;
        }

        @media (max-width: 767px) {
          .step-connector {
            height: 1rem;
            width: 2px;
            margin: 0.5rem 0 0.5rem 1rem;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .form-progress {
            border: 2px solid #000;
          }

          .step-icon {
            border: 2px solid #000;
          }

          .progress-step.current .step-icon {
            background: #000;
            color: #fff;
          }

          .progress-step.completed .step-icon {
            background: #000;
            color: #fff;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .step-indicator,
          .step-icon,
          .step-connector {
            transition: none;
          }
        }
      `}</style>
    </nav>
  );
}