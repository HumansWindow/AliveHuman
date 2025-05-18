/**
 * HTTP client for making API requests
 * 
 * This provides a standardized way to make HTTP requests to the backend
 * with proper error handling and response parsing.
 */

import { ApiResponse, ApiError, ErrorCode } from '../../models/responses';

/**
 * Configuration options for HTTP requests
 */
export interface HttpClientOptions {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
  onUnauthorized?: () => void;
}

/**
 * Request options for individual HTTP requests
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
  signal?: AbortSignal;
}

/**
 * HTTP client for making API requests
 */
export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private withCredentials: boolean;
  private onUnauthorized?: () => void;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.defaultHeaders,
    };
    this.timeout = options.timeout || 30000; // 30 seconds
    this.withCredentials = options.withCredentials || false;
    this.onUnauthorized = options.onUnauthorized;
  }

  /**
   * Set the authorization token for API requests
   * @param token JWT token or null to remove authorization
   */
  setAuthToken(token: string | null): void {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  /**
   * Make a GET request
   * @param url Endpoint URL (will be appended to baseUrl)
   * @param options Request options
   * @returns Promise with the API response
   */
  async get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, options);
  }

  /**
   * Make a POST request
   * @param url Endpoint URL (will be appended to baseUrl)
   * @param data Request body data
   * @param options Request options
   * @returns Promise with the API response
   */
  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data, options);
  }

  /**
   * Make a PUT request
   * @param url Endpoint URL (will be appended to baseUrl)
   * @param data Request body data
   * @param options Request options
   * @returns Promise with the API response
   */
  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data, options);
  }

  /**
   * Make a PATCH request
   * @param url Endpoint URL (will be appended to baseUrl)
   * @param data Request body data
   * @param options Request options
   * @returns Promise with the API response
   */
  async patch<T>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', url, data, options);
  }

  /**
   * Make a DELETE request
   * @param url Endpoint URL (will be appended to baseUrl)
   * @param options Request options
   * @returns Promise with the API response
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  /**
   * Make an HTTP request
   * @param method HTTP method
   * @param url Endpoint URL (will be appended to baseUrl)
   * @param data Request body data
   * @param options Request options
   * @returns Promise with the API response
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const fullUrl = `${this.baseUrl}${url}`;
    const headers = { ...this.defaultHeaders, ...options?.headers };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options?.timeout || this.timeout);
    
    const signal = options?.signal || controller.signal;
    
    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: (options?.withCredentials ?? this.withCredentials) ? 'include' : 'same-origin',
        signal,
      });
      
      clearTimeout(timeoutId);
      
      // Handle unauthorized response
      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }
      
      const contentType = response.headers.get('content-type');
      
      // Parse the response body
      let responseData: ApiResponse<T>;
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        
        responseData = {
          success: response.ok,
          data: text as unknown as T,
        };
      }
      
      // Add error information if the request failed
      if (!response.ok && !responseData.error) {
        responseData.error = {
          code: response.status === 401 ? ErrorCode.UNAUTHORIZED : 
                response.status === 403 ? ErrorCode.FORBIDDEN :
                response.status === 404 ? ErrorCode.RESOURCE_NOT_FOUND :
                ErrorCode.INTERNAL_SERVER_ERROR,
          message: response.statusText,
        };
      }
      
      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle network or abort errors
      const apiError: ApiError = {
        code: error.name === 'AbortError' ? 
              ErrorCode.SERVICE_UNAVAILABLE : 
              ErrorCode.INTERNAL_SERVER_ERROR,
        message: error.message || 'Network error occurred',
        details: error,
      };
      
      return {
        success: false,
        error: apiError,
      };
    }
  }
}

// Export a factory function to create HttpClient instances
export function createHttpClient(options: HttpClientOptions): HttpClient {
  return new HttpClient(options);
}