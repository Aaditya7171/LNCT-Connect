import React, { useState, useEffect } from 'react';
import { MessageSquare, PlusCircle } from 'lucide-react';
import { PostCard } from '@/components/common/PostCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getAllPosts, ForumPost } from '@/services/api/forum';
import { CreatePostDialog } from '@/components/forum/CreatePostDialog';
import { PostDetailDialog } from '@/components/forum/PostDetailDialog';
import { formatDistanceToNow } from 'date-fns';
import { API_URL } from '@/services/api/client';

export function ForumPostsSection() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const postsData = await getAllPosts();
      // Get a random selection of 3 posts
      const randomPosts = postsData.sort(() => 0.5 - Math.random()).slice(0, 3);
      setPosts(randomPosts);
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      // If API fails, use mock data
      setPosts([]);
      toast({
        title: 'Error',
        description: 'Failed to load forum posts. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
    setIsDetailDialogOpen(true);
  };

  // Format post data for PostCard component
  const formatPostForCard = (post: ForumPost) => {
    return {
      id: post.id,
      author: {
        name: post.user_name,
        avatar: post.profile_picture ? `${API_URL}${post.profile_picture}` : '',
        role: 'student' // Default role
      },
      content: post.content,
      image: post.image_url ? `${API_URL}${post.image_url}` : undefined,
      timestamp: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
      likes: post.likes,
      comments: post.comments,
      isLiked: post.isLiked || false
    };
  };

  return (
    <div className="space-y-6 transform transition-all duration-300 hover:scale-[1.01]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Forum Posts</h2>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
          size="sm"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add New Post
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          // Skeleton loading UI
          Array.from({ length: 2 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="glass-card rounded-xl p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="bg-gray-300 dark:bg-gray-700 w-10 h-10 rounded-full"></div>
                <div className="space-y-2">
                  <div className="bg-gray-300 dark:bg-gray-700 w-32 h-4 rounded"></div>
                  <div className="bg-gray-300 dark:bg-gray-700 w-24 h-3 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-gray-300 dark:bg-gray-700 w-full h-4 rounded"></div>
                <div className="bg-gray-300 dark:bg-gray-700 w-3/4 h-4 rounded"></div>
              </div>
              <div className="bg-gray-300 dark:bg-gray-700 w-full h-48 rounded-lg"></div>
            </div>
          ))
        ) : posts.length > 0 ? (
          posts.map(post => (
            <div 
              key={post.id} 
              className="transform transition-all duration-300 hover:translate-y-[-4px]"
            >
              <PostCard
                {...formatPostForCard(post)}
                onClick={() => handlePostClick(post.id)}
                className="bg-gradient-to-br from-white/80 to-white/50 dark:from-gray-900/80 dark:to-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-800/20 shadow-xl hover:shadow-2xl"
              />
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-gradient-to-br from-white/80 to-white/50 dark:from-gray-900/80 dark:to-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-800/20 rounded-xl p-6">
            <p className="text-muted-foreground">No forum posts yet. Be the first to create one!</p>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/forum'}
          className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-300 border border-gray-300 dark:border-gray-700 shadow-sm hover:shadow-md"
        >
          View All Posts
        </Button>
      </div>

      {/* Create Post Dialog */}
      <CreatePostDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
        onPostCreated={handlePostCreated} 
      />
      
      {/* Post Detail Dialog */}
      <PostDetailDialog 
        isOpen={isDetailDialogOpen} 
        onClose={() => setIsDetailDialogOpen(false)} 
        postId={selectedPostId} 
      />
    </div>
  );
}
