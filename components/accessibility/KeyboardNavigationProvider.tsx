"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { announceToScreenReader, manageFocusOnRouteChange } from '@/lib/accessibility/focus-management';
import { usePathname } from 'next/navigation';

interface KeyboardNavigationContextType {
  isKeyboardUser: boolean;
  announceToUser: (message: string, priority?: 'polite' | 'assertive') => void;
  focusMainContent: () => void;
}

const KeyboardNavigationContext = createContext<KeyboardNavigationContextType | null>(null);

export function useKeyboardNavigation() {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error('useKeyboardNavigation must be used within KeyboardNavigationProvider');
  }
  return context;
}

interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
}

export function KeyboardNavigationProvider({ children }: KeyboardNavigationProviderProps) {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let keyboardTimer: NodeJS.Timeout | undefined;

    // Detect keyboard usage
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
        document.body.classList.add('keyboard-user');
      }
    };

    // Reset keyboard detection on mouse use
    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      document.body.classList.remove('keyboard-user');
      if (keyboardTimer) {
        clearTimeout(keyboardTimer);
        keyboardTimer = undefined;
      }
    };

    // Global keyboard shortcuts
    const handleGlobalKeyboard = (e: KeyboardEvent) => {
      // Skip to main content (Alt + M)
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
          announceToScreenReader('Skipped to main content', 'assertive');
        }
      }

      // Skip to navigation (Alt + N)
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        const navigation = document.querySelector('nav') || document.querySelector('[role="navigation"]');
        if (navigation) {
          (navigation as HTMLElement).focus();
          announceToScreenReader('Skipped to navigation', 'assertive');
        }
      }

      // Help dialog (Alt + H)
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        announceToScreenReader('Keyboard shortcuts: Alt+M for main content, Alt+N for navigation, Alt+H for help', 'assertive');
      }

      // Close modal/dialog (Escape)
      if (e.key === 'Escape') {
        const openModal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (openModal) {
          const closeButton = openModal.querySelector('[aria-label*="close"], [aria-label*="Close"], button[data-close]') as HTMLButtonElement;
          if (closeButton) {
            closeButton.click();
            announceToScreenReader('Dialog closed', 'assertive');
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleGlobalKeyboard);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleGlobalKeyboard);
      if (keyboardTimer) {
        clearTimeout(keyboardTimer);
      }
    };
  }, []);

  // Handle route changes for screen readers
  useEffect(() => {
    const pageTitle = document.title;
    if (pageTitle) {
      manageFocusOnRouteChange(pageTitle);
    }
  }, [pathname]);

  const announceToUser = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  };

  const focusMainContent = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      announceToUser('Focused on main content', 'assertive');
    }
  };

  return (
    <KeyboardNavigationContext.Provider
      value={{
        isKeyboardUser,
        announceToUser,
        focusMainContent,
      }}
    >
      {/* Live region for announcements */}
      <div
        id="accessibility-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Assertive announcements */}
      <div
        id="accessibility-announcements-assertive"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Skip navigation links */}
      <div className="skip-links">
        <a
          href="#main-content"
          className="skip-link"
          onFocus={() => announceToUser('Skip to main content link')}
        >
          Skip to main content
        </a>
        <a
          href="#navigation"
          className="skip-link"
          onFocus={() => announceToUser('Skip to navigation link')}
        >
          Skip to navigation
        </a>
      </div>

      {children}

      <style jsx>{`
        .skip-links {
          position: absolute;
          top: -100px;
          left: 0;
          z-index: 1000;
        }

        .skip-link {
          position: absolute;
          top: 0;
          left: 0;
          background: #000;
          color: #fff;
          padding: 8px 16px;
          text-decoration: none;
          font-weight: bold;
          border-radius: 0 0 4px 0;
          transform: translateY(-100%);
          transition: transform 0.2s ease-in-out;
        }

        .skip-link:focus {
          transform: translateY(0);
        }

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

        /* Enhanced focus indicators for keyboard users */
        :global(.keyboard-user) *:focus {
          outline: 3px solid #3b82f6 !important;
          outline-offset: 2px !important;
        }

        :global(.keyboard-user) button:focus,
        :global(.keyboard-user) [role="button"]:focus {
          outline: 3px solid #1d4ed8 !important;
          background-color: #eff6ff !important;
        }

        :global(.keyboard-user) input:focus,
        :global(.keyboard-user) select:focus,
        :global(.keyboard-user) textarea:focus {
          outline: 3px solid #059669 !important;
          border-color: #10b981 !important;
        }

        :global(.keyboard-user) a:focus {
          outline: 3px solid #7c3aed !important;
          background-color: #f3e8ff !important;
        }
      `}</style>
    </KeyboardNavigationContext.Provider>
  );
}