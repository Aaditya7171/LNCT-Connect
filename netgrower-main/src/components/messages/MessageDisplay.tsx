import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Video, Info, UserPlus, Check, MessagesSquare, File, FileText, CheckCircle2 } from 'lucide-react';
import { API_URL } from '@/services/api/client';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  attachment_url: string | null;
  message_type: 'text' | 'image' | 'pdf' | 'docx';
  is_read: boolean;
  created_at: string;
}

// Update the props interface to match what's being passed from Messages.tsx
interface MessageDisplayProps {
  contact: {
    user_id: string;
    name: string;
    profile_picture: string | null;
    connection_status?: string;
    is_online?: boolean;
    last_message?: string;
    last_message_time?: string;
    unread_count?: number;
  };
  messages: Message[]; // Use the Message interface for better typing
  currentUserId: string;
  onBack: () => void;
}

// Helper function to get profile picture URL - keep only one definition
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

const MessageDisplay: React.FC<MessageDisplayProps> = ({
  contact,
  messages,
  currentUserId,
  onBack
}) => {
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format message time
  const formatMessageTime = (timeString: string) => {
    try {
      return format(new Date(timeString), 'h:mm a');
    } catch (error) {
      return '';
    }
  };

  // Render message attachment
  const renderAttachment = (message: Message) => {
    if (!message.attachment_url) return null;

    // Get the full URL for the attachment
    const getFullUrl = (url: string) => {
      if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const attachmentUrl = getFullUrl(message.attachment_url);

    switch (message.message_type) {
      case 'image':
        return (
          <div className="mt-2 relative group">
            <img
              src={attachmentUrl}
              alt="Attachment"
              className="max-w-[200px] max-h-[200px] rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.open(attachmentUrl, '_blank')}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-md flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">Click to view</span>
            </div>
          </div>
        );
      case 'pdf':
        return (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors mt-2"
          >
            <File className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="font-medium">PDF Document</span>
              <span className="text-xs opacity-80">Click to open</span>
            </div>
          </a>
        );
      case 'docx':
        return (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors mt-2"
          >
            <FileText className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="font-medium">Word Document</span>
              <span className="text-xs opacity-80">Click to open</span>
            </div>
          </a>
        );
      default:
        return (
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mt-2"
          >
            <File className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="font-medium">File Attachment</span>
              <span className="text-xs opacity-80">Click to open</span>
            </div>
          </a>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-900/70 backdrop-blur-md">
      {/* Contact header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-white/90 to-white/80 dark:from-gray-900/90 dark:to-gray-900/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          <Button variant="ghost" size="icon" className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Avatar and user info with online status */}
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-white/50 dark:border-gray-700/50 shadow-md transition-transform duration-300 hover:scale-105">
              <AvatarImage
                src={getProfilePictureUrl(contact.profile_picture)}
                alt={contact.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">{contact.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            {contact.is_online && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background shadow-sm"></span>
            )}
          </div>

          <div>
            <div className="flex items-center">
              <h3 className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{contact.name}</h3>
              {contact.connection_status === 'connected' && (
                <CheckCircle2 className="h-3 w-3 ml-1 text-blue-500" title="Following" />
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {contact.is_online ? (
                <span className="text-green-500 flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                  Active now
                </span>
              ) : (
                'Offline'
              )}
              <span className="mx-1">•</span>
              {contact.connection_status === 'connected'
                ? 'Following'
                : contact.connection_status === 'pending-sent'
                  ? 'Request sent'
                  : contact.connection_status === 'pending-received'
                    ? 'Wants to follow you'
                    : 'Not connected'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {contact.connection_status !== 'connected' && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]"
            >
              <UserPlus className="h-3 w-3 mr-1 text-blue-600 dark:text-blue-400" />
              Follow
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-full"
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-900/50 dark:to-gray-900/30 backdrop-blur-sm">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="glass-card rounded-xl p-8 shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-fade-in">
              <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mx-auto w-fit mb-4">
                <MessagesSquare className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">No messages yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Send a message to start the conversation
              </p>
            </div>
          </div>
        ) : (
          // Group messages by date and sender for better display
          messages.reduce((acc: JSX.Element[], message, index, array) => {
            const isSentByMe = message.sender_id === currentUserId;
            const prevMessage = index > 0 ? array[index - 1] : null;
            const nextMessage = index < array.length - 1 ? array[index + 1] : null;

            // Check if this is a new sender compared to previous message
            const isNewSender = !prevMessage || prevMessage.sender_id !== message.sender_id;

            // Check if next message is from same sender (for grouping)
            const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id;

            // Determine bubble shape based on position in group
            let bubbleShape = 'rounded-lg';
            if (!isNewSender && !isLastInGroup) {
              // Middle message in a group
              bubbleShape = isSentByMe ? 'rounded-l-lg rounded-tr-lg rounded-br-sm' : 'rounded-r-lg rounded-tl-lg rounded-bl-sm';
            } else if (!isNewSender) {
              // Last message in a group
              bubbleShape = isSentByMe ? 'rounded-l-lg rounded-tr-lg rounded-br-lg' : 'rounded-r-lg rounded-tl-lg rounded-bl-lg';
            } else if (!isLastInGroup) {
              // First message in a group
              bubbleShape = isSentByMe ? 'rounded-l-lg rounded-tr-sm rounded-br-lg' : 'rounded-r-lg rounded-tl-sm rounded-bl-lg';
            }

            // Add spacing between message groups
            const topSpacing = isNewSender ? 'mt-3' : 'mt-1';

            acc.push(
              <div
                key={message.id}
                className={`flex ${topSpacing} ${isSentByMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                {/* Show avatar for all messages at the start of a group */}
                {isNewSender && (
                  <div className={`flex-shrink-0 ${isSentByMe ? 'ml-2 order-2' : 'mr-2'} self-end mb-1`}>
                    <Avatar className="h-6 w-6 border border-white/50 dark:border-gray-700/50 shadow-sm">
                      {isSentByMe ? (
                        // Current user's profile pic
                        <AvatarImage
                          src={getProfilePictureUrl(null)}
                          alt="You"
                        />
                      ) : (
                        // Contact's profile pic
                        <AvatarImage
                          src={getProfilePictureUrl(contact.profile_picture)}
                          alt={contact.name}
                        />
                      )}
                      <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                        {isSentByMe ? "You".charAt(0) : contact.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                <div
                  className={`max-w-[70%] p-3 ${bubbleShape} ${isSentByMe
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md ml-auto hover:from-blue-600 hover:to-indigo-700 transition-all duration-300' // Enhanced styling for sent messages
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-foreground shadow-md mr-auto hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300' // Enhanced styling for received messages
                    }`}
                >
                  <div className="text-sm">{message.content}</div>
                  {renderAttachment(message)}

                  {/* Only show timestamp for last message in a group */}
                  {isLastInGroup && (
                    <div
                      className={`text-xs mt-1 flex items-center ${isSentByMe ? 'text-white/70 justify-end' : 'text-muted-foreground'
                        }`}
                    >
                      {formatMessageTime(message.created_at)}
                      {isSentByMe && (
                        <span className="ml-2">
                          {message.is_read ? (
                            <Check className="h-3 w-3 inline text-blue-300" />
                          ) : null}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );

            return acc;
          }, [])
        )}
        <div ref={messageEndRef} />
      </div>
    </div>
  );
};

export default MessageDisplay;