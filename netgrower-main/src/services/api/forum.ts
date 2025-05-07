import api from './client';
import { API_URL } from './client';

// Types
export interface ForumPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name: string;
  profile_picture: string | null;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export interface ForumComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
  profile_picture: string | null;
}

export interface ForumPostDetail extends ForumPost {
  comments: ForumComment[];
}

// Get all forum posts
export const getAllPosts = async (): Promise<ForumPost[]> => {
  try {
    const response = await api.get('/api/forum/posts');
    
    // Check if the user has liked each post
    const userId = localStorage.getItem('userId');
    if (userId) {
      const userLikes = await getUserLikes(userId);
      return response.data.map((post: ForumPost) => ({
        ...post,
        isLiked: userLikes.includes(post.id)
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    throw error;
  }
};

// Get trending forum posts
export const getTrendingPosts = async (): Promise<ForumPost[]> => {
  try {
    const response = await api.get('/api/forum/posts/trending');
    
    // Check if the user has liked each post
    const userId = localStorage.getItem('userId');
    if (userId) {
      const userLikes = await getUserLikes(userId);
      return response.data.map((post: ForumPost) => ({
        ...post,
        isLiked: userLikes.includes(post.id)
      }));
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching trending forum posts:', error);
    throw error;
  }
};

// Get a specific forum post with comments
export const getPostById = async (postId: string): Promise<ForumPostDetail> => {
  try {
    const response = await api.get(`/api/forum/posts/${postId}`);
    
    // Check if the user has liked the post
    const userId = localStorage.getItem('userId');
    if (userId) {
      const userLikes = await getUserLikes(userId);
      return {
        ...response.data,
        isLiked: userLikes.includes(response.data.id)
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching forum post:', error);
    throw error;
  }
};

// Create a new forum post
export const createPost = async (content: string, image?: File): Promise<ForumPost> => {
  try {
    const formData = new FormData();
    formData.append('content', content);
    
    if (image) {
      formData.append('image', image);
    }
    
    const response = await api.post('/api/forum/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating forum post:', error);
    throw error;
  }
};

// Add a comment to a post
export const addComment = async (postId: string, content: string): Promise<ForumComment> => {
  try {
    const response = await api.post(`/api/forum/posts/${postId}/comments`, { content });
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Like/unlike a post
export const toggleLike = async (postId: string): Promise<{ action: 'liked' | 'unliked', likes: number }> => {
  try {
    const response = await api.post(`/api/forum/posts/${postId}/like`);
    return response.data;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// Helper function to get all posts liked by a user
const getUserLikes = async (userId: string): Promise<string[]> => {
  try {
    // This endpoint doesn't exist yet, but we can add it later
    // For now, we'll just return an empty array
    return [];
  } catch (error) {
    console.error('Error fetching user likes:', error);
    return [];
  }
};
