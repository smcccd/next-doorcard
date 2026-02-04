/**
 * Request deduplication utility to prevent identical concurrent requests
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

/**
 * Request deduplication manager
 */
class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly ttl: number; // Time to live in milliseconds

  constructor(ttl = 30000) {
    // Default 30 seconds TTL
    this.ttl = ttl;
  }

  /**
   * Generate a cache key for a request
   */
  private generateKey(url: string, options: RequestInit = {}): string {
    const { method = "GET", body, headers } = options;

    // Include relevant request parameters in the key
    const keyData = {
      url,
      method,
      body: body instanceof FormData ? "[FormData]" : body,
      headers: headers ? JSON.stringify(headers) : null,
    };

    return btoa(JSON.stringify(keyData));
  }

  /**
   * Clean up expired requests
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.ttl) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Deduplicate a request
   */
  async deduplicate<T>(
    url: string,
    requestFn: () => Promise<T>,
    options: RequestInit = {}
  ): Promise<T> {
    // Skip deduplication for non-idempotent methods by default
    const method = options.method?.toUpperCase() || "GET";
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      return requestFn();
    }

    const key = this.generateKey(url, options);
    this.cleanup();

    // Check if we have a pending request for this key
    const existing = this.pendingRequests.get(key);
    if (existing) {
      console.log(`[RequestDeduplicator] Deduplicating request to ${url}`);
      return existing.promise;
    }

    // Create new request
    console.log(`[RequestDeduplicator] Making new request to ${url}`);
    const promise = requestFn();

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    // Clean up when request completes (success or failure)
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get stats about pending requests
   */
  getStats(): { pendingCount: number; oldestRequest: number | null } {
    const now = Date.now();
    let oldestTimestamp: number | null = null;

    for (const request of this.pendingRequests.values()) {
      if (oldestTimestamp === null || request.timestamp < oldestTimestamp) {
        oldestTimestamp = request.timestamp;
      }
    }

    return {
      pendingCount: this.pendingRequests.size,
      oldestRequest: oldestTimestamp ? now - oldestTimestamp : null,
    };
  }
}

/**
 * Global request deduplicator instance
 */
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Hook to use request deduplication in React components
 */
export function useRequestDeduplication() {
  return {
    deduplicate: requestDeduplicator.deduplicate.bind(requestDeduplicator),
    clear: requestDeduplicator.clear.bind(requestDeduplicator),
    getStats: requestDeduplicator.getStats.bind(requestDeduplicator),
  };
}
