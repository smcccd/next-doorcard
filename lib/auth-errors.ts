/**
 * Centralized authentication error handling and mapping
 * Maps NextAuth error codes to user-friendly messages with actionable guidance
 */

export type ErrorSeverity = "critical" | "warning" | "info";

export interface AuthErrorInfo {
  title: string;
  description: string;
  severity: ErrorSeverity;
  action: string;
  steps?: string[];
  showITSupport?: boolean;
  technicalDetails?: string;
}

/**
 * Maps NextAuth error codes to user-friendly error information
 * Follows enterprise UX best practices for small user groups
 */
export function getAuthErrorInfo(errorCode: string | null): AuthErrorInfo {
  switch (errorCode) {
    // OAuth Callback Errors
    case "OAuthCallback":
      return {
        title: "Authentication Failed",
        description:
          "We couldn't complete your sign-in with OneLogin. This usually happens when the authentication process was interrupted or took too long.",
        severity: "warning",
        action: "Try Again",
        steps: [
          "Click the button below to try signing in again",
          "Make sure you complete the OneLogin login within 60 seconds",
          "Check that you're not blocking pop-ups or redirects",
        ],
        technicalDetails:
          "OAuth callback handler failed. Possible causes: expired authorization code, invalid state parameter, or token exchange failure.",
      };

    case "invalid_grant":
      return {
        title: "Login Session Expired",
        description:
          "Your login attempt took too long or was already used. This is a security measure to protect your account.",
        severity: "warning",
        action: "Sign In Again",
        steps: [
          "Click the sign-in button below",
          "Complete the OneLogin authentication promptly",
          "Don't use the back button during authentication",
        ],
        technicalDetails:
          "OAuth invalid_grant error: Authorization code expired or already consumed. Redirect URI may also be misconfigured.",
      };

    // Account Linking Errors
    case "OAuthAccountNotLinked":
      return {
        title: "Email Already in Use",
        description:
          "Your email address is already associated with a different login method. For security, we can't automatically link these accounts.",
        severity: "critical",
        action: "Contact IT Support",
        steps: [
          "Contact IT support with your email address",
          "They can verify your identity and link your accounts",
          "Or they can help you use the correct login method",
        ],
        showITSupport: true,
        technicalDetails:
          "Email address exists but is linked to a different OAuth provider or authentication method.",
      };

    // Account Creation Errors
    case "OAuthCreateAccount":
      return {
        title: "Access Not Granted",
        description:
          "You don't have access to the Faculty Doorcard system yet. Your IT administrator needs to grant you access first.",
        severity: "critical",
        action: "Request Access",
        steps: [
          "Contact your IT administrator",
          "Request access to the 'Faculty Doorcard' application",
          "Wait for confirmation that access has been granted",
          "Try logging in again",
        ],
        showITSupport: true,
        technicalDetails:
          "User account creation failed. User may not exist in allowed groups or database constraints failed.",
      };

    case "EmailCreateAccount":
      return {
        title: "Account Setup Failed",
        description:
          "We couldn't create your account. This might be a temporary issue or a configuration problem.",
        severity: "critical",
        action: "Contact IT Support",
        steps: [
          "Wait a few minutes and try again",
          "If the problem persists, contact IT support",
          "They may need to create your account manually",
        ],
        showITSupport: true,
        technicalDetails:
          "Email provider account creation failed. Database constraints or email verification issues.",
      };

    // Access Denied Errors
    case "AccessDenied":
    case "access_denied":
      return {
        title: "Access Denied",
        description:
          "You don't have permission to access this application. Please ensure you're using your SMCCD credentials and have been granted access.",
        severity: "critical",
        action: "Verify Credentials",
        steps: [
          "Make sure you're using your @smccd.edu email",
          "Verify you have faculty access permissions",
          "Contact IT if you believe you should have access",
        ],
        showITSupport: true,
        technicalDetails:
          "Access denied by authorization callback or insufficient permissions.",
      };

    // Credentials Errors
    case "CredentialsSignin":
      return {
        title: "Login Failed",
        description:
          "The email or password you entered is incorrect. Please check your credentials and try again.",
        severity: "warning",
        action: "Try Again",
        steps: [
          "Double-check your email address",
          "Make sure Caps Lock is off",
          "Use the 'Forgot Password' link if needed",
        ],
        technicalDetails:
          "Credentials provider authorization returned null. Invalid username/password combination.",
      };

    // Session Errors
    case "SessionRequired":
      return {
        title: "Login Required",
        description:
          "You need to be logged in to access this page. Your session may have expired or you haven't logged in yet.",
        severity: "info",
        action: "Sign In",
        steps: [
          "Click the sign-in button below",
          "Log in with your SMCCD OneLogin credentials",
          "You'll be redirected back to where you were trying to go",
        ],
        technicalDetails:
          "Protected page accessed without valid session. Session expired or user not authenticated.",
      };

    // OAuth Sign-in Errors
    case "OAuthSignin":
      return {
        title: "Authentication Setup Error",
        description:
          "There was a problem starting the authentication process. This is usually a configuration issue.",
        severity: "critical",
        action: "Contact IT Support",
        steps: [
          "Try refreshing the page and signing in again",
          "If the problem persists, contact IT support",
          "This may require administrator attention",
        ],
        showITSupport: true,
        technicalDetails:
          "Failed to construct OAuth authorization URL. Configuration or provider issue.",
      };

    case "Callback":
      return {
        title: "Authentication Error",
        description:
          "An error occurred while processing your login. This could be a temporary network issue or a configuration problem.",
        severity: "warning",
        action: "Try Again",
        steps: [
          "Check your internet connection",
          "Try signing in again",
          "If this keeps happening, contact IT support",
        ],
        showITSupport: true,
        technicalDetails:
          "OAuth callback handler route error. Network issues or malformed response from provider.",
      };

    // Configuration Errors
    case "Configuration":
      return {
        title: "System Configuration Error",
        description:
          "There's a problem with the authentication system configuration. This requires administrator attention.",
        severity: "critical",
        action: "Contact IT Support",
        steps: [
          "Contact IT support immediately",
          "Let them know you received a 'Configuration' error",
          "They will need to review the authentication setup",
        ],
        showITSupport: true,
        technicalDetails:
          "NextAuth configuration error. Check environment variables, OAuth client settings, and provider configuration.",
      };

    // Email Verification Errors
    case "Verification":
      return {
        title: "Verification Link Expired",
        description:
          "The verification link you clicked has expired or has already been used. Verification links are only valid for 24 hours.",
        severity: "warning",
        action: "Request New Link",
        steps: [
          "Go back to the sign-in page",
          "Enter your email address",
          "Request a new verification link",
          "Check your email and click the new link within 24 hours",
        ],
        technicalDetails:
          "Email verification token expired or already consumed. Tokens expire after 24 hours.",
      };

    case "EmailSignin":
      return {
        title: "Email Delivery Failed",
        description:
          "We couldn't send the sign-in email to your address. This could be a temporary email system issue.",
        severity: "warning",
        action: "Try Again",
        steps: [
          "Check that your email address is correct",
          "Wait a few minutes and try again",
          "Check your spam folder",
          "Contact IT if the problem persists",
        ],
        showITSupport: true,
        technicalDetails:
          "Failed to deliver verification email. SMTP issues or invalid email address.",
      };

    // Default/Unknown Errors
    case "Default":
    default:
      return {
        title: "Authentication Error",
        description:
          "An unexpected error occurred during authentication. Please try again or contact support if the problem continues.",
        severity: "warning",
        action: "Try Again",
        steps: [
          "Try signing in again",
          "Clear your browser cache and cookies",
          "Try a different browser",
          "Contact IT if the issue persists",
        ],
        showITSupport: true,
        technicalDetails:
          errorCode
            ? `Unhandled error code: ${errorCode}`
            : "No error code provided",
      };
  }
}

/**
 * Get severity color classes for Tailwind CSS
 */
export function getSeverityColorClasses(severity: ErrorSeverity): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  switch (severity) {
    case "critical":
      return {
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-800 dark:text-red-200",
        icon: "text-red-600 dark:text-red-400",
      };
    case "warning":
      return {
        bg: "bg-orange-50 dark:bg-orange-900/20",
        border: "border-orange-200 dark:border-orange-800",
        text: "text-orange-800 dark:text-orange-200",
        icon: "text-orange-600 dark:text-orange-400",
      };
    case "info":
      return {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-800 dark:text-blue-200",
        icon: "text-blue-600 dark:text-blue-400",
      };
  }
}
