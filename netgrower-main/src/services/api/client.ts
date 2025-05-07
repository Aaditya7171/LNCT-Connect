import axios from 'axios';

// Define the API URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Send token in both formats to ensure compatibility
      // Make sure we're not modifying the token in any way
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['x-auth-token'] = token;

      // Special handling for FormData - don't set Content-Type
      if (config.data instanceof FormData) {
        console.log('FormData detected, removing Content-Type header to let browser set it with boundary');
        delete config.headers['Content-Type'];
      }

      // Log request details for debugging (without showing the full token)
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        tokenPresent: !!token,
        tokenLength: token.length,
        isFormData: config.data instanceof FormData,
        headers: {
          Authorization: 'Bearer [HIDDEN]',
          'x-auth-token': '[HIDDEN]',
          'Content-Type': config.headers['Content-Type'] || 'auto-set by browser'
        }
      });
    } else {
      console.warn(`API Request without token: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('API Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(`API Response Success: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  (error) => {
    // Log the error for debugging with more details
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Authentication error detected');

      // Check if we're on a profile page or other protected page
      const isProtectedPage = !window.location.pathname.includes('/auth');
      const isProfileEdit = window.location.pathname.includes('/profile');

      if (isProfileEdit) {
        // For profile edit, don't redirect but show a message
        console.log('Auth error on profile edit, not redirecting');
        // We'll let the component handle the error
      } else if (isProtectedPage) {
        console.log('Authentication error on protected page, redirecting to login');

        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('user');

        // Redirect to login page
        window.location.href = '/auth';
      } else {
        console.log('Already on auth page, not redirecting');
      }
    }

    return Promise.reject(error);
  }
);

export default api;