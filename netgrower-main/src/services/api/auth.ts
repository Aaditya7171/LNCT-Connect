import api from './client';

// User login function
export const loginUser = async (credentials: { email: string; password: string }) => {
    try {
        console.log(`Attempting to login with email: ${credentials.email}`);

        // Make a direct axios request instead of using the api instance
        // This ensures we're not adding any interceptors that might modify the request
        const response = await api.post('/api/users/login', {
            email: credentials.email,
            password: credentials.password
        });

        if (!response || !response.data) {
            throw new Error('Invalid response from server');
        }

        // Get the raw response data without any transformations
        const responseData = response.data;
        console.log('Raw login response:', JSON.stringify(responseData, null, 2));

        // Extract token directly from the response
        const token = responseData.token;
        const user = responseData.user;

        // Validate token before storing
        if (!token || typeof token !== 'string') {
            throw new Error('Invalid token received from server');
        }

        // Log token details (without revealing the actual token)
        console.log('Login successful, token received', {
            tokenLength: token.length,
            tokenFormat: token.includes('.') ? 'JWT' : 'Unknown'
        });

        // Clear any existing tokens first to prevent conflicts
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('user');

        // Store token exactly as received without any modifications
        localStorage.setItem('token', token);

        // Make sure we have valid user data before storing user properties
        if (user && typeof user === 'object') {
            localStorage.setItem('userId', user.id);
            localStorage.setItem('userName', user.name || '');
            localStorage.setItem('user', JSON.stringify(user));
        }

        // Return the exact response data to ensure consistency
        return responseData;
    } catch (error: any) {
        console.error('Error during login:', error);

        // Handle specific error cases
        if (error.code === 'ERR_NETWORK') {
            throw new Error('Server connection failed. Please check if the server is running.');
        }

        if (error.response) {
            const errorMessage = error.response.data?.message || 'Login failed. Please check your credentials.';
            throw new Error(errorMessage);
        } else if (error.request) {
            throw new Error('No response from server. Please check your internet connection.');
        } else {
            throw new Error(error.message || 'An unexpected error occurred');
        }
    }
};

// Add the logoutUser function
export const logoutUser = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('user');

    // You can also add any additional cleanup here
    // For example, if you're using any state management like Redux, you might want to clear the auth state

    return true; // Return success
};

// Add the checkUserExists function
export const checkUserExists = async (email: string): Promise<boolean> => {
    try {
        const response = await api.post('/api/users/check-email', { email });
        return response.data.exists;
    } catch (error) {
        console.error('Error checking if user exists:', error);
        // If there's an error, we'll assume the user doesn't exist
        return false;
    }
};

// Add the registerUser function to your auth.ts file
export const registerUser = async (userData: { name: string; email: string; password: string }) => {
    try {
        const response = await api.post('/api/users/register', userData);
        return response;
    } catch (error) {
        console.error('Error during registration:', error);
        throw error;
    }
};
