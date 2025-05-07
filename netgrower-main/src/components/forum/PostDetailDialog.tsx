import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getPostById, toggleLike, ForumPostDetail, ForumComment } from '@/services/api/forum';
import { CommentSection } from './CommentSection';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_URL } from '@/services/api/client';

interface PostDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string | null;
}

export function PostDetailDialog({ isOpen, onClose, postId }: PostDetailDialogProps) {
  const [post, setPost] = useState<ForumPostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { toast } = useToast();
  
  // Fetch post details when dialog opens
  useEffect(() => {
    if (isOpen && postId) {
      fetchPostDetails();
    }
  }, [isOpen, postId]);
  
  const fetchPostDetails = async () => {
    if (!postId) return;
    
    setIsLoading(true);
    
    try {
      const postData = await getPostById(postId);
      setPost(postData);
    } catch (error) {
      console.error('Error fetching post details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load post details. Please try again.',
        variant: 'destructive'
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLike = async () => {
    if (!post) return;
    
    setIsLiking(true);
    
    try {
      const result = await toggleLike(post.id);
      
      // Update post with new like count and status
      setPost(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          likes: result.likes,
          isLiked: result.action === 'liked'
        };
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to like/unlike post. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleCommentAdded = (comment: ForumComment) => {
    // Update post with new comment
    setPost(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        comments: [...prev.comments, comment],
        comments_count: prev.comments.length + 1
      };
    });
  };
  
  // Format the post time
  const formatPostTime = (timeString: string) => {
    try {
      return formatDistanceToNow(new Date(timeString), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format profile picture URL
  const formatProfilePicture = (profilePicture: string | null) => {
    if (!profilePicture) return null;
    
    // If the URL already includes the API_URL, return it as is
    if (profilePicture.startsWith('http')) {
      return profilePicture;
    }
    
    // Otherwise, prepend the API_URL
    return `${API_URL}${profilePicture.startsWith('/') ? '' : '/'}${profilePicture}`;
  };
  
  // Format post image URL
  const formatPostImage = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    
    // If the URL already includes the API_URL, return it as is
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Otherwise, prepend the API_URL
    return `${API_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : post ? (
          <>
            <DialogHeader>
              <DialogTitle>Post Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Post author info */}
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage 
                    src={formatProfilePicture(post.profile_picture)} 
                    alt={post.user_name} 
                  />
                  <AvatarFallback>{getInitials(post.user_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{post.user_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatPostTime(post.created_at)}
                  </p>
                </div>
              </div>
              
              {/* Post content */}
              <div>
                <p className="whitespace-pre-line">{post.content}</p>
                
                {post.image_url && (
                  <div className="mt-4">
                    <img 
                      src={formatPostImage(post.image_url)} 
                      alt="Post" 
                      className="rounded-md max-h-[300px] object-contain"
                    />
                  </div>
                )}
              </div>
              
              {/* Like button */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  <Heart 
                    className={cn(
                      "w-5 h-5", 
                      post.isLiked ? "fill-destructive text-destructive" : ""
                    )} 
                  />
                  <span>{post.likes}</span>
                </Button>
              </div>
              
              {/* Comments section */}
              <div className="pt-4 border-t">
                <CommentSection 
                  postId={post.id} 
                  comments={post.comments} 
                  onCommentAdded={handleCommentAdded} 
                />
              </div>
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Post not found or has been deleted.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
