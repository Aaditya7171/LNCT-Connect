import React, { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Video, Info, UserPlus, Check, MessagesSquare, File, FileText } from 'lucide-react';
import { API_URL } from '@/services/api';
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
    // Add any other properties your contact object has
  };
  messages: Array<any>; // Consider creating a Message interface for better typing
  currentUserId: string;
  onBack: () => void;
}

// Helper function to get profile picture URL - keep only one definition
const getProfilePictureUrl = (profilePicture: string | null) => {
  if (!profilePicture) return '';

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

    switch (message.message_type) {
      case 'image':
        return (
          <img
            src={message.attachment_url.startsWith('blob:') ? message.attachment_url : `${API_URL}${message.attachment_url}`}
            alt="Attachment"
            className="max-w-[200px] max-h-[200px] rounded-md mt-2"
          />
        );
      case 'pdf':
        return (
          <a
            href={message.attachment_url.startsWith('blob:') ? message.attachment_url : `${API_URL}${message.attachment_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-500 hover:underline mt-2"
          >
            <File className="h-5 w-5" />
            <span>View PDF</span>
          </a>
        );
      case 'docx':
        return (
          <a
            href={message.attachment_url.startsWith('blob:') ? message.attachment_url : `${API_URL}${message.attachment_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-500 hover:underline mt-2"
          >
            <FileText className="h-5 w-5" />
            <span>View Document</span>
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Contact header */}
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Avatar and user info */}
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={getProfilePictureUrl(contact.profile_picture)}
              alt={contact.name}
            />
            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{contact.name}</h3>
            <p className="text-sm text-muted-foreground">
              {contact.connection_status === 'connected' ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto bg-muted/10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <MessagesSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No messages yet</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-3 ${message.sender_id === currentUserId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                  }`}
              >
                <div className="text-sm">{message.content}</div>
                {renderAttachment(message)}
                <div
                  className={`text-xs mt-1 ${message.sender_id === currentUserId
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                    }`}
                >
                  {formatMessageTime(message.created_at)}
                  {message.sender_id === currentUserId && (
                    <span className="ml-2">
                      {message.is_read ? (
                        <Check className="h-3 w-3 inline" />
                      ) : null}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messageEndRef} />
      </div>
    </div>
  );
};

export default MessageDisplay;