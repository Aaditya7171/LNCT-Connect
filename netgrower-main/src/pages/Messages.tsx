import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { getConversations, getMessages, getMessageRequests, sendMessage, markMessagesAsRead } from '@/services/api/messages';
import { API_URL } from '@/services/api/client';
import { socketService } from '@/services/socket';
import api from '@/services/api/client';
import { io } from 'socket.io-client';
import { MessagesSquare } from 'lucide-react'; // Add this import for the MessagesSquare icon

// Import our new components
import ConversationList from '@/components/messages/ConversationList';
import MessageDisplay from '@/components/messages/MessageDisplay';
import MessageInput from '@/components/messages/MessageInput';

// Types
interface Contact {
    user_id: string;
    name: string;
    profile_picture: string | null;
    last_message: string;
    last_message_time: string;
    unread_count: number;
    connection_status: string | null;
}

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

const Messages = () => {
    const [conversations, setConversations] = useState<Contact[]>([]);
    const [messageRequests, setMessageRequests] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('inbox');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [socketInstance, setSocketInstance] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const navigate = useNavigate();

    // Define checkAuth function at the component level so it can be used throughout
    const checkAuth = () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
            console.log("User not authenticated, redirecting to login");
            navigate('/auth', { state: { returnUrl: '/messages' } });
            return false;
        }

        setIsAuthenticated(true);
        return true;
    };

    // Fetch user info for a specific user ID
    const fetchUserInfo = async (userId: string) => {
        try {
            // Add authorization token to the request
            const token = localStorage.getItem('token');
            if (!token) {
                setIsAuthenticated(false);
                navigate('/auth', { state: { returnUrl: '/messages' } });
                return null;
            }

            // Fix: Use the correct authorization header format and use axios instead of fetch
            const response = await api.get(`/api/users/${userId}`, {
                headers: {
                    'x-auth-token': token  // Use the correct header name that matches your backend
                }
            });

            if (!response.data) {
                throw new Error('Failed to fetch user info');
            }

            const userData = response.data;

            // Create a new contact object
            const newContact = {
                user_id: userId,
                name: userData.name || 'User',
                profile_picture: userData.profile_picture || 'https://via.placeholder.com/150',
                last_message: '',
                last_message_time: new Date().toISOString(),
                unread_count: 0,
                connection_status: 'none'
            };

            return newContact;
        } catch (error) {
            console.error('Error fetching user info:', error);
            throw error;
        }
    };

    // Fetch conversations function - now has access to setIsLoading
    const fetchConversations = async () => {
        if (!checkAuth()) return;

        setIsLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            // Get all network connections
            const networkResponse = await fetch(`${API_URL}/api/connections/users/${userId}`);
            if (!networkResponse.ok) {
                throw new Error('Failed to fetch network connections');
            }

            const networkData = await networkResponse.json();
            const connections = networkData.users?.filter(
                (user: any) => user.connection_status === 'connected'
            ) || [];

            const nonConnections = networkData.users?.filter(
                (user: any) => user.connection_status !== 'connected'
            ) || [];

            // Format connections as conversations for the inbox
            const formattedConnections = connections.map((user: any) => ({
                user_id: user.id,
                name: user.name,
                profile_picture: user.profile_picture,
                last_message: '',  // Initially empty
                last_message_time: new Date().toISOString(),
                unread_count: 0,
                connection_status: 'connected'
            }));

            // Format non-connections as message requests
            const formattedRequests = nonConnections.map((user: any) => ({
                user_id: user.id,
                name: user.name,
                profile_picture: user.profile_picture,
                last_message: '',  // Initially empty
                last_message_time: new Date().toISOString(),
                unread_count: 0,
                connection_status: user.connection_status
            }));

            setConversations(formattedConnections);
            setMessageRequests(formattedRequests);

            // Check if we need to select a contact from localStorage (coming from network page)
            const storedContact = localStorage.getItem('messageUser');
            if (storedContact) {
                const contactData = JSON.parse(storedContact);
                const contact = {
                    user_id: contactData.user_id,
                    name: contactData.name,
                    profile_picture: contactData.profile_picture,
                    last_message: '',
                    last_message_time: new Date().toISOString(),
                    unread_count: 0,
                    connection_status: contactData.connection_status
                };
                setSelectedContact(contact);

                // Clear the stored contact
                localStorage.removeItem('messageUser');

                // Fetch messages for this contact
                fetchMessages(userId, contactData.user_id);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
            toast({
                variant: "destructive",
                title: "Failed to load conversations",
                description: "Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch message requests
    const fetchMessageRequests = async () => {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            // Use the getMessageRequests function from your API service
            const data = await getMessageRequests(userId);

            if (Array.isArray(data)) {
                // Transform API response to match your Contact interface
                const requestsData = await Promise.all(
                    data.map(async (req) => {
                        try {
                            // Fetch user details for this request
                            const userInfo = await fetchUserInfo(req.sender_id);
                            return {
                                ...userInfo,
                                last_message: req.last_message || '',
                                last_message_time: req.created_at || new Date().toISOString(),
                                unread_count: req.unread_count || 0,
                                connection_status: 'pending'
                            };
                        } catch (error) {
                            console.error(`Error fetching user ${req.sender_id}:`, error);
                            return null;
                        }
                    })
                );

                // Filter out null values
                setMessageRequests(requestsData.filter(Boolean) as Contact[]);
            }
        } catch (error) {
            console.error('Error fetching message requests:', error);
        }
    };

    // Fetch messages
    const fetchMessages = async (otherUserId: string) => {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            setIsLoading(true);

            // Get messages between the current user and the selected contact
            const messagesData = await getMessages(userId, otherUserId);

            if (Array.isArray(messagesData)) {
                setMessages(messagesData);

                // Mark messages as read
                await markMessagesAsRead(userId, otherUserId);
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setIsLoading(false);
        }
    };

    // Check authentication status on component mount
    useEffect(() => {
        const isAuth = checkAuth();
        if (isAuth) {
            // Only initialize if authenticated
            fetchConversations();
            fetchMessageRequests();

            // Set up socket connection for real-time messaging
            socketService.connect();

            // Listen for new messages
            socketService.onNewMessage((data) => {
                if (selectedContact && data.from === selectedContact.user_id) {
                    // Add the new message to the current conversation
                    setMessages(prev => [...prev, {
                        id: `socket-${Date.now()}`,
                        sender_id: data.from,
                        receiver_id: localStorage.getItem('userId') || '',
                        content: data.message,
                        attachment_url: data.attachmentUrl,
                        message_type: data.messageType || 'text',
                        is_read: false,
                        created_at: new Date().toISOString()
                    }]);

                    // Mark the message as read since we're in the conversation
                    const userId = localStorage.getItem('userId');
                    if (userId) {
                        markMessagesAsRead(userId, data.from);
                    }
                }

                // Refresh conversations to show the new message
                fetchConversations();
            });
        }

        return () => {
            // Clean up socket connection
            socketService.disconnect();
        };
    }, [navigate, selectedContact]);

    // Replace the useEffect that sets up the socket connection with this improved version
    useEffect(() => {
      if (!isAuthenticated) return;

      // Clean up any existing socket connection
      if (socketInstance) {
        socketInstance.disconnect();
        setSocketInstance(null);
      }

      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        console.error('Missing token or userId for socket connection');
        return;
      }

      console.log('Initializing socket connection...');

      // Create socket with proper auth
      const socket = io(API_URL, {
        auth: { token },
        query: { userId },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });

      setSocketInstance(socket);

      socket.on('connect', () => {
        console.log('Socket connected successfully');
        
        // Join user's room to receive messages
        socket.emit('join', userId);
        console.log(`Joining room: ${userId}`);
      });

      socket.on('welcome', (data) => {
        console.log('Received welcome message:', data);
      });

      socket.on('private-message', (message) => {
        console.log('New message received:', message);

        // Update messages if from current contact
        if (selectedContact &&
            (message.sender_id === selectedContact.user_id ||
             message.receiver_id === selectedContact.user_id)) {
          setMessages(prev => [...prev, message]);
        }

        // Update conversations list with new message
        updateConversationWithMessage(message);
      });

      socket.on('message-sent', (message) => {
        console.log('Message sent confirmation:', message);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        toast({
          variant: "destructive",
          title: "Messaging error",
          description: error.message || "There was an error with the messaging service",
        });
      });

      // Set up a ping interval to keep the connection alive
      const pingInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping');
        }
      }, 30000);

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected, reason:', reason);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
      });

      return () => {
        console.log('Cleaning up socket connection...');
        clearInterval(pingInterval);
        socket.disconnect();
      };
    }, [isAuthenticated, selectedContact?.user_id]); // Include selectedContact to update listeners when it changes

    // Update the handleSendMessage function to use the socket for sending messages
    const handleSendMessage = async () => {
      if ((!newMessage.trim() && !attachment) || !selectedContact) return;

      try {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        if (!userId || !token) {
          toast({
            variant: "destructive",
            title: "Authentication error",
            description: "Please log in again.",
          });
          navigate('/auth', { state: { returnUrl: '/messages' } });
          return;
        }

        // Add message to UI immediately for better UX
        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          sender_id: userId,
          receiver_id: selectedContact.user_id,
          content: newMessage,
          attachment_url: attachment ? URL.createObjectURL(attachment) : null,
          message_type: attachment ? determineMessageType(attachment) : 'text',
          is_read: false,
          created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, tempMessage]);

        // Clear input fields
        setNewMessage('');
        setAttachment(null);
        setShowAttachmentPreview(false);

        console.log('Sending message with data:', {
          sender_id: userId,
          receiver_id: selectedContact.user_id,
          content: newMessage.substring(0, 20) + (newMessage.length > 20 ? '...' : ''),
          hasAttachment: !!attachment
        });

        // Try to send via socket first if connected
        if (socketInstance && socketInstance.connected) {
          socketInstance.emit('private-message', {
            to: selectedContact.user_id,
            message: newMessage,
            attachmentUrl: null, // We'll handle attachments via API
            messageType: 'text'
          });
        }

        // If we have an attachment, or as a fallback, use the API
        if (attachment) {
          // Create a new message object
          const messageData = new FormData();
          messageData.append('sender_id', userId);
          messageData.append('receiver_id', selectedContact.user_id);
          messageData.append('content', newMessage);
          messageData.append('attachment', attachment);
          messageData.append('message_type', determineMessageType(attachment));

          // Send message to server via API
          const response = await sendMessage(messageData);
          console.log('Message with attachment sent successfully:', response);

          // Update the conversation list with the new message
          updateConversationWithMessage({
            ...tempMessage,
            id: response.id || tempMessage.id,
            created_at: response.created_at || tempMessage.created_at,
            attachment_url: response.attachment_url || tempMessage.attachment_url
          });
        }

        // Refresh messages to get the actual message from the server
        fetchMessages(selectedContact.user_id);

      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          variant: "destructive",
          title: "Error sending message",
          description: "Failed to send your message. Please try again.",
        });
      }
    };

    // Helper function to determine message type based on file extension
    const determineMessageType = (file: File): 'text' | 'image' | 'pdf' | 'docx' => {
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
            return 'image';
        } else if (extension === 'pdf') {
            return 'pdf';
        } else if (['doc', 'docx'].includes(extension || '')) {
            return 'docx';
        }

        return 'text';
    };

    return (
        <div className="page-transition">
            <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row">
                {/* Conversation List */}
                <ConversationList
                    conversations={conversations}
                    messageRequests={messageRequests}
                    selectedContact={selectedContact}
                    activeTab={activeTab}
                    searchQuery={searchQuery}
                    isLoading={isLoading}
                    onSelectContact={setSelectedContact}
                    onSearchChange={setSearchQuery}
                    onTabChange={setActiveTab}
                />

                {/* Message Display */}
                {selectedContact ? (
                    <div className="flex flex-col flex-1 border-l">
                        <MessageDisplay
                            contact={selectedContact} // Make sure this prop name matches what the component expects
                            messages={messages}
                            currentUserId={localStorage.getItem('userId') || ''}
                            onBack={() => setSelectedContact(null)}
                        />
                        <MessageInput
                            newMessage={newMessage}
                            attachment={attachment}
                            showAttachmentPreview={showAttachmentPreview}
                            onMessageChange={setNewMessage}
                            onAttachmentChange={setAttachment}
                            onShowAttachmentPreviewChange={setShowAttachmentPreview}
                            onSendMessage={handleSendMessage}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-8 bg-muted/10">
                        <div className="text-center">
                            <MessagesSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">Select a conversation</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Choose a contact from the list to start messaging
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;

// Update the setupSocket function
const setupSocket = () => {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        // Connect to socket
        socketService.connect();
        setSocketConnected(true);
        console.log('Socket connected');

        // Join room with userId
        socketService.joinRoom(userId);
        console.log('Joining room:', userId);

        // Set up message listener
        const unsubscribeMessage = socketService.onNewMessage((message) => {
            console.log('New message received:', message);
            if (selectedContact &&
                (message.sender_id === selectedContact.user_id ||
                    message.receiver_id === selectedContact.user_id)) {
                setMessages(prev => [...prev, message]);
            }

            // Refresh conversations to update last message
            fetchConversations();
        });

        // Set up disconnect listener
        const unsubscribeDisconnect = socketService.onDisconnect(() => {
            console.log('Socket disconnected');
            setSocketConnected(false);

            // Try to reconnect after a delay
            setTimeout(() => {
                socketService.connect();
            }, 3000);
        });

        return () => {
            unsubscribeMessage();
            unsubscribeDisconnect();
        };
    } catch (error) {
        console.error('Socket setup error:', error);
    }
};
