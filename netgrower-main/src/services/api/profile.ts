import api, { API_URL } from './client';
import axios from 'axios';

export const getProfile = async (userId: string) => {
    console.log("Fetching profile for user ID:", userId);

    if (!userId) {
        console.error("Invalid user ID provided to getProfile");
        throw new Error("Invalid user ID");
    }

    try {
        // Check if token exists before making the request
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("No authentication token found");
            throw new Error("Authentication required");
        }

        // Add cache-busting parameter to prevent browser caching
        const timestamp = new Date().getTime();
        const response = await axios.get(`${API_URL}/api/users/${userId}?nocache=${timestamp}`, {
            headers: {
                'x-auth-token': token,
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Profile API response:", response.data);

        // Ensure we're returning the data in the expected format
        if (response.data) {
            // Log the exact structure to help debug
            console.log("Profile data structure:", JSON.stringify(response.data, null, 2));
        }

        return { data: response.data };
    } catch (error) {
        console.error("Error fetching profile:", error);

        // If it's an auth error, clear the token and redirect
        if (error.response?.status === 401) {
            console.log("Authentication failed, clearing token");
            localStorage.removeItem('token');

            // Only redirect if we're in a browser context and not already on the auth page
            if (typeof window !== 'undefined' &&
                window.location.pathname !== '/auth') {
                window.location.href = '/auth';
            }
        }

        throw error;
    }
};

// Update the updateProfile function to properly handle form data
export const updateProfile = async (userId: string, profileData: FormData) => {
    console.log("Updating profile for user ID:", userId, "with data:", Object.fromEntries(profileData));

    try {
        // Check if there's a profile picture in the form data
        const profilePicture = profileData.get('profile_picture');

        // First, update the basic profile information
        const basicFormData = new FormData();
        for (const [key, value] of profileData.entries()) {
            if (key !== 'profile_picture') {
                // Ensure we're sending empty strings properly
                basicFormData.append(key, value === null ? '' : value);
            }
        }

        // Get the token directly from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found. Please log in again.');
        }

        console.log("Updating profile without image");
        // Log the token for debugging (only the first few characters)
        console.log("Token being used (first 10 chars):", token.substring(0, 10) + "...");

        // Use the API instance with interceptors instead of direct axios
        const basicResponse = await api.put(`/api/users/${userId}`, basicFormData, {
            timeout: 15000, // Increase timeout
            headers: {
                // Don't set Content-Type for FormData - axios will set it with boundary
            }
        });

        console.log("Basic profile update response:", basicResponse.data);

        // If there's a profile picture, upload it separately
        if (profilePicture instanceof File && profilePicture.size > 0) {
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
            imageFormData.append('avatar', imageToUpload);

            // Log the form data to verify the file is being included
            console.log("Form data entries for avatar upload:");
            for (const [key, value] of imageFormData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: File (${value.name}, ${value.type}, ${value.size} bytes)`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }

            console.log("Now uploading the image with field name 'avatar'");
            try {
                // Try the dedicated avatar endpoint using direct axios for more control
                const token = localStorage.getItem('token');

                // Log the request details
                console.log("Making POST request to:", `${API_URL}/api/users/${userId}/avatar`);
                console.log("With token (first 10 chars):", token ? token.substring(0, 10) + "..." : "No token");

                const imageResponse = await axios.post(`${API_URL}/api/users/${userId}/avatar`, imageFormData, {
                    timeout: 30000, // 30 seconds timeout for image uploads
                    headers: {
                        // Don't set Content-Type for FormData - axios will set it with boundary
                        'x-auth-token': token,
                        'Authorization': `Bearer ${token}`
                    }
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
                    // Try a direct approach using the regular update endpoint
                    console.log("Using direct profile update with image");

                    // Create a new FormData with all the basic info plus the image
                    const altFormData = new FormData();

                    // Add all the basic fields from the original form data
                    for (const [key, value] of basicFormData.entries()) {
                        altFormData.append(key, value);
                    }

                    // Add the image with the correct field name
                    altFormData.append('profile_picture', imageToUpload);

                    // Make the request
                    const altResponse = await api.put(`/api/users/${userId}`, altFormData, {
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

            // If it's an auth error, clear the token and redirect
            if (error.response.status === 401) {
                console.log("Authentication failed during profile update, refreshing token");

                // Instead of immediately redirecting, we'll throw a more specific error
                throw new Error('Your session has expired. Please refresh the page and try again.');
            }
        }

        throw error;
    }
};

export const uploadProfilePicture = async (userId: string, imageFile: File) => {
    console.log("Uploading profile picture for user ID:", userId);

    try {
        // Create a new FormData object
        const formData = new FormData();
        formData.append('avatar', imageFile);

        // Get token directly
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        // Use axios directly instead of the api instance
        const response = await axios.put(`${API_URL}/api/users/${userId}`, formData, {
            headers: {
                // Don't set Content-Type for FormData
                'x-auth-token': token
            },
            timeout: 30000 // 30 seconds timeout for file uploads
        });

        console.log("Profile picture upload response:", response.data);

        // Update the user data in localStorage with the new profile picture URL
        if (response.data && response.data.profile_picture) {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            userData.profile_picture = response.data.profile_picture;
            localStorage.setItem('user', JSON.stringify(userData));

            // Also store profile picture URL separately for easy access in messaging
            localStorage.setItem('userProfilePic', response.data.profile_picture);

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

export const debugProfileData = async (userId: string) => {
    try {
        console.log("Debug: Checking profile data for user ID:", userId);

        // 1. Check localStorage
        const localStorageUser = localStorage.getItem('user');
        console.log("Debug: User data in localStorage:", localStorageUser ? JSON.parse(localStorageUser) : null);

        // 2. Fetch from API
        const response = await api.get(`/api/users/${userId}`);
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