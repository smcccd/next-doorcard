/**
 * Centralized API client with built-in error handling, retry, and network awareness
 */

import {
  fetchWithTimeout,
  fetchPresets,
  FetchOptions,
  FetchTimeoutError,
  FetchNetworkError,
} from "./fetch-with-timeout";
import { requestDeduplicator } from "./request-deduplication";

export interface ApiClientOptions extends FetchOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  enableRetry?: boolean;
  enableLogging?: boolean;
  enableDeduplication?: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  status: number;
}

/**
 * Centralized API client class
 */
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private enableRetry: boolean;
  private enableLogging: boolean;
  private enableDeduplication: boolean;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || "";
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...options.defaultHeaders,
    };
    this.enableRetry = options.enableRetry ?? true;
    this.enableLogging =
      options.enableLogging ?? process.env.NODE_ENV === "development";
    this.enableDeduplication = options.enableDeduplication ?? true;
  }

  private log(message: string, data?: any) {
    if (this.enableLogging) {
      console.log(`[ApiClient] ${message}`, data);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestOptions: FetchOptions = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    // Apply retry settings if enabled
    if (this.enableRetry && !("retries" in requestOptions)) {
      requestOptions.retries = 2;
    }

    this.log(`Making request to ${url}`, { options: requestOptions });

    const makeRequest = async () => {
      return await fetchWithTimeout(url, requestOptions);
    };

    try {
      const response = this.enableDeduplication
        ? await requestDeduplicator.deduplicate(
            url,
            makeRequest,
            requestOptions
          )
        : await makeRequest();

      this.log(`Response from ${url}`, {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any;

        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Unknown error" };
        }

        return {
          success: false,
          status: response.status,
          error:
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`,
          data: errorData,
        };
      }

      const data = await response.json();
      return {
        success: true,
        status: response.status,
        data,
      };
    } catch (error) {
      this.log(`Error making request to ${url}`, error);

      let errorMessage = "Network error occurred";

      if (error instanceof FetchTimeoutError) {
        errorMessage = "Request timed out. Please try again.";
      } else if (error instanceof FetchNetworkError) {
        errorMessage =
          "Network connection failed. Check your internet connection.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        status: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...fetchPresets.standard,
      ...options,
      method: "GET",
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...fetchPresets.critical,
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...fetchPresets.critical,
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...fetchPresets.critical,
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...fetchPresets.standard,
      ...options,
      method: "DELETE",
    });
  }

  /**
   * Upload file
   */
  async upload<T>(
    endpoint: string,
    formData: FormData,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    const uploadOptions = {
      ...fetchPresets.heavy,
      ...options,
      method: "POST",
      body: formData,
      headers: {
        // Remove Content-Type to let browser set it with boundary for FormData
        ...Object.fromEntries(
          Object.entries(this.defaultHeaders).filter(
            ([key]) => key.toLowerCase() !== "content-type"
          )
        ),
        ...options?.headers,
      },
    };

    return this.makeRequest<T>(endpoint, uploadOptions);
  }
}

/**
 * Default API client instance
 */
export const apiClient = new ApiClient({
  enableRetry: true,
  enableLogging: process.env.NODE_ENV === "development",
  enableDeduplication: true,
});

/**
 * Convenience hooks for common API patterns
 */
export const api = {
  // User endpoints
  users: {
    getProfile: () => apiClient.get("/api/user/profile"),
    updateProfile: (data: any) => apiClient.patch("/api/user/profile", data),
  },

  // Doorcard endpoints
  doorcards: {
    list: () => apiClient.get("/api/doorcards"),
    get: (id: string) => apiClient.get(`/api/doorcards/${id}`),
    create: (data: any) => apiClient.post("/api/doorcards", data),
    update: (id: string, data: any) =>
      apiClient.patch(`/api/doorcards/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/doorcards/${id}`),
    getPublic: () => apiClient.get("/api/doorcards/public"),
  },

  // Terms endpoints
  terms: {
    getActive: () => apiClient.get("/api/terms/active"),
    getUpcoming: () => apiClient.get("/api/terms/upcoming"),
    getArchive: () => apiClient.get("/api/terms/archive"),
  },

  // Admin endpoints
  admin: {
    getUsers: (params?: Record<string, string>) => {
      const queryString = params
        ? "?" + new URLSearchParams(params).toString()
        : "";
      return apiClient.get(`/api/admin/users${queryString}`);
    },
    getAnalytics: () =>
      apiClient.get("/api/admin/analytics", fetchPresets.heavy),
    getUser: (userId: string) => apiClient.get(`/api/admin/users/${userId}`),
  },
};
