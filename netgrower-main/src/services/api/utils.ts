import api from './client';

// Test database connection
export const testDatabaseConnection = async () => {
    try {
        const response = await api.get('/health-check');
        console.log('Database connection test:', response.data);
        return response.data;
    } catch (error) {
        console.error('Database connection test failed:', error);
        throw error;
    }
};

// Renamed to avoid conflict with other exports
export const checkProfileData = async (userId: string) => {
    try {
        console.log("Debug: Checking profile data for user ID:", userId);

        // Check authentication first
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("No authentication token found");
            return { isAuthenticated: false, error: "No authentication token" };
        }

        // 1. Check localStorage
        const localStorageUser = localStorage.getItem('user');
        console.log("Debug: User data in localStorage:", localStorageUser ? JSON.parse(localStorageUser) : null);

        // 2. Fetch from API
        const response = await api.get(`/users/${userId}`);
        console.log("Debug: User data from API:", response.data);

        return {
            isAuthenticated: true,
            localStorage: localStorageUser ? JSON.parse(localStorageUser) : null,
            api: response.data,
            match: JSON.stringify(localStorageUser) === JSON.stringify(response.data)
        };
    } catch (error) {
        console.error("Debug: Error fetching profile data:", error);

        // Check if it's an authentication error
        if (error.response && error.response.status === 401) {
            console.warn("Authentication token invalid or expired");
            return { isAuthenticated: false, error: "Authentication failed" };
        }

        return {
            error: error,
            localStorage: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null
        };
    }
};

// Add a function to check authentication status
export const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    return {
        isAuthenticated: !!(token && userId),
        token,
        userId
    };
};