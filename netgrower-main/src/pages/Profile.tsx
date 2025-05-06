
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/services/api/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Calendar, Briefcase, GitBranch, LinkIcon, Edit, Bug, LogOut, X, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ProfileEdit } from '@/components/profile/ProfileEdit';
import { getProfile, updateProfile, debugProfileData } from '@/services/api';
import { logoutUser } from '@/services/api/auth';
import { Dialog, DialogContent } from "@/components/ui/dialog";

const Profile = () => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);
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
            ? `${API_URL}${userData.profile_picture.startsWith('/') ? '' : '/'}${userData.profile_picture}?t=${timestamp}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random&color=fff&size=128`,
          coverImage: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1080&q=80'
        };
  
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
      // The URL should already be complete from ProfileEdit component
      newProfileData.profile_picture = updatedProfile.profile_picture;
      console.log("Updated profile picture URL in parent:", newProfileData.profile_picture);
    }

    console.log("Setting new profile data after update:", newProfileData);

    // Update the state with the new profile data
    setProfileData(newProfileData);

    // Show success toast
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully",
    });

    // Refresh profile data from server to ensure we have the latest
    setTimeout(() => {
      fetchUserProfile();
    }, 1000);
  };

  const debugProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error("No user ID found in localStorage");
        toast({
          variant: "destructive",
          title: "Error",
          description: "User ID not found in local storage",
        });
        return;
      }

      const debugData = await debugProfileData(userId);
      console.log("Debug profile data:", debugData);

      toast({
        title: "Debug Info",
        description: "Check the console for profile debug information",
      });
    } catch (error) {
      console.error("Error debugging profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to debug profile data",
      });
    }
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
    <div className="page-transition pb-20 md:pb-0">
      {/* Profile header */}
      <div className="relative">
        {/* Cover photo */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-500 rounded-b-xl overflow-hidden">
          <img
            src={profileData.coverImage}
            alt="Cover"
            className="w-full h-full object-cover opacity-70"
          />
        </div>

        {/* Profile picture and basic info */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-20 md:-bottom-24 flex flex-col items-center">
          <Avatar
            className="h-32 w-32 border-4 border-background cursor-pointer"
            onClick={() => profileData.profile_picture && setShowFullImage(true)}
          >
            {profileData.profile_picture ? (
              <AvatarImage
                src={profileData.profile_picture}
                alt={profileData.name}
                className="object-cover"
                style={{ objectPosition: 'center' }}
                onError={(e) => {
                  console.error("Error loading profile image:", e);
                  e.currentTarget.src = ''; // Clear the src to show the fallback
                }}
              />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <h1 className="mt-4 text-2xl font-bold">{profileData.name || 'User'}</h1>
          <p className="text-muted-foreground">Computer Science Student</p>
        </div>
      </div>

      {/* Profile actions */}
      <div className="mt-24 md:mt-28 flex justify-center gap-4">
        <Button
          size="sm"
          variant="outline"
          className="rounded-full gap-2"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <Edit className="w-4 h-4" />
          Edit Profile
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="rounded-full gap-2"
          onClick={debugProfile}
        >
          <Bug className="w-4 h-4" />
          Debug Profile
        </Button>

        <Button
          size="sm"
          variant="destructive"
          className="rounded-full gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      {/* Profile content */}
      <div className="container max-w-4xl mt-8">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <div className="grid gap-6">
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {profileData.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <span>{profileData.email}</span>
                    </div>
                  )}
                  {profileData.linkedin_url && (
                    <div className="flex items-center gap-3">
                      <LinkIcon className="w-5 h-5 text-muted-foreground" />
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

              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Education</h3>
                <div className="space-y-3">
                  {profileData.college && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-muted-foreground" />
                      <span>{profileData.college}</span>
                    </div>
                  )}
                  {profileData.branch && (
                    <div className="flex items-center gap-3">
                      <GitBranch className="w-5 h-5 text-muted-foreground" />
                      <span>{profileData.branch}</span>
                    </div>
                  )}
                  {profileData.batch && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
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
            <div className="bg-card rounded-lg p-6 shadow-sm text-center">
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
                  src={profileData.profile_picture}
                  alt={profileData.name}
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
        )
      }

      <ProfileEdit
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onProfileUpdate={handleProfileUpdate}
        userId={profileData.id}
        currentProfile={profileData}
      />
    </div>
  );
};

export default Profile;
