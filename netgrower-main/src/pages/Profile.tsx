
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/services/api/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Calendar, Briefcase, GitBranch, LinkIcon, Edit, LogOut, X, MessageSquare, KeyRound } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ProfileEdit } from '@/components/profile/ProfileEdit';
import ChangePassword from '@/components/profile/ChangePassword';
import { getProfile } from '@/services/api';
import { logoutUser } from '@/services/api/auth';
import { Dialog, DialogContent } from "@/components/ui/dialog";

const Profile = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);
  const [forceUpdateTimestamp, setForceUpdateTimestamp] = useState(Date.now());
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    id: '1',
    name: 'Rahul Kumar',
    email: 'rahul.kumar@example.com',
    college: 'LNCT, Bhopal',
    branch: 'Computer Science & Engineering',
    batch: '2025',
    linkedin_url: '',
    profile_picture: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80',
    coverImage: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1080&q=80'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();

    // Check if this is a new user and open the edit dialog automatically
    const isNewUser = localStorage.getItem('isNewUser') === 'true';
    if (isNewUser) {
      setIsEditDialogOpen(true);
      localStorage.removeItem('isNewUser');
    }
  }, []);

  // Update the fetchUserProfile function to properly handle null values
  // Update the fetchUserProfile function to prevent redirect loops:
  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      // Log authentication state for debugging
      console.log("Auth check:", {
        userId: userId ? "Present" : "Missing",
        token: token ? "Present" : "Missing",
        tokenLength: token ? token.length : 0
      });

      if (!userId || !token) {
        console.error("Missing authentication data");
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please log in to view your profile.",
        });

        // Only navigate if we're not already on the auth page
        if (window.location.pathname !== '/auth') {
          navigate('/auth');
        }
        return;
      }

      console.log("Fetching profile with user ID:", userId);
      const response = await getProfile(userId);
      console.log("Profile response:", response);

      // Make sure we're properly handling the response data
      const userData = response.data?.data || response.data;

      if (userData) {
        console.log("User data extracted from response:", userData);

        // Force image refresh by adding a timestamp to the URL
        const timestamp = new Date().getTime();

        // Update profile data with the response, handling null values
        const newProfileData = {
          id: userId,
          name: userData.name || '',
          email: userData.email || '',
          college: userData.college || '',
          branch: userData.branch || '',
          batch: userData.batch || '',
          linkedin_url: userData.linkedin_url || '',
          profile_picture: userData.profile_picture
            ? (userData.profile_picture.startsWith('http')
              ? `${userData.profile_picture}?t=${timestamp}` // Already a full URL
              : `${API_URL}${userData.profile_picture.startsWith('/') ? '' : '/'}${userData.profile_picture}?t=${timestamp}`) // Need to add API_URL
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random&color=fff&size=128`,
          coverImage: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1080&q=80'
        };

        // Update localStorage with the latest profile picture
        if (userData.profile_picture) {
          const storedUserData = JSON.parse(localStorage.getItem('user') || '{}');
          storedUserData.profile_picture = userData.profile_picture;
          localStorage.setItem('user', JSON.stringify(storedUserData));
          localStorage.setItem('userProfilePic', userData.profile_picture);

          // Force the browser to reload the image
          const preloadImg = new Image();
          preloadImg.src = newProfileData.profile_picture;
        }

        console.log("Setting new profile data:", newProfileData);
        setProfileData(newProfileData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);

      // Check if it's an authentication error
      if (error.response && error.response.status === 401) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Your session has expired. Please log in again.",
        });

        // Only navigate if we're not already on the auth page
        if (window.location.pathname !== '/auth') {
          navigate('/auth');
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleProfileUpdate function to properly merge the updated data
  const handleProfileUpdate = (updatedProfile) => {
    console.log("Profile update received in parent component:", updatedProfile);

    // Create a new profile data object with the updates
    const newProfileData = {
      ...profileData,
      ...updatedProfile,
      // Ensure we handle empty strings properly
      college: updatedProfile.college || '',
      branch: updatedProfile.branch || '',
      batch: updatedProfile.batch || '',
      linkedin_url: updatedProfile.linkedin_url || ''
    };

    // Make sure we're using the full URL for the profile picture
    if (updatedProfile.profile_picture) {
      // Check if it's a data URL (which we should never use)
      if (updatedProfile.profile_picture.startsWith('data:')) {
        console.error("Received a data URL for profile picture - this should not happen");
        // Don't use data URLs as they cause errors
      } else {
        // The URL should already be complete from ProfileEdit component
        newProfileData.profile_picture = updatedProfile.profile_picture;
        console.log("Updated profile picture URL in parent:", newProfileData.profile_picture);

        // Force the browser to reload the image by creating a new Image object
        const preloadImg = new Image();
        preloadImg.src = newProfileData.profile_picture;
      }
    }

    console.log("Setting new profile data after update:", newProfileData);

    // Update the state with the new profile data
    setProfileData(newProfileData);

    // Show success toast
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully",
    });

    // Force an immediate update of the profile picture in the UI
    if (updatedProfile.profile_picture) {
      // Create a new Image object to force the browser to load the new image
      const img = new Image();
      img.onload = () => {
        console.log("New profile image loaded successfully");
        // Force a re-render by updating a timestamp state
        setForceUpdateTimestamp(new Date().getTime());
      };
      img.onerror = (e) => {
        console.error("Error loading new profile image:", e);
      };
      img.src = updatedProfile.profile_picture;
    }

    // Refresh profile data from server to ensure we have the latest
    setTimeout(() => {
      fetchUserProfile();
    }, 2000);
  };



  const handleLogout = () => {
    logoutUser();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate('/auth');
  };

  return (
    <div className="page-transition pb-20 md:pb-0 animate-fade-in">
      {/* Profile header */}
      <div className="relative">
        {/* Cover photo */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-b-xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl">
          <img
            src={profileData.coverImage}
            alt="Cover"
            className="w-full h-full object-cover opacity-70"
          />
        </div>

        {/* Profile picture and basic info */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-20 md:-bottom-24 flex flex-col items-center animate-slide-in-bottom">
          <Avatar
            className="h-32 w-32 border-4 border-background cursor-pointer shadow-lg transition-transform duration-300 hover:scale-105"
            onClick={() => profileData.profile_picture && setShowFullImage(true)}
          >
            {profileData.profile_picture ? (
              <AvatarImage
                key={`${profileData.profile_picture}-${forceUpdateTimestamp}`} // Add timestamp to force re-render
                src={profileData.profile_picture.startsWith('data:')
                  ? '' // Don't use data URLs - they cause errors
                  : `${profileData.profile_picture}${profileData.profile_picture.includes('?') ? '&' : '?'}t=${forceUpdateTimestamp}`
                }
                alt={profileData.name}
                className="object-cover"
                style={{ objectPosition: 'center' }}
                onError={(e) => {
                  console.error("Error loading profile image:", e);
                  // Try to reload the image once with a new timestamp
                  const currentSrc = e.currentTarget.src;
                  if (currentSrc && !currentSrc.includes('&retry=true')) {
                    const newTimestamp = new Date().getTime();
                    // Only try to reload if it's not a data URL
                    if (!currentSrc.startsWith('data:')) {
                      e.currentTarget.src = `${currentSrc.split('?')[0]}?t=${newTimestamp}&retry=true`;
                      console.log("Retrying with new URL:", e.currentTarget.src);
                    }
                  } else {
                    console.log("Fallback to avatar");
                    e.currentTarget.src = ''; // Clear the src to show the fallback
                  }
                }}
              />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold">
                {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <h1 className="mt-4 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{profileData.name || 'User'}</h1>
          <p className="text-muted-foreground">Computer Science Student</p>
        </div>
      </div>

      {/* Profile actions */}
      <div className="mt-24 md:mt-28 flex justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <Edit className="w-4 h-4" />
          Edit Profile
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="rounded-full gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]"
          onClick={() => setIsChangePasswordOpen(true)}
        >
          <KeyRound className="w-4 h-4" />
          Change Password
        </Button>

        <Button
          size="sm"
          variant="destructive"
          className="rounded-full gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      {/* Profile content */}
      <div className="container max-w-4xl mt-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg p-1">
            <TabsTrigger value="about" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300">About</TabsTrigger>
            <TabsTrigger value="posts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300">Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <div className="grid gap-6">
              <div className="glass-card rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Contact Information</h3>
                <div className="space-y-3">
                  {profileData.email && (
                    <div className="flex items-center gap-3 hover:translate-x-1 transition-transform duration-300">
                      <div className="p-2 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>{profileData.email}</span>
                    </div>
                  )}
                  {profileData.linkedin_url && (
                    <div className="flex items-center gap-3 hover:translate-x-1 transition-transform duration-300">
                      <div className="p-2 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                        <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <a
                        href={profileData.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {!profileData.email && !profileData.linkedin_url && (
                    <p className="text-muted-foreground">No contact information available</p>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Education</h3>
                <div className="space-y-3">
                  {profileData.college && (
                    <div className="flex items-center gap-3 hover:translate-x-1 transition-transform duration-300">
                      <div className="p-2 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                        <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>{profileData.college}</span>
                    </div>
                  )}
                  {profileData.branch && (
                    <div className="flex items-center gap-3 hover:translate-x-1 transition-transform duration-300">
                      <div className="p-2 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                        <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>{profileData.branch}</span>
                    </div>
                  )}
                  {profileData.batch && (
                    <div className="flex items-center gap-3 hover:translate-x-1 transition-transform duration-300">
                      <div className="p-2 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>Batch of {profileData.batch}</span>
                    </div>
                  )}
                  {!profileData.college && !profileData.branch && !profileData.batch && (
                    <p className="text-muted-foreground">No education information available</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            <div className="glass-card rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 hover:shadow-2xl transition-all duration-300 text-center">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Full Image Preview Modal */}
      {
        profileData.profile_picture && (
          <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
            <DialogContent className="sm:max-w-[80vw] max-h-[90vh] p-0 overflow-hidden">
              <div className="relative w-full h-full flex items-center justify-center bg-black/50">
                <img
                  key={`${profileData.profile_picture}-${forceUpdateTimestamp}`} // Add timestamp to force re-render
                  src={profileData.profile_picture.startsWith('data:')
                    ? '' // Don't use data URLs - they cause errors
                    : `${profileData.profile_picture}${profileData.profile_picture.includes('?') ? '&' : '?'}t=${forceUpdateTimestamp}`
                  }
                  alt={profileData.name}
                  className="max-w-full max-h-[80vh] object-contain"
                  onError={(e) => {
                    console.error("Error loading full profile image:", e);
                    const currentSrc = e.currentTarget.src;
                    if (currentSrc && !currentSrc.includes('&retry=true')) {
                      const newTimestamp = new Date().getTime();
                      // Only try to reload if it's not a data URL
                      if (!currentSrc.startsWith('data:')) {
                        e.currentTarget.src = `${currentSrc.split('?')[0]}?t=${newTimestamp}&retry=true`;
                        console.log("Retrying full image with new URL:", e.currentTarget.src);
                      }
                    }
                  }}
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
        )
      }

      <ProfileEdit
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onProfileUpdate={handleProfileUpdate}
        userId={profileData.id}
        currentProfile={profileData}
      />

      <ChangePassword
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        userId={profileData.id}
      />
    </div>
  );
};

export default Profile;
