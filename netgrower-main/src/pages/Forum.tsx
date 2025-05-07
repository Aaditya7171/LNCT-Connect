
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard, PostCardProps } from '@/components/common/PostCard';
import { Search, TrendingUp, Clock, MessageCircle, PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getAllPosts, getTrendingPosts, toggleLike, ForumPost } from '@/services/api/forum';
import { CreatePostDialog } from '@/components/forum/CreatePostDialog';
import { PostDetailDialog } from '@/components/forum/PostDetailDialog';
import { formatDistanceToNow } from 'date-fns';
import { API_URL } from '@/services/api/client';

const Forum = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allPosts, setAllPosts] = useState<ForumPost[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<ForumPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Filter posts when search query changes
  useEffect(() => {
    filterPosts();
  }, [searchQuery, allPosts, trendingPosts, activeTab]);

  // Fetch all posts and trending posts
  const fetchPosts = async () => {
    setIsLoading(true);

    try {
      const [allPostsData, trendingPostsData] = await Promise.all([
        getAllPosts(),
        getTrendingPosts()
      ]);

      setAllPosts(allPostsData);
      setTrendingPosts(trendingPostsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load forum posts. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter posts based on search query and active tab
  const filterPosts = () => {
    const postsToFilter = activeTab === 'trending' ? trendingPosts : allPosts;

    if (!searchQuery.trim()) {
      setFilteredPosts(postsToFilter);
      return;
    }

    const filtered = postsToFilter.filter(post =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredPosts(filtered);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle post creation
  const handlePostCreated = () => {
    fetchPosts();
  };

  // Handle post like
  const handleLike = async (postId: string) => {
    try {
      const result = await toggleLike(postId);

      // Update posts with new like count and status
      const updatePosts = (posts: ForumPost[]) => {
        return posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              likes: result.likes,
              isLiked: result.action === 'liked'
            };
          }
          return post;
        });
      };

      setAllPosts(updatePosts(allPosts));
      setTrendingPosts(updatePosts(trendingPosts));
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: 'Error',
        description: 'Failed to like/unlike post. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle post click to open detail dialog
  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
    setIsDetailDialogOpen(true);
  };

  // Format post data for PostCard component
  const formatPostForCard = (post: ForumPost): Omit<PostCardProps, 'className'> => {
    return {
      id: post.id,
      author: {
        name: post.user_name,
        avatar: post.profile_picture ? `${API_URL}${post.profile_picture}` : '',
        role: 'student' // Default role, can be updated if role info is available
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
    <div className="page-transition pb-20 md:pb-0 animate-fade-in">
      <div className="flex justify-between items-center mb-6 animate-slide-in-left">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Forum</h1>
        <Button
          className="rounded-full gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Post</span>
        </Button>
      </div>

      <div className="relative mb-6 animate-slide-in-right">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="search"
          placeholder="Search discussions..."
          className="pl-10 border border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-3 mb-6 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg p-1 shadow-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <TabsTrigger
            value="all"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
          >
            <MessageCircle className="h-4 w-4" />
            <span>All Posts</span>
          </TabsTrigger>
          <TabsTrigger
            value="trending"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Trending</span>
          </TabsTrigger>
          <TabsTrigger
            value="recent"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
          >
            <Clock className="h-4 w-4" />
            <span>Recent</span>
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <TabsContent value="all" className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {filteredPosts.length === 0 ? (
                <div className="glass-card rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery.trim() ? 'No posts match your search.' : 'No posts yet. Be the first to post!'}
                  </p>
                </div>
              ) : (
                filteredPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="transform transition-all duration-300 hover:translate-y-[-4px]"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <PostCard
                      {...formatPostForCard(post)}
                      onClick={() => handlePostClick(post.id)}
                      onLike={() => handleLike(post.id)}
                      className="bg-gradient-to-br from-white/80 to-white/50 dark:from-gray-900/80 dark:to-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-800/20 shadow-xl hover:shadow-2xl"
                    />
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="trending" className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {filteredPosts.length === 0 ? (
                <div className="glass-card rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery.trim() ? 'No posts match your search.' : 'No trending posts yet.'}
                  </p>
                </div>
              ) : (
                filteredPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="transform transition-all duration-300 hover:translate-y-[-4px]"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <PostCard
                      {...formatPostForCard(post)}
                      onClick={() => handlePostClick(post.id)}
                      onLike={() => handleLike(post.id)}
                      className="bg-gradient-to-br from-white/80 to-white/50 dark:from-gray-900/80 dark:to-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-800/20 shadow-xl hover:shadow-2xl"
                    />
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="recent" className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {filteredPosts.length === 0 ? (
                <div className="glass-card rounded-xl p-6 shadow-xl backdrop-blur-sm border border-white/20 dark:border-gray-800/20 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery.trim() ? 'No posts match your search.' : 'No recent posts yet.'}
                  </p>
                </div>
              ) : (
                filteredPosts
                  .sort((a, b) => {
                    const dateA = new Date(a.created_at);
                    const dateB = new Date(b.created_at);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((post, index) => (
                    <div
                      key={post.id}
                      className="transform transition-all duration-300 hover:translate-y-[-4px]"
                      style={{ animationDelay: `${0.1 * index}s` }}
                    >
                      <PostCard
                        {...formatPostForCard(post)}
                        onClick={() => handlePostClick(post.id)}
                        onLike={() => handleLike(post.id)}
                        className="bg-gradient-to-br from-white/80 to-white/50 dark:from-gray-900/80 dark:to-gray-900/50 backdrop-blur-sm border border-white/20 dark:border-gray-800/20 shadow-xl hover:shadow-2xl"
                      />
                    </div>
                  ))
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

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
};

export default Forum;
