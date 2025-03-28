
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Send, Phone, Video, Info, Paperclip, MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

// Mock contacts data
const CONTACTS: Contact[] = [
  {
    id: 'contact-1',
    name: 'Anjali Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80',
    lastMessage: 'Do you have the notes from today\'s class?',
    timestamp: '10:30 AM',
    unread: 2,
    online: true
  },
  {
    id: 'contact-2',
    name: 'Vikram Malhotra',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    lastMessage: 'Looking forward to your workshop next month!',
    timestamp: 'Yesterday',
    unread: 0,
    online: false
  },
  {
    id: 'contact-3',
    name: 'Prof. Rajeev Kumar',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    lastMessage: 'Please submit your assignment by Friday.',
    timestamp: 'Monday',
    unread: 1,
    online: true
  },
  {
    id: 'contact-4',
    name: 'Priya Singh',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    lastMessage: 'Are you interested in joining our startup?',
    timestamp: 'Last week',
    unread: 0,
    online: false
  }
];

// Mock conversation data
const CONVERSATION: Record<string, Message[]> = {
  'contact-1': [
    {
      id: 'msg-1',
      senderId: 'contact-1',
      text: 'Hey Rahul, how are you doing?',
      timestamp: '10:15 AM',
      isRead: true
    },
    {
      id: 'msg-2',
      senderId: 'me',
      text: 'Hi Anjali! I\'m good, just working on our project. How about you?',
      timestamp: '10:18 AM',
      isRead: true
    },
    {
      id: 'msg-3',
      senderId: 'contact-1',
      text: 'I\'m doing well too! Do you have the notes from today\'s class?',
      timestamp: '10:20 AM',
      isRead: true
    },
    {
      id: 'msg-4',
      senderId: 'contact-1',
      text: 'I missed it because of a doctor\'s appointment.',
      timestamp: '10:20 AM',
      isRead: true
    },
    {
      id: 'msg-5',
      senderId: 'me',
      text: 'Yes, I can share them with you. Give me a moment.',
      timestamp: '10:25 AM',
      isRead: true
    },
    {
      id: 'msg-6',
      senderId: 'contact-1',
      text: 'That would be great, thanks! When is our next project meeting?',
      timestamp: '10:28 AM',
      isRead: false
    },
    {
      id: 'msg-7',
      senderId: 'contact-1',
      text: 'Also, did Prof. Kumar announce anything important?',
      timestamp: '10:30 AM',
      isRead: false
    }
  ],
  'contact-2': [
    {
      id: 'msg-1',
      senderId: 'me',
      text: 'Hi Vikram, I heard you\'re conducting a workshop next month?',
      timestamp: 'Yesterday',
      isRead: true
    },
    {
      id: 'msg-2',
      senderId: 'contact-2',
      text: 'Yes! It\'s on "AI in Modern Tech Industry". Would you like to attend?',
      timestamp: 'Yesterday',
      isRead: true
    },
    {
      id: 'msg-3',
      senderId: 'me',
      text: 'Absolutely! That sounds fascinating. When and where is it happening?',
      timestamp: 'Yesterday',
      isRead: true
    },
    {
      id: 'msg-4',
      senderId: 'contact-2',
      text: 'It\'s on the 15th of next month at the LNCT auditorium. I\'ll send you the details soon.',
      timestamp: 'Yesterday',
      isRead: true
    },
    {
      id: 'msg-5',
      senderId: 'me',
      text: 'Perfect, I\'ll mark my calendar. Looking forward to it!',
      timestamp: 'Yesterday',
      isRead: true
    },
    {
      id: 'msg-6',
      senderId: 'contact-2',
      text: 'Looking forward to your workshop next month!',
      timestamp: 'Yesterday',
      isRead: true
    }
  ]
};

const Messages = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState(CONTACTS);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (selectedContact) {
      setMessages(CONVERSATION[selectedContact.id] || []);
      // Mark messages as read
      if (selectedContact.unread > 0) {
        setContacts(prev => prev.map(contact => 
          contact.id === selectedContact.id ? { ...contact, unread: 0 } : contact
        ));
      }
    }
  }, [selectedContact]);
  
  useEffect(() => {
    // Scroll to bottom of messages
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };
    
    // Add to conversation
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    
    // Update in conversation store
    if (selectedContact) {
      CONVERSATION[selectedContact.id] = updatedMessages;
    }
    
    // Update last message in contacts
    setContacts(prev => prev.map(contact => 
      contact.id === selectedContact.id 
        ? { 
            ...contact, 
            lastMessage: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          } 
        : contact
    ));
    
    // Clear input
    setNewMessage('');
    
    // Simulate reply after delay
    if (selectedContact.id === 'contact-1') {
      setTimeout(() => {
        const replyMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          senderId: selectedContact.id,
          text: 'Thanks for the info! See you tomorrow at the project meeting.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false
        };
        
        setMessages(prev => [...prev, replyMsg]);
        CONVERSATION[selectedContact.id] = [...updatedMessages, replyMsg];
        
        setContacts(prev => prev.map(contact => 
          contact.id === selectedContact.id 
            ? { 
                ...contact, 
                lastMessage: replyMsg.text,
                timestamp: replyMsg.timestamp
              } 
            : contact
        ));
      }, 3000);
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="page-transition h-[calc(100vh-16rem)] md:h-[calc(100vh-5rem)] pb-20 md:pb-0 flex">
      <div className="hidden md:block md:w-80 lg:w-96 h-full border-r border-border overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg p-4 border-b border-border">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Search conversations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="p-2">
          {contacts.map(contact => (
            <div
              key={contact.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                selectedContact?.id === contact.id 
                  ? "bg-accent text-accent-foreground" 
                  : "hover:bg-muted"
              )}
              onClick={() => setSelectedContact(contact)}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                </Avatar>
                {contact.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium truncate">{contact.name}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{contact.timestamp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                  {contact.unread > 0 && (
                    <span className="ml-2 flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 h-full flex flex-col">
        {selectedContact ? (
          <>
            <div className="bg-card/80 backdrop-blur-lg p-4 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedContact.avatar} />
                  <AvatarFallback>{getInitials(selectedContact.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedContact.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedContact.online ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Info className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "mb-4 max-w-[75%]",
                    message.senderId === 'me' ? "ml-auto" : "mr-auto"
                  )}
                >
                  <div
                    className={cn(
                      "p-3 rounded-2xl",
                      message.senderId === 'me'
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted text-muted-foreground rounded-tl-none"
                    )}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                  <div
                    className={cn(
                      "text-xs text-muted-foreground mt-1",
                      message.senderId === 'me' ? "text-right" : "text-left"
                    )}
                  >
                    {message.timestamp}
                  </div>
                </div>
              ))}
              <div ref={messageEndRef}></div>
            </div>
            
            <div className="p-4 border-t border-border bg-card/80 backdrop-blur-lg">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!newMessage.trim()} 
                  size="icon" 
                  className="rounded-full"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessagesSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">Your Messages</h3>
            <p className="text-muted-foreground max-w-md">
              Select a conversation or start a new one with your connections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
