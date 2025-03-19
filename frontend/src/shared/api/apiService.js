/**
 * API Service
 * Centralized API handling for the application
 */

// API base URL - should be configurable per environment
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';

// Default headers for JSON requests
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * Adds auth token to headers if available
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Makes a fetch request with proper error handling
 */
const fetchWithErrorHandling = async (url, options) => {
  try {
    const response = await fetch(url, options);

    // Parse JSON response if present
    const contentType = response.headers.get('content-type');
    const data = contentType && contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    // Handle error responses
    if (!response.ok) {
      const error = new Error(data.message || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (!error.status) {
      error.message = 'Network error: Please check your connection';
    }

    // Log error but don't expose internals to the caller
    console.error('API Error:', error);

    // Re-throw for the caller to handle
    throw error;
  }
};

/**
 * HTTP methods as a convenient wrapper around fetch
 */
const apiService = {
  /**
   * GET request
   */
  get: async (endpoint, params = {}) => {
    // Build URL with query parameters
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const options = {
      method: 'GET',
      headers: {
        ...defaultHeaders,
        ...getAuthHeaders()
      }
    };

    return fetchWithErrorHandling(url, options);
  },

  /**
   * POST request
   */
  post: async (endpoint, data = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const options = {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    };

    return fetchWithErrorHandling(url, options);
  },

  /**
   * PUT request
   */
  put: async (endpoint, data = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const options = {
      method: 'PUT',
      headers: {
        ...defaultHeaders,
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    };

    return fetchWithErrorHandling(url, options);
  },

  /**
   * PATCH request
   */
  patch: async (endpoint, data = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const options = {
      method: 'PATCH',
      headers: {
        ...defaultHeaders,
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    };

    return fetchWithErrorHandling(url, options);
  },

  /**
   * DELETE request
   */
  delete: async (endpoint) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const options = {
      method: 'DELETE',
      headers: {
        ...defaultHeaders,
        ...getAuthHeaders()
      }
    };

    return fetchWithErrorHandling(url, options);
  },

  /**
   * Upload file(s)
   */
  upload: async (endpoint, formData) => {
    const url = `${API_BASE_URL}${endpoint}`;

    // Don't set Content-Type header, browser will set it with boundary
    const options = {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
      body: formData
    };

    return fetchWithErrorHandling(url, options);
  }
};

export default apiService; 