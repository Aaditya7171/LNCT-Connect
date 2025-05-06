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
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log the error for debugging
    console.error('API Error:', error.response?.status, error.response?.data);

    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Only redirect to login if we're not already on the auth page
      // This prevents redirect loops
      if (window.location.pathname !== '/auth') {
        console.log('Authentication error, redirecting to login page');
        
        // Clear token to prevent further failed requests
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