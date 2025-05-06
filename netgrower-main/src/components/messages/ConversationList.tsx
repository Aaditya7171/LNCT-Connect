import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessagesSquare, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';

interface Contact {
  user_id: string;
  name: string;
  profile_picture: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  connection_status: string | null;
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
    <div className="w-full md:w-1/3 border-r border-border h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex border-b border-border">
          <button
            className={cn(
              "flex-1 py-2 text-center font-medium text-sm",
              activeTab === 'inbox'
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            )}
            onClick={() => onTabChange('inbox')}
          >
            <MessagesSquare className="h-4 w-4 inline mr-2" />
            Inbox
          </button>
          <button
            className={cn(
              "flex-1 py-2 text-center font-medium text-sm",
              activeTab === 'requests'
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            )}
            onClick={() => onTabChange('requests')}
          >
            <UserPlus className="h-4 w-4 inline mr-2" />
            Requests
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activeTab === 'inbox' ? (
          filteredConversations.length > 0 ? (
            filteredConversations.map((contact) => (
              <div
                key={contact.user_id}
                className={cn(
                  "flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors",
                  selectedContact?.user_id === contact.user_id && "bg-accent"
                )}
                onClick={() => onSelectContact(contact)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contact.profile_picture || ''} />
                  <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{contact.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(contact.last_message_time)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {contact.last_message}
                  </p>
                </div>
                {contact.unread_count > 0 && (
                  <div className="bg-primary text-primary-foreground rounded-full h-5 min-w-[20px] flex items-center justify-center text-xs font-medium">
                    {contact.unread_count}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No conversations found
            </div>
          )
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((contact) => (
            <div
              key={contact.user_id}
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onSelectContact(contact)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={contact.profile_picture || ''} />
                <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium truncate">{contact.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  Wants to connect with you
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No message requests
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;