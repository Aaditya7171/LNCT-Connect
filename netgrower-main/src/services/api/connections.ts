import api from './client';

// Update connection status
export const updateConnectionStatus = async (targetUserId: string, status: 'pending' | 'accepted' | 'rejected') => {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            throw new Error('User ID not found');
        }

        const response = await api.post(`/api/connections`, {
            userId,
            targetUserId,
            status
        });

        return response.data;
    } catch (error) {
        console.error('Error updating connection status:', error);
        throw error;
    }
};