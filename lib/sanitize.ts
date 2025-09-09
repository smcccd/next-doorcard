import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Server-side DOMPurify setup
const window = new JSDOM("").window;
const purify = DOMPurify(window as any);

/**
 * Configuration for different types of content sanitization
 */
const sanitizeConfigs = {
  // For user display names, appointment names, etc - no HTML allowed
  text: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },

  // For rich content (if we add it later) - allow basic formatting
  basic: {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br"],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },

  // For URLs - very strict
  url: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(
  input: string | null | undefined,
  type: "text" | "basic" | "url" = "text"
): string {
  if (!input || typeof input !== "string") return "";

  // First pass - remove any HTML tags and decode entities
  const cleaned = purify.sanitize(input, sanitizeConfigs[type]);

  // Additional validation for URLs
  if (type === "url") {
    try {
      // Only allow http/https URLs
      const url = new URL(cleaned);
      if (!["http:", "https:"].includes(url.protocol)) {
        return "";
      }
      return cleaned;
    } catch {
      // Invalid URL format
      return "";
    }
  }

  return cleaned.trim();
}

/**
 * Sanitize an object's string properties
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fieldConfig: Partial<Record<keyof T, "text" | "basic" | "url">> = {}
): T {
  const sanitized = { ...obj };

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      const sanitizeType = fieldConfig[key as keyof T] || "text";
      sanitized[key as keyof T] = sanitizeInput(
        value,
        sanitizeType
      ) as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize user registration data
 */
export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
}

export function sanitizeRegistrationData(
  data: UserRegistrationData
): UserRegistrationData {
  return {
    name: sanitizeInput(data.name, "text"),
    email: sanitizeInput(data.email?.toLowerCase(), "text"), // Email should be lowercase
    password: data.password, // Don't sanitize passwords - validate separately
  };
}

/**
 * Validate and sanitize doorcard data
 */
export interface DoorcardData {
  name?: string;
  doorcardName?: string;
  officeNumber?: string;
  website?: string;
  [key: string]: any;
}

export function sanitizeDoorcardData(data: DoorcardData): DoorcardData {
  return sanitizeObject(data, {
    name: "text",
    doorcardName: "text",
    officeNumber: "text",
    website: "url",
  });
}

/**
 * Validate and sanitize appointment data
 */
export interface AppointmentData {
  name?: string;
  location?: string;
  category?: string;
  [key: string]: any;
}

export function sanitizeAppointmentData(
  data: AppointmentData
): AppointmentData {
  return sanitizeObject(data, {
    name: "text",
    location: "text",
    category: "text",
  });
}

/**
 * Additional validation functions
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isStrongPassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  return { valid: true };
}

export function validateName(name: string): {
  valid: boolean;
  message?: string;
} {
  const sanitized = sanitizeInput(name, "text");

  if (!sanitized || sanitized.length < 2) {
    return { valid: false, message: "Name must be at least 2 characters long" };
  }

  if (sanitized.length > 100) {
    return { valid: false, message: "Name must be less than 100 characters" };
  }

  // Only allow letters, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z\s\-\'\.]+$/.test(sanitized)) {
    return { valid: false, message: "Name contains invalid characters" };
  }

  return { valid: true };
}
