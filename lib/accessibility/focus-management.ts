/**
 * Focus management utilities for keyboard navigation
 */

/**
 * Focus trap for modal dialogs
 */
export function createFocusTrap(container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[
    focusableElements.length - 1
  ] as HTMLElement;

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      // Shift + Tab (backwards)
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab (forwards)
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }

  // Set initial focus
  firstElement?.focus();

  // Add event listener
  container.addEventListener("keydown", handleTabKey);

  // Return cleanup function
  return () => {
    container.removeEventListener("keydown", handleTabKey);
  };
}

/**
 * Announce content to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
) {
  const announcement = document.createElement("div");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Skip to main content functionality
 */
export function setupSkipLinks() {
  const skipLink = document.querySelector(
    'a[href="#main-content"]'
  ) as HTMLAnchorElement;
  const mainContent = document.querySelector("#main-content") as HTMLElement;

  if (skipLink && mainContent) {
    skipLink.addEventListener("click", (e) => {
      e.preventDefault();
      mainContent.focus();
      mainContent.scrollIntoView();
    });
  }
}

/**
 * Manage focus for single-page app navigation
 */
export function manageFocusOnRouteChange(pageTitle: string) {
  // Announce page change
  announceToScreenReader(`Navigated to ${pageTitle}`, "assertive");

  // Focus on main heading or main content
  const mainHeading = document.querySelector("h1") as HTMLElement;
  const mainContent = document.querySelector("#main-content") as HTMLElement;

  if (mainHeading) {
    mainHeading.focus();
  } else if (mainContent) {
    mainContent.focus();
  }
}
