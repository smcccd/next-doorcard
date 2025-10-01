/**
 * Fetch wrapper with timeout, retry, and error handling
 */

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class FetchTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'FetchTimeoutError';
  }
}

export class FetchNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FetchNetworkError';
  }
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (error instanceof FetchTimeoutError) return true;
  if (error instanceof FetchNetworkError) return true;
  if (error instanceof TypeError && error.message.includes('fetch')) return true;
  
  // Retry on 5xx server errors but not 4xx client errors
  if (error instanceof Response) {
    return error.status >= 500 && error.status < 600;
  }
  
  return false;
}

/**
 * Delay function for exponential backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced fetch with timeout and error handling
 */
export async function fetchWithTimeout(
  url: string, 
  options: FetchOptions = {}
): Promise<Response> {
  const { 
    timeout = 10000, 
    retries = 0, 
    retryDelay = 1000,
    ...fetchOptions 
  } = options;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check if response indicates a server error that should be retried
      if (!response.ok && response.status >= 500 && response.status < 600) {
        if (attempt < retries) {
          const backoffDelay = retryDelay * Math.pow(2, attempt);
          await delay(backoffDelay);
          continue;
        }
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      
      let processedError: Error;
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          processedError = new FetchTimeoutError(timeout);
        } else if (error.message.includes('fetch')) {
          processedError = new FetchNetworkError(`Network error: ${error.message}`);
        } else {
          processedError = error;
        }
      } else {
        processedError = new Error('Unknown fetch error');
      }
      
      // Retry if error is retryable and we have attempts left
      if (attempt < retries && isRetryableError(processedError)) {
        const backoffDelay = retryDelay * Math.pow(2, attempt);
        await delay(backoffDelay);
        continue;
      }
      
      throw processedError;
    }
  }
  
  throw lastError;
}

/**
 * Convenience wrapper for JSON responses with timeout and retry
 */
export async function fetchJson<T = any>(
  url: string, 
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Preset configurations for different types of requests
 */
export const fetchPresets = {
  /** Quick operations like status checks */
  quick: { timeout: 5000, retries: 1, retryDelay: 500 },
  /** Standard API calls */
  standard: { timeout: 10000, retries: 2, retryDelay: 1000 },
  /** Heavy operations like analytics or file uploads */
  heavy: { timeout: 30000, retries: 3, retryDelay: 2000 },
  /** Critical operations that must succeed */
  critical: { timeout: 15000, retries: 5, retryDelay: 1000 }
} as const;