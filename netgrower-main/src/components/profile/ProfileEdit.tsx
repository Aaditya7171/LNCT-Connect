import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { updateProfile, API_URL } from '@/services/api';
import { useEffect } from 'react';

interface ProfileEditProps {
    open: boolean;
    onClose: () => void;
    onProfileUpdate: (updatedProfile: any) => void;
    userId: string;
    currentProfile: {
        name?: string;
        email?: string;
        college?: string;
        branch?: string;
        batch?: string;
        linkedin_url?: string;
        profile_picture?: string;
    };
}

export function ProfileEdit({ open, onClose, onProfileUpdate, userId, currentProfile }: ProfileEditProps) {
    const [formData, setFormData] = useState({
        name: currentProfile.name || '',
        college: currentProfile.college || '',
        branch: currentProfile.branch || '',
        batch: currentProfile.batch || '',
        linkedinUrl: currentProfile.linkedin_url || '',
    });

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentProfile.profile_picture || null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (currentProfile) {
            setFormData({
                name: currentProfile.name || '',
                college: currentProfile.college || '',
                branch: currentProfile.branch || '',
                batch: currentProfile.batch || '',
                linkedinUrl: currentProfile.linkedin_url || '',
            });

            // Remove any timestamp query parameters from the profile picture URL
            let profilePicUrl = currentProfile.profile_picture || null;
            if (profilePicUrl && profilePicUrl.includes('?t=')) {
                profilePicUrl = profilePicUrl.split('?t=')[0];
            }
            setPreviewUrl(profilePicUrl);
        }
    }, [currentProfile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileImage(file);

            // Create preview URL for local display only
            // This is a data URL that will only be used for preview in the edit dialog
            // It will NOT be sent to the server or used as the actual profile picture URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);

            console.log("Image selected for upload:", file.name, file.type, `${(file.size / 1024).toFixed(2)} KB`);
        }
    };

    // Update the handleSubmit function to better handle the profile picture update
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Create FormData object
            const formDataObj = new FormData();
            formDataObj.append('name', formData.name);
            formDataObj.append('college', formData.college);
            formDataObj.append('branch', formData.branch);
            formDataObj.append('batch', formData.batch);
            formDataObj.append('linkedin_url', formData.linkedinUrl);

            // Add profile image if selected
            if (profileImage) {
                // Check file size before uploading
                if (profileImage.size > 2 * 1024 * 1024) { // 2MB limit for client-side validation (matching server limit)
                    toast({
                        variant: "destructive",
                        title: "File too large",
                        description: "Profile picture must be less than 2MB. Please select a smaller image.",
                    });
                    setIsSubmitting(false);
                    return;
                }

                // Ensure we're using the correct field name 'avatar' for the dedicated endpoint
                // This is critical - the server expects 'avatar' as the field name
                console.log("Adding profile image to form data with field name 'avatar'");
                formDataObj.append('avatar', profileImage);

                // Log the form data to verify the file is being included
                console.log("Form data entries:");
                for (const [key, value] of formDataObj.entries()) {
                    if (value instanceof File) {
                        console.log(`${key}: File (${value.name}, ${value.type}, ${value.size} bytes)`);
                    } else {
                        console.log(`${key}: ${value}`);
                    }
                }
            }

            console.log("Submitting form data:", Object.fromEntries(formDataObj));

            // First, update basic profile info without the image
            const basicFormData = new FormData();
            basicFormData.append('name', formData.name);
            basicFormData.append('college', formData.college);
            basicFormData.append('branch', formData.branch);
            basicFormData.append('batch', formData.batch);
            basicFormData.append('linkedin_url', formData.linkedinUrl);

            console.log("Updating basic profile info first");
            const basicResponse = await axios.put(`${API_URL}/api/users/${userId}`, basicFormData, {
                headers: {
                    'x-auth-token': localStorage.getItem('token') || '',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            });

            console.log("Basic profile update response:", basicResponse.data);

            let response = basicResponse;

            // If we have a profile image, upload it separately using the dedicated endpoint
            if (profileImage) {
                console.log("Now uploading profile image separately");

                // Create a new FormData object just for the image
                const imageFormData = new FormData();
                imageFormData.append('avatar', profileImage);

                try {
                    // Call the dedicated avatar upload endpoint directly
                    const imageResponse = await axios.post(`${API_URL}/api/users/${userId}/avatar`, imageFormData, {
                        headers: {
                            'x-auth-token': localStorage.getItem('token') || '',
                            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                        }
                    });

                    console.log("Image upload response:", imageResponse.data);

                    // Combine the responses
                    response = {
                        data: {
                            ...basicResponse.data,
                            profile_picture: imageResponse.data.profile_picture,
                            full_url: imageResponse.data.full_url
                        }
                    };
                } catch (imageError) {
                    console.error("Error uploading profile image:", imageError);
                    toast({
                        variant: "destructive",
                        title: "Image Upload Failed",
                        description: "Your profile was updated but the profile picture could not be uploaded. Please try again.",
                    });
                }
            }
            console.log("Profile update response:", response);

            // Prepare updated profile data for parent component
            const updatedProfile = {
                name: formData.name,
                college: formData.college,
                branch: formData.branch,
                batch: formData.batch,
                linkedin_url: formData.linkedinUrl,
            };

            // Add profile picture if it was updated
            const responseData = response.data?.data || response.data;
            console.log("Full response data:", JSON.stringify(responseData, null, 2));

            if (responseData) {
                // Check if we have the full_url from the server (preferred)
                if (responseData.full_url) {
                    // Use the full URL provided by the server
                    const timestamp = new Date().getTime();
                    updatedProfile.profile_picture = `${responseData.full_url}?t=${timestamp}`;
                    console.log("Using server-provided full URL:", updatedProfile.profile_picture);
                }
                // Fallback to profile_picture path if full_url is not available
                else if (responseData.profile_picture) {
                    // Add timestamp to force refresh
                    const timestamp = new Date().getTime();
                    // Ensure the URL is properly formatted with the API_URL
                    const profilePicPath = responseData.profile_picture;
                    const formattedPath = profilePicPath.startsWith('/') ? profilePicPath : `/${profilePicPath}`;
                    updatedProfile.profile_picture = `${API_URL}${formattedPath}?t=${timestamp}`;
                    console.log("Constructed profile picture URL:", updatedProfile.profile_picture);
                }

                // Only proceed if we have a valid URL (not a data URL)
                if (updatedProfile.profile_picture && !updatedProfile.profile_picture.startsWith('data:')) {
                    // Also update localStorage to ensure consistency across the app
                    const userData = JSON.parse(localStorage.getItem('user') || '{}');
                    // Store the path without the API_URL prefix in localStorage
                    const profilePicPath = responseData.profile_picture || '';
                    userData.profile_picture = profilePicPath;
                    localStorage.setItem('user', JSON.stringify(userData));
                    localStorage.setItem('userProfilePic', profilePicPath);

                    // Preload the image to ensure it's in the browser cache
                    const preloadImg = new Image();
                    preloadImg.src = updatedProfile.profile_picture;
                    console.log("Preloading image:", updatedProfile.profile_picture);

                    // Don't update the preview URL - we'll close the dialog anyway
                }
            } else if (profileImage) {
                // If we uploaded an image but didn't get a profile_picture back in the response,
                // Don't use the data URL as a fallback - it will cause errors
                console.log("No profile data in response, not using local preview");
                // Don't set profile_picture to the data URL
            }

            console.log("Sending updated profile to parent:", updatedProfile);

            // Call the callback function with updated profile data
            onProfileUpdate(updatedProfile);

            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
            });

            onClose();
        } catch (error) {
            console.error("Error updating profile:", error);

            let errorMessage = "Failed to update profile. Please try again.";
            let needsRefresh = false;

            if (error.code === 'ECONNABORTED') {
                errorMessage = "The request timed out. Please try again with a smaller image.";
            } else if (error.response && error.response.status === 401) {
                errorMessage = "Your session has expired. Please refresh the page and try again.";
                needsRefresh = true;
            } else if (error.response && error.response.data && error.response.data.msg) {
                errorMessage = error.response.data.msg;
            } else if (error.message) {
                errorMessage = error.message;
                if (error.message.includes('session') || error.message.includes('expired')) {
                    needsRefresh = true;
                }
            }

            toast({
                variant: "destructive",
                title: "Update failed",
                description: errorMessage,
                action: needsRefresh ? (
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        Refresh
                    </Button>
                ) : undefined
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeProfileImage = () => {
        setProfileImage(null);
        setPreviewUrl(null);
    };

    // Add a state for the image preview modal
    const [showFullImage, setShowFullImage] = useState(false);

    return (
        <>
            <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
                <DialogContent className="sm:max-w-[500px]" aria-describedby="profile-edit-description">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <p id="profile-edit-description" className="text-sm text-muted-foreground">
                            Update your profile information below
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            {/* Profile Picture */}
                            <div className="flex flex-col items-center gap-2">
                                <Label>Profile Picture</Label>
                                <div className="relative">
                                    <Avatar
                                        className="h-24 w-24 cursor-pointer"
                                        onClick={() => previewUrl && setShowFullImage(true)}
                                    >
                                        {previewUrl ? (
                                            <AvatarImage
                                                src={previewUrl}
                                                alt="Profile"
                                                className="object-cover"
                                                style={{ objectPosition: 'center' }}
                                            />
                                        ) : (
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {formData.name?.charAt(0).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    {previewUrl && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                            onClick={removeProfileImage}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label
                                        htmlFor="picture"
                                        className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {previewUrl ? 'Change Picture' : 'Upload Picture'}
                                    </Label>
                                    <Input
                                        id="picture"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>

                            {/* Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Your name"
                                />
                            </div>



                            {/* College */}
                            <div className="grid gap-2">
                                <Label htmlFor="college">College</Label>
                                <Input
                                    id="college"
                                    name="college"
                                    value={formData.college}
                                    onChange={handleInputChange}
                                    placeholder="Your college"
                                />
                            </div>

                            {/* Branch */}
                            <div className="grid gap-2">
                                <Label htmlFor="branch">Branch</Label>
                                <Input
                                    id="branch"
                                    name="branch"
                                    value={formData.branch}
                                    onChange={handleInputChange}
                                    placeholder="Your branch"
                                />
                            </div>

                            {/* Batch */}
                            <div className="grid gap-2">
                                <Label htmlFor="batch">Batch</Label>
                                <Input
                                    id="batch"
                                    name="batch"
                                    value={formData.batch}
                                    onChange={handleInputChange}
                                    placeholder="Your batch (e.g., 2023-2027)"
                                />
                            </div>

                            {/* LinkedIn URL */}
                            <div className="grid gap-2">
                                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                                <Input
                                    id="linkedinUrl"
                                    name="linkedinUrl"
                                    value={formData.linkedinUrl}
                                    onChange={handleInputChange}
                                    placeholder="Your LinkedIn profile URL"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Full Image Preview Modal */}
            {previewUrl && (
                <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
                    <DialogContent className="sm:max-w-[80vw] max-h-[90vh] p-0 overflow-hidden">
                        <div className="relative w-full h-full flex items-center justify-center bg-black/50">
                            <img
                                src={previewUrl}
                                alt="Profile"
                                className="max-w-full max-h-[80vh] object-contain"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                                onClick={() => setShowFullImage(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}