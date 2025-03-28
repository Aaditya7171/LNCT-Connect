export const API_URL = 'http://localhost:5000';

import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth API calls
// Update the login and register functions

export const registerUser = async (userData: { email: string; password: string; name: string }) => {
    console.log("Registering user with data:", userData);

    // Validate that we have all required fields before making the API call
    if (!userData.name || !userData.email || !userData.password) {
        console.error("Missing required fields for registration:", {
            hasName: !!userData.name,
            hasEmail: !!userData.email,
            hasPassword: !!userData.password
        });
        throw new Error("Please fill in all required fields");
    }

    try {
        const response = await api.post('/users/register', userData);
        console.log("Registration response:", response.data);

        // Store token and user data in localStorage
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('userId', response.data.user.id.toString());
            console.log("Stored user data in localStorage");
        }

        return response.data;
    } catch (error) {
        console.error("Error during registration:", error);

        // Provide more detailed error message
        if (error.response && error.response.data) {
            throw new Error(error.response.data.msg || "Registration failed");
        }

        throw error;
    }
};

export const loginUser = async (credentials: { email: string; password: string }) => {
    console.log("Logging in user with email:", credentials.email);

    try {
        const response = await api.post('/users/login', credentials);
        console.log("Login response:", response.data);

        // Store token and user data in localStorage
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('userId', response.data.user.id.toString());
            console.log("Stored user data in localStorage");
        }

        return response.data;
    } catch (error) {
        console.error("Error during login:", error);

        // Provide more detailed error message
        if (error.response && error.response.data) {
            throw new Error(error.response.data.msg || "Login failed");
        }

        throw error;
    }
};

// Profile API calls
export const getProfile = async (userId: string) => {
    console.log("Fetching profile for user ID:", userId);

    if (!userId) {
        console.error("Invalid user ID provided to getProfile");
        throw new Error("Invalid user ID");
    }

    try {
        // Add cache-busting parameter to prevent browser caching
        const timestamp = new Date().getTime();
        const response = await api.get(`/users/${userId}?nocache=${timestamp}`);
        console.log("Profile API response:", response.data);

        // Ensure we're returning the data in the expected format
        if (response.data) {
            // Log the exact structure to help debug
            console.log("Profile data structure:", JSON.stringify(response.data, null, 2));
        }

        return { data: response.data };
    } catch (error) {
        console.error("Error fetching profile:", error);
        throw error;
    }
};

// Update the updateProfile function to handle the full URL for profile pictures
// Update the updateProfile function to handle the initial profile setup without an image
export const updateProfile = async (userId: string, profileData: FormData) => {
    console.log("Updating profile for user ID:", userId, "with data:", Object.fromEntries(profileData));

    try {
        // Check if there's a profile picture in the form data
        const profilePicture = profileData.get('profile_picture');

        // First, update the basic profile information
        const basicFormData = new FormData();
        for (const [key, value] of profileData.entries()) {
            if (key !== 'profile_picture') {
                basicFormData.append(key, value);
            }
        }

        console.log("Updating profile without image");
        const basicResponse = await api.put(`/users/${userId}`, basicFormData, {
            timeout: 10000
        });

        console.log("Basic profile update response:", basicResponse.data);

        // If there's a profile picture, upload it separately
        if (profilePicture instanceof File) {
            // Process and upload the image as before
            console.log("Profile picture details:", {
                name: profilePicture.name,
                type: profilePicture.type,
                size: `${(profilePicture.size / 1024).toFixed(2)} KB`
            });

            // Try to resize the image to reduce size
            let imageToUpload = profilePicture;
            try {
                if (profilePicture.size > 1024 * 1024) { // If larger than 1MB
                    console.log("Resizing large image before upload");
                    imageToUpload = await resizeImage(profilePicture, 800, 800);
                    console.log("Image resized to:", {
                        size: `${(imageToUpload.size / 1024).toFixed(2)} KB`
                    });
                }
            } catch (resizeError) {
                console.error("Error resizing image:", resizeError);
                // Continue with original image if resize fails
                imageToUpload = profilePicture;
            }

            // Create a new FormData object specifically for the image
            const imageFormData = new FormData();

            // Try different field names that the server might expect
            // The most common field names for file uploads are 'file', 'image', 'avatar', 'profile_picture'
            imageFormData.append('avatar', imageToUpload);

            console.log("Now uploading the image with field name 'avatar'");
            try {
                // Try the dedicated avatar endpoint
                const imageResponse = await api.post(`/users/${userId}/avatar`, imageFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 30000 // 30 seconds timeout for file uploads
                });

                console.log("Profile picture upload response:", imageResponse.data);

                // Combine the responses
                return {
                    data: {
                        ...basicResponse.data,
                        profile_picture: imageResponse.data.profile_picture || basicResponse.data.profile_picture
                    }
                };
            } catch (avatarEndpointError) {
                console.error("Error uploading to avatar endpoint:", avatarEndpointError);

                // If the avatar endpoint fails, try the regular update endpoint with the image
                console.log("Trying alternative upload method...");

                try {
                    const altFormData = new FormData();
                    altFormData.append('profile_picture', imageToUpload);

                    const altResponse = await api.put(`/users/${userId}`, altFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                        timeout: 30000
                    });

                    console.log("Alternative upload response:", altResponse.data);

                    return {
                        data: {
                            ...basicResponse.data,
                            ...altResponse.data
                        }
                    };
                } catch (altError) {
                    console.error("Alternative upload method failed:", altError);
                    // Return the basic response even if all image upload attempts fail
                    return basicResponse;
                }
            }
        }

        // No profile picture provided, we'll use the first letter avatar
        // This is handled by the UI, so we just return the basic response
        console.log("No profile picture provided, using letter avatar");
        return basicResponse;
    } catch (error) {
        console.error("Error updating profile:", error);

        // Log more detailed error information
        if (error.response) {
            console.error("Server response error:", {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }

        throw error;
    }
};

// Helper function to resize images before upload
const resizeImage = async (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * maxWidth / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * maxHeight / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Convert to blob with reduced quality
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Canvas to Blob conversion failed'));
                        return;
                    }

                    // Create new file from blob
                    const resizedFile = new File([blob], file.name, {
                        type: 'image/jpeg', // Convert to JPEG for better compression
                        lastModified: Date.now()
                    });

                    resolve(resizedFile);
                }, 'image/jpeg', 0.7); // 70% quality JPEG for better compression
            };
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            img.src = event.target?.result as string;
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
    });
};

// Check if a user exists - keeping only one implementation
export const checkUserExists = async (email: string) => {
    try {
        const response = await api.post('/users/check-email', { email });
        return response.data.exists;
    } catch (error) {
        console.error('Error checking user:', error);
        return false;
    }
};

// Add a test function to verify database connection
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

// Add a debug function to verify profile data
export const debugProfileData = async (userId: string) => {
    try {
        console.log("Debug: Checking profile data for user ID:", userId);

        // 1. Check localStorage
        const localStorageUser = localStorage.getItem('user');
        console.log("Debug: User data in localStorage:", localStorageUser ? JSON.parse(localStorageUser) : null);

        // 2. Fetch from API
        const response = await api.get(`/users/${userId}`);
        console.log("Debug: User data from API:", response.data);

        return {
            localStorage: localStorageUser ? JSON.parse(localStorageUser) : null,
            api: response.data,
            match: JSON.stringify(localStorageUser) === JSON.stringify(response.data)
        };
    } catch (error) {
        console.error("Debug: Error fetching profile data:", error);
        return {
            error: error,
            localStorage: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null
        };
    }
};

// Add this before the export default api line
export const logoutUser = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    localStorage.removeItem('isNewUser');

    console.log("User logged out, localStorage cleared");

    // You could also invalidate the token on the server side if needed
    // return api.post('/users/logout');
};

// Add this function to handle profile picture uploads separately
export const uploadProfilePicture = async (userId: string, imageFile: File) => {
    console.log("Uploading profile picture for user ID:", userId);

    try {
        // Create a new FormData object
        const formData = new FormData();

        // The server is expecting a different field name than 'profile_picture'
        // Try using the field name that the server expects
        formData.append('avatar', imageFile); // Try 'avatar' instead of 'profile_picture'

        // Use the regular update endpoint since the dedicated endpoint might not exist
        const response = await api.put(`/users/${userId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000 // 30 seconds timeout for file uploads
        });

        console.log("Profile picture upload response:", response.data);

        // Update the user data in localStorage with the new profile picture URL
        if (response.data && response.data.profile_picture) {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            userData.profile_picture = response.data.profile_picture;
            localStorage.setItem('user', JSON.stringify(userData));
            console.log("Updated profile picture in localStorage:", userData.profile_picture);
        }

        return response;
    } catch (error) {
        console.error("Error uploading profile picture:", error);

        // Log more detailed error information
        if (error.response) {
            console.error("Server response error details:", {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }

        throw error;
    }
};

export default api;