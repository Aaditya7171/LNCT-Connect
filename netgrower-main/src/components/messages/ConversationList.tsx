import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessagesSquare, UserPlus, Users, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/services/api/client';
import { formatDistanceToNow } from 'date-fns';

// Helper function to get profile picture URL
const getProfilePictureUrl = (profilePicture: string | null) => {
  // If null is passed, try to get the current user's profile picture
  if (!profilePicture) {
    const currentUserPic = localStorage.getItem('userProfilePic');
    if (currentUserPic) {
      // If we have a stored profile pic, use it
      if (currentUserPic.startsWith('http://') || currentUserPic.startsWith('https://')) {
        return currentUserPic;
      } else {
        // If it's a relative path, prepend the API URL
        return `${API_URL}${currentUserPic.startsWith('/') ? '' : '/'}${currentUserPic}`;
      }
    }

    // Get user data from localStorage as fallback
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.profile_picture) {
          if (user.profile_picture.startsWith('http://') || user.profile_picture.startsWith('https://')) {
            return user.profile_picture;
          } else {
            return `${API_URL}${user.profile_picture.startsWith('/') ? '' : '/'}${user.profile_picture}`;
          }
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Default avatar if no profile picture is available
    return '';
  }

  // If it's already a full URL (starts with http or https), return as is
  if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
    return profilePicture;
  }

  // Otherwise, prepend the API URL
  return `${API_URL}${profilePicture.startsWith('/') ? '' : '/'}${profilePicture}`;
};

interface Contact {
  user_id: string;
  name: string;
  profile_picture: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  connection_status: string | null;
  is_online?: boolean; // Add online status
}

interface ConversationListProps {
  conversations: Contact[];
  messageRequests: Contact[];
  selectedContact: Contact | null;
  activeTab: string;
  searchQuery: string;
  isLoading: boolean;
  onSelectContact: (contact: Contact) => void;
  onSearchChange: (query: string) => void;
  onTabChange: (tab: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  messageRequests,
  selectedContact,
  activeTab,
  searchQuery,
  isLoading,
  onSelectContact,
  onSearchChange,
  onTabChange
}) => {
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter message requests based on search query
  const filteredRequests = messageRequests.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      return formatDistanceToNow(new Date(timeString), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="w-full md:w-[320px] border-r border-gray-200 dark:border-gray-800 h-full flex flex-col bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-900/70 backdrop-blur-md">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9 border border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Messages</h2>
          <p className="text-sm text-muted-foreground">Chat with anyone in the network</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-t-blue-500 border-b-purple-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((contact, index) => (
            <div
              key={contact.user_id}
              className={cn(
                "flex items-center gap-3 p-3 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 hover:translate-x-1 w-full",
                selectedContact?.user_id === contact.user_id && "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30"
              )}
              onClick={() => onSelectContact(contact)}
              style={{ animationDelay: `${0.05 * index}s` }}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12 border-2 border-white/50 dark:border-gray-700/50 shadow-md transition-transform duration-300 hover:scale-105">
                  <AvatarImage src={getProfilePictureUrl(contact.profile_picture)} alt={contact.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {/* Online status indicator */}
                {contact.is_online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background shadow-sm"></span>
                )}
              </div>
              <div className="flex-1 min-w-0 w-full overflow-hidden">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center max-w-[70%]">
                    <h3 className="font-medium truncate">{contact.name}</h3>
                    {contact.connection_status === 'connected' && (
                      <CheckCircle2 className="h-3 w-3 ml-1 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  {contact.last_message_time && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(contact.last_message_time)}
                    </span>
                  )}
                </div>
                <div className="flex items-center w-full">
                  <p className="text-sm text-muted-foreground truncate w-full">
                    {contact.last_message || (
                      <span className="italic">
                        {contact.connection_status === 'connected'
                          ? 'Send a message'
                          : contact.connection_status === 'pending-sent'
                            ? 'Connection request sent'
                            : contact.connection_status === 'pending-received'
                              ? 'Wants to connect with you'
                              : 'Not connected'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {contact.unread_count > 0 && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs font-medium shadow-sm flex-shrink-0">
                  {contact.unread_count}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-6 m-4 text-center text-muted-foreground glass-card rounded-xl shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;