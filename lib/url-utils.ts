/**
 * URL utility functions for the Next Doorcard application
 */

/**
 * Appends print=true parameter to a URL, handling existing query parameters and fragments correctly
 * @param baseUrl - The base URL to append the print parameter to
 * @returns The URL with print=true properly appended
 *
 * @example
 * getPrintUrl('/view/user') // returns '/view/user?print=true'
 * getPrintUrl('/view/user?theme=dark') // returns '/view/user?theme=dark&print=true'
 * getPrintUrl('/view/user#schedule') // returns '/view/user?print=true#schedule'
 * getPrintUrl('/view/user?theme=dark#schedule') // returns '/view/user?theme=dark&print=true#schedule'
 */
export function getPrintUrl(baseUrl: string): string {
  // Handle URL fragments properly - they must come after query parameters
  const [urlWithoutFragment, fragment] = baseUrl.split("#");

  // Determine the correct separator for query parameters
  const separator = urlWithoutFragment.includes("?") ? "&" : "?";

  // Build the URL with print parameter
  const printUrl = `${urlWithoutFragment}${separator}print=true`;

  // Re-append fragment if it existed (including empty fragments)
  return fragment !== undefined ? `${printUrl}#${fragment}` : printUrl;
}

/**
 * Type guard to check if a URL string contains query parameters
 */
export function hasQueryParams(url: string): boolean {
  // Split by fragment first to ignore anything after #
  const [urlWithoutFragment] = url.split("#");
  return urlWithoutFragment.includes("?");
}

/**
 * Type guard to check if a URL string contains a fragment
 */
export function hasFragment(url: string): boolean {
  return url.includes("#");
}
