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
    is_online?: boolean; // Add online status
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

    // Fetch all users for Instagram-style messaging
    const fetchConversations = async () => {
        if (!checkAuth()) return;

        setIsLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            // Get all users
            const networkResponse = await fetch(`${API_URL}/api/connections/users/${userId}`);
            if (!networkResponse.ok) {
                throw new Error('Failed to fetch users');
            }

            const networkData = await networkResponse.json();
            const allUsers = networkData.users || [];

            // Get active socket connections to determine online status
            // This is a simplified approach - in a real app, you'd use a presence system
            const onlineUsers = new Set<string>();

            // Format all users as potential conversations (Instagram style)
            const formattedUsers = allUsers.map((user: any) => ({
                user_id: user.id,
                name: user.name,
                profile_picture: user.profile_picture,
                last_message: '',  // Initially empty
                last_message_time: new Date().toISOString(),
                unread_count: 0,
                connection_status: user.connection_status,
                is_online: onlineUsers.has(user.id) // Add online status
            }));

            // Sort users: first connected users, then others
            const sortedUsers = formattedUsers.sort((a, b) => {
                // First sort by connection status
                if (a.connection_status === 'connected' && b.connection_status !== 'connected') return -1;
                if (a.connection_status !== 'connected' && b.connection_status === 'connected') return 1;

                // Then sort by online status
                if (a.is_online && !b.is_online) return -1;
                if (!a.is_online && b.is_online) return 1;

                // Then sort by name
                return a.name.localeCompare(b.name);
            });

            setConversations(sortedUsers);

            // We don't need separate message requests in Instagram style
            setMessageRequests([]);

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
                    connection_status: contactData.connection_status,
                    is_online: onlineUsers.has(contactData.user_id)
                };
                setSelectedContact(contact);

                // Clear the stored contact
                localStorage.removeItem('messageUser');

                // Fetch messages for this contact
                fetchMessages(userId, contactData.user_id);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                variant: "destructive",
                title: "Failed to load users",
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
            const response = await getMessageRequests(userId);
            console.log('Message requests response:', response);

            if (response && response.requests && Array.isArray(response.requests)) {
                // Transform API response to match your Contact interface
                const requestsData = await Promise.all(
                    response.requests.map(async (req) => {
                        try {
                            // Fetch user details for this request
                            const userInfo = await fetchUserInfo(req.user_id);
                            return {
                                ...userInfo,
                                last_message: req.last_message || '',
                                last_message_time: req.created_at || new Date().toISOString(),
                                unread_count: req.unread_count || 0,
                                connection_status: 'pending'
                            };
                        } catch (error) {
                            console.error(`Error fetching user ${req.user_id}:`, error);
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
    const fetchMessages = async (userId: string, otherUserId?: string) => {
        try {
            // If otherUserId is not provided, use the selectedContact
            const targetUserId = otherUserId || (selectedContact?.user_id);
            if (!userId || !targetUserId) {
                console.warn('Missing user IDs for fetchMessages');
                return;
            }

            setIsLoading(true);

            // Get messages between the current user and the selected contact
            console.log(`Fetching messages between ${userId} and ${targetUserId}`);

            // Make direct API call to ensure we get the latest data
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                setIsLoading(false);
                return;
            }

            try {
                // Make a direct API call to get messages
                const response = await fetch(`${API_URL}/api/messages/${userId}/${targetUserId}`, {
                    headers: {
                        'x-auth-token': token,
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const data = await response.json();
                console.log('Direct API messages response:', data);

                if (data && data.messages && Array.isArray(data.messages)) {
                    // Sort messages by created_at timestamp to ensure proper order
                    const sortedMessages = [...data.messages].sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );

                    console.log('Sorted messages:', sortedMessages);
                    setMessages(sortedMessages);

                    // Mark messages as read
                    await markMessagesAsRead(userId, targetUserId);
                } else {
                    console.warn('Messages data is not in expected format:', data);
                    setMessages([]);
                }
            } catch (apiError) {
                console.error('Error in direct API call:', apiError);

                // Fall back to using the service function
                const messagesData = await getMessages(userId, targetUserId);
                console.log('Fallback messages data:', messagesData);

                if (messagesData && messagesData.messages && Array.isArray(messagesData.messages)) {
                    // Sort messages by created_at timestamp to ensure proper order
                    const sortedMessages = [...messagesData.messages].sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );

                    setMessages(sortedMessages);

                    // Mark messages as read
                    await markMessagesAsRead(userId, targetUserId);
                } else {
                    console.warn('Fallback messages data is not in expected format:', messagesData);
                    setMessages([]);
                }
            }

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setIsLoading(false);
            toast({
                variant: "destructive",
                title: "Failed to load messages",
                description: "Please try again later.",
            });
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
        }

        return () => {
            // Clean up socket connection
            socketService.disconnect();
        };
    }, [navigate]);

    // Fetch messages when a contact is selected
    useEffect(() => {
        if (selectedContact && isAuthenticated) {
            const userId = localStorage.getItem('userId');
            if (userId) {
                fetchMessages(userId, selectedContact.user_id);
            }
        }
    }, [selectedContact, isAuthenticated]);

    // Set up socket connection for real-time messaging
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
            socket.emit('join', { room: userId });
            console.log(`Joining room: ${userId}`);
        });

        // Listen for both event names for compatibility
        const handleNewMessage = async (message: any) => {
            console.log('New message received:', message);

            // If the message is from the current user, make sure we have the profile picture
            if (message.sender_id === userId) {
                // Ensure we have the current user's profile picture in localStorage
                const userProfilePic = localStorage.getItem('userProfilePic');
                const userData = localStorage.getItem('user');

                if (!userProfilePic && userData) {
                    try {
                        const user = JSON.parse(userData);
                        if (user.profile_picture) {
                            localStorage.setItem('userProfilePic', user.profile_picture);
                            console.log('Updated userProfilePic in localStorage from user data');
                        }
                    } catch (e) {
                        console.error('Error parsing user data:', e);
                    }
                }
            }

            // Always update messages if from current contact, regardless of who sent it
            if (selectedContact &&
                ((message.sender_id === selectedContact.user_id && message.receiver_id === userId) ||
                    (message.sender_id === userId && message.receiver_id === selectedContact.user_id))) {

                // Check if message already exists to prevent duplicates
                setMessages(prev => {
                    // Check if this message ID already exists in our messages
                    const messageExists = prev.some(m =>
                        m.id === message.id ||
                        (m.content === message.content &&
                            m.sender_id === message.sender_id &&
                            m.receiver_id === message.receiver_id &&
                            Math.abs(new Date(m.created_at).getTime() - new Date(message.created_at).getTime()) < 5000) // Within 5 seconds
                    );

                    if (messageExists) {
                        return prev; // Don't add duplicate message
                    }

                    // Sort messages by timestamp to ensure proper order
                    const updatedMessages = [...prev, message].sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );

                    return updatedMessages;
                });

                // Mark as read if we're the receiver
                if (message.sender_id === selectedContact.user_id && message.receiver_id === userId) {
                    markMessagesAsRead(userId, selectedContact.user_id);
                }
            } else {
                // If we receive a message from someone we're not currently chatting with,
                // update the UI to show there's a new message
                console.log('Message from user not in current chat:', message.sender_id);

                // Refresh the conversations list to show the new message indicator
                fetchConversations();
            }

            // Update conversations list with new message
            updateConversationWithMessage(message);
        };

        // Only listen to one event to prevent duplicates
        socket.on('private-message', handleNewMessage);

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

        // Clean up function
        return () => {
            console.log('Cleaning up socket connection...');
            clearInterval(pingInterval);
            socket.off('private-message', handleNewMessage);
            socket.off('new_message', handleNewMessage);
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

            // Add to messages and ensure they're sorted by timestamp
            setMessages(prev => {
                // Check if message already exists to prevent duplicates
                const messageExists = prev.some(m =>
                    m.id === tempMessage.id ||
                    (m.content === tempMessage.content &&
                        m.sender_id === tempMessage.sender_id &&
                        m.receiver_id === tempMessage.receiver_id)
                );

                if (messageExists) {
                    return prev; // Don't add duplicate message
                }

                const updatedMessages = [...prev, tempMessage].sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                return updatedMessages;
            });

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

            // Always use the API to ensure messages are stored in the database
            // Create a new message object
            const messageData = new FormData();
            messageData.append('sender_id', userId);
            messageData.append('receiver_id', selectedContact.user_id);
            messageData.append('content', newMessage);
            messageData.append('message_type', attachment ? determineMessageType(attachment) : 'text');

            console.log('Sending message with data:', {
                sender_id: userId,
                receiver_id: selectedContact.user_id,
                content: newMessage,
                message_type: attachment ? determineMessageType(attachment) : 'text',
                hasAttachment: !!attachment
            });

            // Add attachment if present
            if (attachment) {
                messageData.append('attachment', attachment);
            }

            // Send message to server via API
            try {
                console.log('Sending message via API...');
                const response = await sendMessage(messageData);
                console.log('Message sent successfully:', response);

                // Update the conversation list with the new message
                updateConversationWithMessage({
                    ...tempMessage,
                    id: response.id || tempMessage.id,
                    created_at: response.created_at || tempMessage.created_at,
                    attachment_url: response.attachment_url || tempMessage.attachment_url
                });

                // Also emit via socket for real-time updates if connected
                if (socketInstance && socketInstance.connected) {
                    socketInstance.emit('private-message', {
                        to: selectedContact.user_id,
                        message: newMessage,
                        attachmentUrl: attachment ? URL.createObjectURL(attachment) : null,
                        messageType: attachment ? determineMessageType(attachment) : 'text'
                    });
                }
            } catch (error) {
                console.error('Error sending message via API:', error);
                toast({
                    variant: "destructive",
                    title: "Error sending message",
                    description: "Failed to send your message. Please try again.",
                });
            }

            // Refresh messages to get the actual message from the server
            fetchMessages(userId, selectedContact.user_id);

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

    // Helper function to update the conversations list with a new message
    const updateConversationWithMessage = (message: Message) => {
        // Get the other user's ID (the one who is not the current user)
        const currentUserId = localStorage.getItem('userId');
        if (!currentUserId) return;

        const otherUserId = message.sender_id === currentUserId
            ? message.receiver_id
            : message.sender_id;

        // Check if this user is already in our conversations list
        const existingConversationIndex = conversations.findIndex(
            c => c.user_id === otherUserId
        );

        if (existingConversationIndex >= 0) {
            // Update the existing conversation
            const updatedConversations = [...conversations];
            updatedConversations[existingConversationIndex] = {
                ...updatedConversations[existingConversationIndex],
                last_message: message.content,
                last_message_time: message.created_at,
                unread_count: message.sender_id !== currentUserId && !message.is_read
                    ? updatedConversations[existingConversationIndex].unread_count + 1
                    : updatedConversations[existingConversationIndex].unread_count
            };
            setConversations(updatedConversations);
        } else {
            // This is a new conversation, fetch the user info and add it
            fetchUserInfo(otherUserId)
                .then(userInfo => {
                    if (userInfo) {
                        const newConversation: Contact = {
                            ...userInfo,
                            last_message: message.content,
                            last_message_time: message.created_at,
                            unread_count: message.sender_id !== currentUserId && !message.is_read ? 1 : 0,
                            connection_status: 'none' // We don't know the connection status yet
                        };
                        setConversations(prev => [newConversation, ...prev]);
                    }
                })
                .catch(error => {
                    console.error('Error fetching user info for new conversation:', error);
                });
        }
    };

    return (
        <div className="page-transition animate-fade-in">
            <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row">
                {/* Conversation List */}
                <div className="animate-slide-in-left w-full md:w-auto">
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
                </div>

                {/* Message Display */}
                {selectedContact ? (
                    <div className="flex flex-col flex-1 border-l border-gray-200 dark:border-gray-800 animate-slide-in-right">
                        <MessageDisplay
                            contact={selectedContact}
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
                    <div className="hidden md:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-white/80 to-white/50 dark:from-gray-900/80 dark:to-gray-900/50 backdrop-blur-sm animate-fade-in">
                        <div className="text-center glass-card rounded-xl p-8 shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                            <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mx-auto w-fit mb-4">
                                <MessagesSquare className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="mt-4 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Select a conversation</h3>
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
