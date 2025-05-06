import api from './client';

// Get all conversations for a user
export const getConversations = async (userId: string) => {
    try {
        if (!userId) {
            console.warn('No user ID provided to getConversations');
            return [];
        }

        const response = await api.get(`/api/messages/conversations/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching conversations:', error);
        // Return empty array instead of throwing
        return [];
    }
};

// Get message requests
export const getMessageRequests = async (userId: string) => {
    try {
        if (!userId) {
            console.warn('No user ID provided to getMessageRequests');
            return [];
        }

        const response = await api.get(`/api/messages/requests/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching message requests:', error);
        // Return empty array instead of throwing
        return [];
    }
};

// Get messages between two users
export const getMessages = async (userId: string, otherUserId: string) => {
    try {
        if (!userId || !otherUserId) {
            console.warn('Missing user IDs for getMessages');
            return [];
        }

        const response = await api.get(`/api/messages/${userId}/${otherUserId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching messages:', error);
        // Return empty array instead of throwing
        return [];
    }
};

// Send a message
// Update the sendMessage function to properly include the authentication token
// Update the sendMessage function to properly handle FormData
export const sendMessage = async (messageData: FormData) => {
    try {
        // Get the token from localStorage
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Authentication token not found');
        }

        console.log('Sending message with FormData containing:', {
            sender_id: messageData.get('sender_id'),
            receiver_id: messageData.get('receiver_id'),
            message_type: messageData.get('message_type'),
            hasContent: !!messageData.get('content'),
            hasAttachment: !!messageData.get('attachment')
        });

        // Make sure we're sending the token in the headers
        const response = await api.post('/api/messages/send', messageData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-auth-token': token,
                // Don't set Content-Type for FormData - axios will set it with boundary
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

// Update the markMessagesAsRead function
export const markMessagesAsRead = async (userId: string, senderId: string) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Authentication token not found');
        }

        const response = await api.put('/api/messages/read', { userId, senderId });
        return response.data;
    } catch (error) {
        console.error('Error marking messages as read:', error);
        // Don't throw the error to prevent breaking the UI flow
        return null;
    }
};